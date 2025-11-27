// 快速测试脚本 - 验证教师API修复
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3002/api';
const TEACHER_TOKEN = 'dev-teacher-token';

async function quickTest() {
  console.log('🚀 快速测试教师API修复...\n');
  
  try {
    // 测试教师个人成果API
    console.log('1️⃣ 测试教师个人成果...');
    const myProjects = await fetch(`${API_BASE}/teacher/my-projects?page=1&pageSize=5`, {
      headers: { 'Authorization': `Bearer ${TEACHER_TOKEN}` }
    }).then(res => res.json());
    
    console.log('✅ 教师个人成果:', {
      success: myProjects.success,
      count: myProjects.data?.items?.length || myProjects.data?.length || 0
    });

    // 测试学生成果查看API  
    console.log('\n2️⃣ 测试学生成果查看...');
    const studentProjects = await fetch(`${API_BASE}/teacher/student-achievements?page=1&pageSize=5`, {
      headers: { 'Authorization': `Bearer ${TEACHER_TOKEN}` }
    }).then(res => res.json());
    
    console.log('✅ 学生成果查看:', {
      success: studentProjects.success,
      count: studentProjects.data?.items?.length || studentProjects.data?.length || 0
    });

    // 如果成功，显示一些数据
    if (myProjects.success && myProjects.data?.items?.length > 0) {
      console.log('\n📋 教师个人成果预览:');
      myProjects.data.items.slice(0, 2).forEach((p, i) => {
        console.log(`  ${i+1}. ${p.title} (状态: ${p.status})`);
      });
    }

    if (studentProjects.success && studentProjects.data?.items?.length > 0) {
      console.log('\n📋 学生成果预览:');
      studentProjects.data.items.slice(0, 2).forEach((p, i) => {
        console.log(`  ${i+1}. ${p.title} - ${p.student_name} (状态: ${p.status})`);
      });
    }

    console.log('\n🎉 测试完成！如果看到数据，说明修复成功。');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.log('💡 请确保服务器在端口3002上运行');
  }
}

quickTest();