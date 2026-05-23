process.env.JWT_SECRET = "super-secret-jwt-key-change-in-production-min-32-chars";

const { signToken } = require('../lib/auth');

async function run() {
  try {
    const payload = {
      id: 2,
      nama: 'Test Programming Admin',
      email: 'admin.programming@gmail.com',
      role: 'admin_programming',
    };
    const token = await signToken(payload);
    console.log('Generated session token!');

    const url = 'http://localhost:3001/api/siswa?page=1&limit=15&ekskul=programming';
    console.log('Fetching', url);
    const res = await fetch(url, {
      headers: {
        'Cookie': `ekskul_session=${token}`,
      },
    });
    console.log('Response status:', res.status);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (err) {
    console.error('Request failed:', err);
  }
}

run();
