import { supabase } from './src/config/supabase.js';

async function debugTeacherAuth() {
  try {
    // Test with a valid teacher user
    console.log('Testing teacher login...');
    
    // First, let's check what users exist
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 2); // teacher role
    
    console.log('Teacher users found:', users);
    console.log('Users error:', usersError);
    
    if (users && users.length > 0) {
      const teacher = users[0];
      console.log('Testing login for teacher:', teacher.username);
      
      // Try to login with this user
      // We need to know the email, let's assume it's username@example.com
      const email = teacher.username + '@example.com';
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: 'password123' // default password
      });
      
      console.log('Auth result:');
      console.log('Data:', authData);
      console.log('Error:', authError);
      
      if (authData.session) {
        console.log('Got token:', authData.session.access_token);
        
        // Now test the /api/auth/me endpoint
        const response = await fetch('http://localhost:3000/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${authData.session.access_token}`
          }
        });
        
        const result = await response.json();
        console.log('/api/auth/me response:', result);
      }
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

debugTeacherAuth();