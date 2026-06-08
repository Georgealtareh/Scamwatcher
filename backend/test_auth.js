const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

async function testAuth() {
    try {
        console.log('Testing Signup...');
        let token;
        try {
            const signupRes = await axios.post(`${API_URL}/auth/signup`, {
                email: 'tester2@example.com',
                password: 'password123',
                fullName: 'Test User'
            });
            console.log('Signup Success:', signupRes.data.user.email);
            token = signupRes.data.token;
        } catch (e) {
            console.log('Signup skipped or failed (user might exist)');
        }

        console.log('Testing Login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'tester2@example.com',
            password: 'password123'
        });
        console.log('Login Success:', loginRes.data.user.fullName);
        if (!token) token = loginRes.data.token;

        console.log('Testing /me endpoint...');
        const meRes = await axios.get(`${API_URL}/auth/me`, {
            headers: { 'x-auth-token': token }
        });
        console.log('Me Success:', meRes.data.fullName, 'Premium:', meRes.data.is_premium);

        console.log('Testing Premium Toggle...');
        const premRes = await axios.put(`${API_URL}/user/premium`, { isPremium: true }, {
            headers: { 'x-auth-token': token }
        });
        console.log('Premium Success:', premRes.data.message);

        const meRes2 = await axios.get(`${API_URL}/auth/me`, {
            headers: { 'x-auth-token': token }
        });
        console.log('Me Premium Check:', meRes2.data.is_premium === 1 ? 'Yes' : 'No');

    } catch (error) {
        console.error('Test Failed:', error.response ? error.response.data : error.message);
    }
}

testAuth();
