import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

// 模拟教师登录获取token
async function loginAsTeacher() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'teacher@example.com',
      password: '123456'
    });
    
    if (response.data.success) {
      console.log('✅ 教师登录成功');
      return response.data.data.token;
    } else {
      console.error('❌ 教师登录失败:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ 登录请求失败:', error.message);
    return null;
  }
}

// 测试教师个人成果管理功能
async function testTeacherManageFeatures(token) {
  console.log('\n🧪 测试教师个人成果管理功能...');
  
  try {
    // 测试获取教师个人成果
    console.log('📋 测试获取教师个人成果...');
    const response = await axios.get(`${API_BASE}/teacher/my-achievements`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const projects = response.data.data;
      console.log(`✅ 成功获取 ${projects.length} 个教师个人成果`);
      
      // 显示成果状态分布
      const statusCount = {
        '待审批': projects.filter(p => p.status === 0).length,
        '已通过': projects.filter(p => p.status === 1).length,
        '已驳回': projects.filter(p => p.status === 2).length,
        '草稿': projects.filter(p => p.status === 3).length
      };
      
      console.log('📊 成果状态分布:', statusCount);
      
      // 显示驳回成果的驳回原因
      const rejectedProjects = projects.filter(p => p.status === 2 && p.reject_reason);
      if (rejectedProjects.length > 0) {
        console.log('\n📝 驳回成果详情:');
        rejectedProjects.forEach(project => {
          console.log(`  - ${project.title}: ${project.reject_reason}`);
        });
      }
    } else {
      console.error('❌ 获取教师个人成果失败:', response.data.message);
    }
  } catch (error) {
    console.error('❌ 测试教师个人成果管理失败:', error.message);
  }
}

// 测试学生成果查看功能
async function testStudentLibraryFeatures(token) {
  console.log('\n🧪 测试学生成果查看功能...');
  
  try {
    // 测试获取所有学生成果
    console.log('📋 测试获取所有学生成果...');
    const response = await axios.get(`${API_BASE}/teacher/student-achievements`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const projects = response.data.data;
      console.log(`✅ 成功获取 ${projects.length} 个学生成果`);
      
      // 显示成果类型分布
      const typeCount = {};
      projects.forEach(p => {
        const type = p.project_type || '未分类';
        typeCount[type] = (typeCount[type] || 0) + 1;
      });
      console.log('📊 成果类型分布:', typeCount);
      
      // 显示班级分布
      const classCount = {};
      projects.forEach(p => {
        const className = p.class_name || '未分类';
        classCount[className] = (classCount[className] || 0) + 1;
      });
      console.log('📊 班级分布:', classCount);
      
      // 显示平均分
      const scoredProjects = projects.filter(p => p.score);
      if (scoredProjects.length > 0) {
        const avgScore = scoredProjects.reduce((sum, p) => sum + p.score, 0) / scoredProjects.length;
        console.log(`📈 平均分: ${avgScore.toFixed(1)}分`);
      }
      
      // 显示优秀成果数量
      const excellentProjects = projects.filter(p => p.score >= 90);
      console.log(`🏆 优秀成果（≥90分）: ${excellentProjects.length}个`);
      
    } else {
      console.error('❌ 获取学生成果失败:', response.data.message);
    }
  } catch (error) {
    console.error('❌ 测试学生成果查看失败:', error.message);
  }
}

// 测试AI解决方案生成功能
async function testAISolutionFeature(token) {
  console.log('\n🧪 测试AI解决方案生成功能...');
  
  try {
    const rejectReason = '研究方法描述不够详细，需要补充实验数据和分析过程';
    console.log(`📝 测试驳回原因: ${rejectReason}`);
    
    // 测试AI解决方案生成
    const response = await axios.post(`${API_BASE}/ai/solution`, {
      reject_reason: rejectReason
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      console.log('✅ AI解决方案生成成功');
      console.log('💡 解决方案:', response.data.data);
    } else {
      console.warn('⚠️ AI解决方案生成失败，使用模拟数据');
      console.log('💡 模拟解决方案: 请补充详细的研究方法描述，添加实验数据支撑，完善分析过程...');
    }
  } catch (error) {
    console.warn('⚠️ AI解决方案API调用失败，使用模拟数据');
    console.log('💡 模拟解决方案: 请补充详细的研究方法描述，添加实验数据支撑，完善分析过程...');
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试教师系统新功能...\n');
  
  // 教师登录
  const token = await loginAsTeacher();
  if (!token) {
    console.error('❌ 无法获取教师token，测试终止');
    return;
  }
  
  console.log(`🔑 获取到token: ${token.substring(0, 20)}...`);
  
  // 测试各项功能
  await testTeacherManageFeatures(token);
  await testStudentLibraryFeatures(token);
  await testAISolutionFeature(token);
  
  console.log('\n✅ 所有测试完成！');
}

// 运行测试
runTests().catch(console.error);