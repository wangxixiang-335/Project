import { supabase } from './src/config/supabase.js';

async function testCorrectLogin() {
  try {
    console.log('Testing teacher login with correct email...');
    
    // Use the correct email from the auth users list
    const { data, error } = await supabase.auth.signInWithPassword({
      email: '3888952060@qq.com',
      password: 'password123'
    });
    
    console.log('Login result:');
    console.log('Data:', data);
    console.log('Error:', error);
    
    if (data.session) {
      console.log('✅ Login successful! Token:', data.session.access_token);
      
      // Test the /api/auth/me endpoint
      const response = await fetch('http://localhost:3000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`
        }
      });
      
      const result = await response.json();
      console.log('/api/auth/me response:', result);
      
      // Test teacher endpoints
      const teacherResponse = await fetch('http://localhost:3000/api/teacher/my-projects?page=1&pageSize=10', {
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`
        }
      });
      
      const teacherResult = await teacherResponse.json();
      console.log('/api/teacher/my-projects response:', teacherResult);
      
      // Test student achievements endpoint
      const studentResponse = await fetch('http://localhost:3000/api/teacher/student-achievements?page=1&pageSize=10', {
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`
        }
      });
      
      const studentResult = await studentResponse.json();
      console.log('/api/teacher/student-achievements response:', studentResult);
      
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testCorrectLogin();