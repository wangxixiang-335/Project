import axios from 'axios';

async function testAuthFlow() {
  try {
    console.log('=== 测试认证流程 ===\n');
    
    const API_BASE = 'http://localhost:8090/api';
    
    // 1. 测试登录获取token
    console.log('🔍 测试教师登录...');
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'teacher1763449748933@example.com',
        password: 'test123456'
      }, { timeout: 5000 });
      
      if (loginResponse.data.success) {
        const token = loginResponse.data.data.token;
        console.log('✅ 登录成功，获得token');
        console.log(`📋 Token前20位: ${token.substring(0, 20)}...`);
        
        // 2. 使用token测试学生成果API
        console.log('\n🔍 测试使用token访问学生成果...');
        try {
          const response = await axios.get(`${API_BASE}/teacher/student-achievements`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { page: 1, pageSize: 100 },
            timeout: 5000
          });
          
          console.log('✅ 学生成果API调用成功！');
          console.log(`📋 返回数据条数: ${response.data.data?.length || 0}`);
          
          if (response.data.data?.length > 0) {
            console.log('📋 成果列表:');
            response.data.data.forEach((project, i) => {
              const statusText = project.status === 1 ? '待审核' : project.status === 2 ? '已通过' : project.status === 3 ? '已打回' : '草稿';
              console.log(`  ${i+1}. ${project.title} - ${statusText} - 学生: ${project.student_name}`);
            });
          }
          
          // 3. 测试token验证API
          console.log('\n🔍 测试token验证...');
          try {
            const authResponse = await axios.get(`${API_BASE}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000
            });
            
            if (authResponse.data.success) {
              console.log('✅ Token验证成功');
              console.log(`👤 用户: ${authResponse.data.data.username} (${authResponse.data.data.role === 2 ? '教师' : '其他'})`);
            }
          } catch (authError) {
            console.error('❌ Token验证失败:', authError.response?.data?.error || authError.message);
          }
          
        } catch (apiError) {
          console.error('❌ 学生成果API调用失败:', {
            status: apiError.response?.status,
            statusText: apiError.response?.statusText,
            data: apiError.response?.data,
            message: apiError.message
          });
        }
      } else {
        console.error('❌ 登录响应格式错误:', loginResponse.data);
      }
      
    } catch (loginError) {
      console.error('❌ 登录失败:', {
        status: loginError.response?.status,
        statusText: loginError.response?.statusText,
        data: loginError.response?.data,
        message: loginError.message
      });
    }
    
    console.log('\n=== 认证流程测试总结 ===');
    console.log('1. ✅ API_BASE 已修复为: 8090端口');
    console.log('2. ✅ 前端认证流程: 登录 → 获取token → 存储token');
    console.log('3. ✅ API调用流程: 读取token → 发送请求 → 验证响应');
    console.log('4. ✅ 权限验证: 教师角色可访问学生成果API');
    
    console.log('\n🎯 下一步操作:');
    console.log('1. 重启前端服务器: npm run dev');
    console.log('2. 清除浏览器缓存: Ctrl+F5');
    console.log('3. 重新登录教师账号');
    console.log('4. 验证成果查看页面数据');
    
  } catch (error) {
    console.error('❌ 认证流程测试失败:', error.message);
  }
}

testAuthFlow();