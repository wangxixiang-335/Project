import { supabase } from './src/config/supabase.js';

async function testTeacherLogin() {
  console.log('Testing teacher login with correct credentials...');
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'teacher1@example.com',
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
  }
}

testTeacherLogin();