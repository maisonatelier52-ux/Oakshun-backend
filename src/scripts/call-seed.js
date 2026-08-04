fetch('https://oakshun-backend.vercel.app/auth/seed-admin', { method: 'POST' })
  .then(res => res.json())
  .then(data => console.log('Response:', data))
  .catch(err => console.error('Error:', err));
