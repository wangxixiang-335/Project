import { supabase } from './src/config/supabase.js';
import { spawn } from 'child_process';

async function testWithServer() {
  // Start the server
  console.log('🚀 Starting backend server...');
  const server = spawn('node', ['src/app.js'], { 
    stdio: 'pipe',
    cwd: process.cwd()
  });

  server.stdout.on('data', (data) => {
    console.log(`[SERVER] ${data.toString().trim()}`);
  });

  server.stderr.on('data', (data) => {
    console.error(`[SERVER ERROR] ${data.toString().trim()}`);
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    console.log('🔑 Testing teacher login...');
    
    // Login as teacher
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: '3888952060@qq.com',
      password: 'password123'
    });
    
    if (authError) {
      console.error('❌ Login failed:', authError);
      server.kill();
      return;
    }
    
    console.log('✅ Login successful!');
    const token = authData.session.access_token;
    
    // Test teacher endpoints
    console.log('📋 Testing /api/teacher/my-projects...');
    const myProjectsResponse = await fetch('http://localhost:3000/api/teacher/my-projects?page=1&pageSize=10', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const myProjectsResult = await myProjectsResponse.json();
    console.log('My projects result:', myProjectsResult);
    
    console.log('📚 Testing /api/teacher/student-achievements...');
    const studentAchievementsResponse = await fetch('http://localhost:3000/api/teacher/student-achievements?page=1&pageSize=10', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const studentAchievementsResult = await studentAchievementsResponse.json();
    console.log('Student achievements result:', studentAchievementsResult);
    
    console.log('📊 Testing /api/teacher/dashboard/score-distribution...');
    const dashboardResponse = await fetch('http://localhost:3000/api/teacher/dashboard/score-distribution?class_name=all', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const dashboardResult = await dashboardResponse.json();
    console.log('Dashboard result:', dashboardResult);
    
  } catch (err) {
    console.error('❌ Test error:', err);
  } finally {
    console.log('🛑 Stopping server...');
    server.kill();
  }
}

testWithServer();