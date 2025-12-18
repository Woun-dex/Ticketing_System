import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const bookingSuccess = new Rate('booking_success_rate');
const bookingLatency = new Trend('booking_latency', true);
const lockFailures = new Counter('lock_failures');
const queuedRequests = new Counter('queued_requests');

// Test configuration for high-concurrency booking scenario
export const options = {
    scenarios: {
        // Ramp up to 50k concurrent users
        high_load: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 1000 },   // Warm up
                { duration: '5m', target: 10000 },  // Ramp to 10k
                { duration: '5m', target: 25000 },  // Ramp to 25k
                { duration: '10m', target: 50000 }, // Ramp to 50k
                { duration: '10m', target: 50000 }, // Stay at 50k
                { duration: '5m', target: 100000 }, // Peak at 100k
                { duration: '5m', target: 100000 }, // Sustain 100k
                { duration: '3m', target: 0 },      // Ramp down
            ],
            gracefulRampDown: '30s',
        },
    },
    thresholds: {
        'http_req_duration{name:booking}': ['p(99)<2000'],  // P99 < 2s
        'http_req_duration{name:booking}': ['p(95)<1000'],  // P95 < 1s
        'booking_success_rate': ['rate>0.95'],              // 95% success
        'http_req_failed': ['rate<0.05'],                   // <5% errors
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

// Test data - simulate event and seat selection
const events = ['EVT001', 'EVT002', 'EVT003', 'EVT004', 'EVT005'];
const seatCategories = ['VIP', 'PREMIUM', 'STANDARD', 'ECONOMY'];

function getRandomEvent() {
    return events[Math.floor(Math.random() * events.length)];
}

function getRandomSeats(count) {
    const seats = [];
    const category = seatCategories[Math.floor(Math.random() * seatCategories.length)];
    for (let i = 0; i < count; i++) {
        const row = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const number = Math.floor(Math.random() * 50) + 1;
        seats.push({
            seatId: `${category}-${row}${number}`,
            category: category,
            row: row,
            number: number,
        });
    }
    return seats;
}

function authenticate() {
    // Use one of the pre-created test users (1-100)
    const userId = (__VU % 100) + 1;
    const loginPayload = JSON.stringify({
        email: `testuser${userId}@loadtest.com`,
        password: 'LoadTest123!',
    });

    const loginResponse = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'login' },
    });

    if (loginResponse.status === 200) {
        try {
            const body = JSON.parse(loginResponse.body);
            return body.token || body.accessToken || body.jwt;
        } catch (e) {
            console.error(`Failed to parse login response: ${e.message}`);
            return null;
        }
    } else {
        console.error(`Login failed for testuser${userId}@loadtest.com: ${loginResponse.status}`);
        return null;
    }
    return null;
}

export function setup() {
    // Register test users if needed
    console.log('Setting up load test...');
    return {
        startTime: new Date().toISOString(),
    };
}

export default function () {
    const token = AUTH_TOKEN || authenticate();
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };

    group('Booking Flow', function () {
        // Step 1: Search for events
        group('Search Events', function () {
            const searchResponse = http.get(`${BASE_URL}/api/search/events?query=concert`, {
                headers: headers,
                tags: { name: 'search' },
            });

            check(searchResponse, {
                'search status is 200': (r) => r.status === 200,
            });
        });

        // Step 2: Get event details
        const eventId = getRandomEvent();
        group('Get Event Details', function () {
            const eventResponse = http.get(`${BASE_URL}/api/events/${eventId}`, {
                headers: headers,
                tags: { name: 'event_details' },
            });

            check(eventResponse, {
                'event details status is 200': (r) => r.status === 200,
            });
        });

        // Step 3: Create reservation (lock seats)
        group('Create Reservation', function () {
            const seats = getRandomSeats(Math.floor(Math.random() * 4) + 1);
            const reservationPayload = JSON.stringify({
                eventId: eventId,
                seats: seats,
                userId: `USER${Math.floor(Math.random() * 100000)}`,
            });

            const startTime = Date.now();
            const reservationResponse = http.post(
                `${BASE_URL}/api/bookings/reserve`,
                reservationPayload,
                {
                    headers: headers,
                    tags: { name: 'reservation' },
                }
            );
            const latency = Date.now() - startTime;

            const success = check(reservationResponse, {
                'reservation created': (r) => r.status === 200 || r.status === 201,
                'reservation queued': (r) => r.status === 202,
                'lock acquired': (r) => r.status !== 409,
            });

            if (reservationResponse.status === 409) {
                lockFailures.add(1);
            }
            if (reservationResponse.status === 202) {
                queuedRequests.add(1);
            }

            bookingLatency.add(latency);
            bookingSuccess.add(success ? 1 : 0);

            if (reservationResponse.status === 200 || reservationResponse.status === 201) {
                try {
                    const reservationData = JSON.parse(reservationResponse.body);
                    const reservationId = reservationData.reservationId || reservationData.id;

                    // Step 4: Complete booking with payment
                    sleep(Math.random() * 2); // Simulate user entering payment details

                    group('Complete Booking', function () {
                        const bookingPayload = JSON.stringify({
                            reservationId: reservationId,
                            paymentMethod: 'CREDIT_CARD',
                            paymentDetails: {
                                cardNumber: '4111111111111111',
                                expiryMonth: '12',
                                expiryYear: '2025',
                                cvv: '123',
                            },
                        });

                        const bookingStartTime = Date.now();
                        const bookingResponse = http.post(
                            `${BASE_URL}/api/bookings/confirm`,
                            bookingPayload,
                            {
                                headers: headers,
                                tags: { name: 'booking' },
                            }
                        );
                        const bookingLatencyMs = Date.now() - bookingStartTime;

                        const bookingSuccess = check(bookingResponse, {
                            'booking confirmed': (r) => r.status === 200 || r.status === 201,
                        });

                        bookingLatency.add(bookingLatencyMs);
                    });
                } catch (e) {
                    console.log('Failed to parse reservation response');
                }
            }
        });
    });

    sleep(Math.random() * 3 + 1); // Random think time between 1-4 seconds
}

export function teardown(data) {
    console.log(`Load test completed. Started at: ${data.startTime}`);
}
