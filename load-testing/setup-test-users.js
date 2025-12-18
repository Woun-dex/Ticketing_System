import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const NUM_USERS = 100; // Create 100 test users

export const options = {
    iterations: NUM_USERS,
    vus: 10,
};

export default function () {
    const userId = __VU; // Virtual User ID (1 to NUM_USERS)
    const payload = JSON.stringify({
        email: `testuser${userId}@loadtest.com`,
        password: 'LoadTest123!',
        name: `Test User ${userId}`,
        phone: `555-0${String(userId).padStart(3, '0')}`,
    });

    const response = http.post(`${BASE_URL}/api/auth/register`, payload, {
        headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 201 || response.status === 200) {
        console.log(`✓ Created user: testuser${userId}@loadtest.com`);
    } else if (response.status === 409) {
        console.log(`- User already exists: testuser${userId}@loadtest.com`);
    } else {
        console.error(`✗ Failed to create user ${userId}: ${response.status} - ${response.body}`);
    }
}
