import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const envVars = Object.fromEntries(envFile.split('\n').filter(line => line && !line.startsWith('#')).map(line => {
  const idx = line.indexOf('=');
  return [line.slice(0, idx), line.slice(idx + 1).replace(/^"|"$/g, '').replace(/^'|'$/g, '')];
}));

const url = envVars.VITE_SUPABASE_URL;
const key = envVars.VITE_SUPABASE_ANON_KEY;

async function check() {
  const tables = ['users', 'students', 'faculty', 'pending_requests', 'requests', 'signup_requests', 'account_requests', 'user_requests', 'profiles', 'registrations', 'pending_users', 'gate_pass_requests'];
  for (const table of tables) {
    try {
      const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      if (res.ok) {
        console.log(`Table ${table}: EXISTS`);
      } else {
        const err = await res.json();
        console.log(`Table ${table}: ERROR - ${err.message}`);
      }
    } catch (e) {
      console.log(`Table ${table}: FETCH ERROR - ${e.message}`);
    }
  }
}
check();
