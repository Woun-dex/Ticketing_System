import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const spikeSuccess = new Rate('spike_success_rate');
const spikeLatency = new Trend('spike_latency', true);

// Spike test - sudden surge in traffic (flash sale scenario)
export const options = {
    scenarios: {
        spike: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 100 },     // Normal load
                { duration: '10s', target: 50000 },   // SPIKE! (like ticket release)
                { duration: '1m', target: 50000 },    // Stay at spike
                { duration: '10s', target: 100 },     // Quick drop
                { duration: '1m', target: 100 },      // Normal load
                { duration: '10s', target: 75000 },   // Another spike
                { duration: '2m', target: 75000 },    // Sustained spike
                { duration: '30s', target: 0 },       // Ramp down
            ],
        },
    },
    thresholds: {
        'http_req_duration': ['p(99)<5000'],  // P99 under 5s even during spike
        'spike_success_rate': ['rate>0.90'],   // 90% success even during spike
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
    const eventId = 'HOT_EVENT_001'; // Popular event everyone wants
    const userId = `USER_${Math.floor(Math.random() * 1000000)}`;
    
    const payload = JSON.stringify({
        eventId: eventId,
        seats: [
            { seatId: `SEAT-${Math.floor(Math.random() * 10000)}`, category: 'PREMIUM' }
        ],
        userId: userId,
    });

    const headers = {
        'Content-Type': 'application/json',
    };

    const startTime = Date.now();
    const response = http.post(`${BASE_URL}/api/bookings/reserve`, payload, {
        headers: headers,
        timeout: '30s',
    });
    const latency = Date.now() - startTime;

    const success = check(response, {
        'status is success': (r) => r.status >= 200 && r.status < 300,
        'not server error': (r) => r.status < 500,
    });

    spikeLatency.add(latency);
    spikeSuccess.add(success ? 1 : 0);

    sleep(Math.random() * 0.5); // Minimal think time during spike
}
