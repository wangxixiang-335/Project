// 测试教师API修复
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';
const TEACHER_TOKEN = 'dev-teacher-token';

async function testTeacherAPI() {
  console.log('🧪 测试教师API修复...\n');
  
  try {
    // 测试1: /teacher/projects (应该返回所有成果)
    console.log('1️⃣ 测试 /teacher/projects (所有成果)...');
    const allProjectsResponse = await axios.get(`${API_BASE}/teacher/projects`, {
      headers: { Authorization: `Bearer ${TEACHER_TOKEN}` }
    });
    console.log('✅ /teacher/projects 响应:', {
      success: allProjectsResponse.data.success,
      count: allProjectsResponse.data.data?.items?.length || 0
    });

    // 测试2: /teacher/my-projects (应该返回教师自己的成果)
    console.log('\n2️⃣ 测试 /teacher/my-projects (教师个人成果)...');
    const myProjectsResponse = await axios.get(`${API_BASE}/teacher/my-projects`, {
      headers: { Authorization: `Bearer ${TEACHER_TOKEN}` }
    });
    console.log('✅ /teacher/my-projects 响应:', {
      success: myProjectsResponse.data.success,
      count: myProjectsResponse.data.data?.items?.length || 0
    });

    // 显示对比
    const allCount = allProjectsResponse.data.data?.items?.length || 0;
    const myCount = myProjectsResponse.data.data?.items?.length || 0;
    
    console.log('\n📊 对比结果:');
    console.log(`  所有成果数量: ${allCount}`);
    console.log(`  教师个人成果数量: ${myCount}`);
    
    if (myCount <= allCount) {
      console.log('✅ 正确: 教师个人成果数量 <= 所有成果数量');
    } else {
      console.log('❌ 错误: 教师个人成果数量 > 所有成果数量');
    }

    // 显示样本数据
    if (allProjectsResponse.data.data?.items?.length > 0) {
      console.log('\n📋 所有成果样本:');
      allProjectsResponse.data.data.items.slice(0, 2).forEach((p, i) => {
        console.log(`  ${i+1}. ${p.title} (发布者: ${p.student_name || '未知'})`);
      });
    }

    if (myProjectsResponse.data.data?.items?.length > 0) {
      console.log('\n📋 教师个人成果样本:');
      myProjectsResponse.data.data.items.slice(0, 2).forEach((p, i) => {
        console.log(`  ${i+1}. ${p.title} (状态: ${p.status})`);
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

testTeacherAPI();