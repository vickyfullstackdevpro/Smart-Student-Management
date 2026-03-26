import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const envVars = Object.fromEntries(envFile.split('\n').filter(line => line && !line.startsWith('#')).map(line => {
  const idx = line.indexOf('=');
  return [line.slice(0, idx), line.slice(idx + 1).replace(/^"|"$/g, '').replace(/^'|'$/g, '')];
}));

const url = envVars.VITE_SUPABASE_URL;
const key = envVars.VITE_SUPABASE_ANON_KEY;

async function check() {
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    const text = await res.text();
    console.log("Response text:", text.slice(0, 500));
  } catch (e) {
    console.error(e);
  }
}
check();
