import { supabase } from './src/config/supabase.js';

async function checkTables() {
  try {
    console.log('Testing achievements table...');
    const { data, error } = await supabase.from('achievements').select('*').limit(1);
    console.log('Achievements data:', data);
    console.log('Achievements error:', error);
    
    console.log('\nTesting users table...');
    const { data: usersData, error: usersError } = await supabase.from('users').select('*').limit(1);
    console.log('Users data:', usersData);
    console.log('Users error:', usersError);
    
    console.log('\nTesting approval_records table...');
    const { data: approvalData, error: approvalError } = await supabase.from('approval_records').select('*').limit(1);
    console.log('Approval records data:', approvalData);
    console.log('Approval records error:', approvalError);
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkTables();