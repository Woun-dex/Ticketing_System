import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const bookingSuccess = new Rate('booking_success_rate');
const bookingLatency = new Trend('booking_latency');

export const options = {
    scenarios: {
        smoke_test: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 10 },   // Ramp to 10 users
                { duration: '1m', target: 50 },    // Ramp to 50 users
                { duration: '1m', target: 50 },    // Stay at 50 users
                { duration: '30s', target: 0 },    // Ramp down
            ],
        },
    },
    thresholds: {
        'http_req_duration': ['p(95)<2000'],
        'booking_success_rate': ['rate>0.90'],
        'http_req_failed': ['rate<0.10'],
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Test data
const events = ['EVT001', 'EVT002', 'EVT003'];

function authenticate() {
    const userId = (__VU % 100) + 1;
    const loginPayload = JSON.stringify({
        email: `testuser${userId}@loadtest.com`,
        password: 'LoadTest123!',
    });

    const loginResponse = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
        headers: { 'Content-Type': 'application/json' },
    });

    if (loginResponse.status === 200) {
        try {
            const body = JSON.parse(loginResponse.body);
            return body.token || body.accessToken || body.jwt;
        } catch (e) {
            console.error(`Parse error: ${e.message}`);
        }
    } else {
        console.error(`Login failed: ${loginResponse.status} - ${loginResponse.body}`);
    }
    return null;
}

export default function () {
    // Authenticate once per iteration
    const token = authenticate();
    
    if (!token) {
        console.error(`VU ${__VU}: Failed to authenticate`);
        sleep(1);
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };

    // Test 1: Search events
    const searchResponse = http.get(`${BASE_URL}/api/search/events?query=concert`, {
        headers: headers,
    });

    check(searchResponse, {
        'search successful': (r) => r.status === 200 || r.status === 404,
    });

    // Test 2: Get event details
    const eventId = events[Math.floor(Math.random() * events.length)];
    const eventResponse = http.get(`${BASE_URL}/api/events/${eventId}`, {
        headers: headers,
    });

    check(eventResponse, {
        'event details retrieved': (r) => r.status === 200 || r.status === 404,
    });

    // Test 3: Create booking
    const bookingPayload = JSON.stringify({
        eventId: eventId,
        seats: [
            {
                seatId: `A${Math.floor(Math.random() * 100) + 1}`,
                category: 'STANDARD',
            }
        ],
    });

    const startTime = Date.now();
    const bookingResponse = http.post(`${BASE_URL}/api/bookings/reserve`, bookingPayload, {
        headers: headers,
    });
    const latency = Date.now() - startTime;

    const success = check(bookingResponse, {
        'booking request processed': (r) => r.status < 500,
        'booking created or queued': (r) => r.status === 200 || r.status === 201 || r.status === 202,
    });

    bookingSuccess.add(success);
    bookingLatency.add(latency);

    if (!success) {
        console.error(`VU ${__VU}: Booking failed - ${bookingResponse.status}: ${bookingResponse.body}`);
    }

    sleep(1);
}

export function teardown(data) {
    console.log('Load test completed');
}
