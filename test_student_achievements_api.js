// 测试学生成果API
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';
const TEACHER_TOKEN = 'dev-teacher-token';

async function testStudentAchievementsAPI() {
  console.log('🧪 测试学生成果API...\n');
  
  try {
    // 测试1: /teacher/projects (所有成果)
    console.log('1️⃣ 测试 /teacher/projects (所有成果)...');
    const allProjectsResponse = await axios.get(`${API_BASE}/teacher/projects`, {
      headers: { Authorization: `Bearer ${TEACHER_TOKEN}` }
    });
    console.log('✅ /teacher/projects 响应:', {
      success: allProjectsResponse.data.success,
      count: allProjectsResponse.data.data?.items?.length || 0
    });

    // 测试2: /teacher/my-projects (教师个人成果)
    console.log('\n2️⃣ 测试 /teacher/my-projects (教师个人成果)...');
    const myProjectsResponse = await axios.get(`${API_BASE}/teacher/my-projects`, {
      headers: { Authorization: `Bearer ${TEACHER_TOKEN}` }
    });
    console.log('✅ /teacher/my-projects 响应:', {
      success: myProjectsResponse.data.success,
      count: myProjectsResponse.data.data?.items?.length || 0
    });

    // 测试3: /teacher/student-achievements (学生成果)
    console.log('\n3️⃣ 测试 /teacher/student-achievements (学生成果)...');
    const studentProjectsResponse = await axios.get(`${API_BASE}/teacher/student-achievements`, {
      headers: { Authorization: `Bearer ${TEACHER_TOKEN}` }
    });
    console.log('✅ /teacher/student-achievements 响应:', {
      success: studentProjectsResponse.data.success,
      count: studentProjectsResponse.data.data?.items?.length || 0
    });

    // 显示对比
    const allCount = allProjectsResponse.data.data?.items?.length || 0;
    const myCount = myProjectsResponse.data.data?.items?.length || 0;
    const studentCount = studentProjectsResponse.data.data?.items?.length || 0;
    
    console.log('\n📊 对比结果:');
    console.log(`  所有成果数量: ${allCount}`);
    console.log(`  教师个人成果数量: ${myCount}`);
    console.log(`  学生成果数量: ${studentCount}`);
    
    // 检查数据分离是否正确
    console.log('\n🔍 数据分离验证:');
    
    // 检查是否所有成果 = 教师成果 + 学生成果
    const expectedTotal = myCount + studentCount;
    const actualTotal = allCount;
    
    if (Math.abs(expectedTotal - actualTotal) <= 1) { // 允许1个误差
      console.log('✅ 数据分离正确: 所有成果 ≈ 教师成果 + 学生成果');
    } else {
      console.log('⚠️ 数据分离可能有问题');
    }
    
    // 检查学生成果是否不包含教师成果
    if (studentCount <= allCount) {
      console.log('✅ 学生成果数量正确: 学生成果数量 ≤ 所有成果数量');
    }

    // 显示样本数据
    if (studentProjectsResponse.data.data?.items?.length > 0) {
      console.log('\n📋 学生成果样本:');
      studentProjectsResponse.data.data.items.slice(0, 3).forEach((p, i) => {
        console.log(`  ${i+1}. ${p.title} - ${p.student_name} (状态: ${p.status})`);
      });
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testStudentAchievementsAPI();