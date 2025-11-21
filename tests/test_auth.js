import { supabase } from './src/config/supabase.js';

async function testAuth() {
  try {
    // Test login
    console.log('Testing login...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'teacher1@example.com',
      password: 'password123'
    });
    
    console.log('Login result:');
    console.log('Data:', data);
    console.log('Error:', error);
    
    if (data.session) {
      console.log('Token:', data.session.access_token);
      
      // Test getting user info
      const { data: userData, error: userError } = await supabase.auth.getUser(data.session.access_token);
      console.log('User data:', userData);
      console.log('User error:', userError);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testAuth();