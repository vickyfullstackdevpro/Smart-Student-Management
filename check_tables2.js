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
    const data = await res.json();
    console.log("Response keys:", Object.keys(data));
    if (data.definitions) {
      console.log("tables:", Object.keys(data.definitions));
    } else if (data.paths) {
      console.log("paths:", Object.keys(data.paths).filter(p => p.startsWith('/') && p.length > 1).map(p => p.slice(1)));
    } else {
      console.log("Full response:", JSON.stringify(data).slice(0, 1000));
    }
  } catch (e) {
    console.error(e);
  }
}
check();
