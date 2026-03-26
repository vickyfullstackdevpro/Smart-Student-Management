
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const envVars = Object.fromEntries(envFile.split('\n').filter(line => line && !line.startsWith('#')).map(line => {
  const idx = line.indexOf('=');
  return [line.slice(0, idx), line.slice(idx + 1).replace(/^"|"$/g, '').replace(/^'|'$/g, '')];
}));

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  console.log('Checking students table...');
  const { data: students, error: studentError } = await supabase.from('students').select('*').limit(1);
  if (studentError) {
    console.error('Error fetching students:', studentError);
  } else if (students && students.length > 0) {
    console.log('Students columns:', Object.keys(students[0]));
  } else {
    console.log('No students found or table empty.');
  }

  console.log('\nChecking requests table...');
  const { data: requests, error: requestError } = await supabase.from('requests').select('*').limit(1);
  if (requestError) {
    console.error('Error fetching requests:', requestError);
  } else if (requests && requests.length > 0) {
    console.log('Requests columns:', Object.keys(requests[0]));
  } else {
    console.log('No requests found or table empty.');
  }

  console.log('\nChecking for pending_requests table...');
  const { data: pending, error: pendingError } = await supabase.from('pending_requests').select('*').limit(1);
  if (pendingError) {
    console.error('Error fetching pending_requests:', pendingError.message);
  } else {
    console.log('pending_requests table exists.');
  }
  
  console.log('\nChecking users table...');
  const { data: users, error: userError } = await supabase.from('users').select('*').limit(1);
  if (userError) {
    console.error('Error fetching users:', userError);
  } else if (users && users.length > 0) {
    console.log('Users columns:', Object.keys(users[0]));
  }
}

checkSchema();
