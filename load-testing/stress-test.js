import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom metrics for stress testing
const stressLatency = new Trend('stress_latency', true);
const stressSuccess = new Rate('stress_success_rate');
const errorCount = new Counter('error_count');

// Stress test - find breaking point
export const options = {
    scenarios: {
        stress: {
            executor: 'ramping-arrival-rate',
            startRate: 100,
            timeUnit: '1s',
            preAllocatedVUs: 50000,
            maxVUs: 150000,
            stages: [
                { duration: '2m', target: 500 },    // Start moderate
                { duration: '3m', target: 2000 },   // Ramp up
                { duration: '3m', target: 5000 },   // Getting heavy
                { duration: '3m', target: 10000 },  // Very heavy
                { duration: '3m', target: 15000 },  // Extreme load
                { duration: '3m', target: 20000 },  // Breaking point?
                { duration: '2m', target: 0 },      // Recovery
            ],
        },
    },
    thresholds: {
        'http_req_duration': ['p(95)<10000'], // P95 under 10s
        'error_count': ['count<1000'],         // Less than 1000 total errors
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Distribute load across different endpoints
const endpoints = [
    { method: 'GET', path: '/api/events', weight: 30 },
    { method: 'GET', path: '/api/search/events?query=concert', weight: 25 },
    { method: 'POST', path: '/api/bookings/reserve', weight: 25, hasPayload: true },
    { method: 'GET', path: '/api/bookings/user/USER001', weight: 10 },
    { method: 'POST', path: '/api/auth/login', weight: 10, hasPayload: true, isAuth: true },
];

function selectEndpoint() {
    const rand = Math.random() * 100;
    let cumWeight = 0;
    for (const endpoint of endpoints) {
        cumWeight += endpoint.weight;
        if (rand <= cumWeight) {
            return endpoint;
        }
    }
    return endpoints[0];
}

function getPayload(endpoint) {
    if (endpoint.isAuth) {
        return JSON.stringify({
            email: `user${Math.floor(Math.random() * 10000)}@test.com`,
            password: 'TestPassword123!',
        });
    }
    
    if (endpoint.path.includes('reserve')) {
        return JSON.stringify({
            eventId: `EVT00${Math.floor(Math.random() * 5) + 1}`,
            seats: [
                { seatId: `SEAT-${Math.floor(Math.random() * 10000)}`, category: 'STANDARD' }
            ],
            userId: `USER_${Math.floor(Math.random() * 100000)}`,
        });
    }
    
    return null;
}

export default function () {
    const endpoint = selectEndpoint();
    const url = `${BASE_URL}${endpoint.path}`;
    const headers = { 'Content-Type': 'application/json' };
    
    let response;
    const startTime = Date.now();
    
    try {
        if (endpoint.method === 'POST' && endpoint.hasPayload) {
            const payload = getPayload(endpoint);
            response = http.post(url, payload, { headers: headers, timeout: '30s' });
        } else {
            response = http.get(url, { headers: headers, timeout: '30s' });
        }
    } catch (e) {
        errorCount.add(1);
        stressSuccess.add(0);
        return;
    }
    
    const latency = Date.now() - startTime;
    stressLatency.add(latency);
    
    const success = check(response, {
        'status is not 5xx': (r) => r.status < 500,
        'response time < 10s': (r) => r.timings.duration < 10000,
    });
    
    if (!success || response.status >= 500) {
        errorCount.add(1);
    }
    
    stressSuccess.add(success ? 1 : 0);
}
