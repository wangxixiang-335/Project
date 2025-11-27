import axios from 'axios';
import { supabase } from './src/config/supabase.js';

const API_BASE_URL = 'http://localhost:3000/api';

async function testStudentSubmit() {
  console.log('Starting student submission test...\n');
  
  try {
    // Student login
    console.log('1. Student login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'student1@example.com',
      password: 'password123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Student login failed');
    }
    
    const token = loginResponse.data.data.token;
    const studentId = loginResponse.data.data.user.id;
    
    console.log('Student login successful, ID:', studentId);
    
    // Test student submission with cover image
    console.log('\n2. Testing student submission with cover image...');
    
    const submitData = {
      title: 'Test Student Submission with Cover Image',
      content_html: '<p>This is test content with cover image</p>',
      video_url: 'https://example.com/cover-image.jpg', // Cover image URL
      category: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    };
    
    console.log('Submit data:', JSON.stringify(submitData, null, 2));
    
    const submitResponse = await axios.post(`${API_BASE_URL}/projects`, submitData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Submit response:', submitResponse.data);
    
    if (submitResponse.data.success) {
      console.log('Student submission successful!');
      console.log('Achievement ID:', submitResponse.data.data.id);
      
      // Verify database data
      console.log('\n3. Verifying database data...');
      
      const { data: achievement, error } = await supabase
        .from('achievements')
        .select('id, title, cover_url, video_url, status')
        .eq('id', submitResponse.data.data.id)
        .single();

      if (error) {
        console.error('Query achievement error:', error);
        return;
      }
      
      console.log('Database achievement data:');
      console.log(`   Title: ${achievement.title}`);
      console.log(`   cover_url: ${achievement.cover_url}`);
      console.log(`   video_url: ${achievement.video_url}`);
      console.log(`   Status: ${achievement.status}`);
      
      if (achievement.cover_url === 'https://example.com/cover-image.jpg') {
        console.log('SUCCESS: Cover image URL correctly saved to database');
      } else {
        console.log('FAILED: Cover image URL not saved correctly. Current value:', achievement.cover_url);
      }
      
    } else {
      throw new Error('Student submission failed: ' + submitResponse.data.message);
    }
    
    console.log('\nTest completed!');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run test
testStudentSubmit();