import fs from 'fs';
import { createClient } from '@supabase/supabase-client';

const envFile = fs.readFileSync('.env', 'utf8');
const envVars = Object.fromEntries(envFile.split('\n').filter(line => line && !line.startsWith('#')).map(line => {
  const idx = line.indexOf('=');
  return [line.slice(0, idx), line.slice(idx + 1).replace(/^"|"$/g, '').replace(/^'|'$/g, '')];
}));

const url = envVars.VITE_SUPABASE_URL;
const key = envVars.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function check() {
  const tables = ['users', 'students', 'faculty', 'pending_requests', 'requests'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table ${table}: ERROR - ${error.message}`);
    } else {
      console.log(`Table ${table}: EXISTS`);
    }
  }
}
check();
