const fetch = require('node-fetch');

async function run() {
  const payload = {
    event_name: 'TestEvent',
    event_id: 'test_123',
    event_source_url: 'http://localhost',
    user_data: {
      email: 'test@example.com',
      phone: '0555123456',
      full_name: 'John Doe',
      wilaya: 'Alger',
      baladia: 'Bab Ezzouar',
      fbp: 'fb.1.1234.5678',
      fbc: 'fb.1.1234.abcd'
    }
  };

  const res = await fetch('http://localhost:3000/api/meta-capi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.dir(data, { depth: null });
}
run();
