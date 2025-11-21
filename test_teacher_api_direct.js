import axios from 'axios';
import { supabase } from './src/config/supabase.js';

const API_BASE = 'http://localhost:3000/api';

async function testTeacherAPIDirect() {
  try {
    console.log('🧪 直接测试教师API...');
    
    // 1. 获取一个有效的教师token
    console.log('\n🔑 获取教师token...');
    
    // 先检查现有的教师用户
    const { data: teachers, error: teacherError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 2) // 2 = 教师
      .limit(1);
    
    if (teacherError) {
      console.error('❌ 查询教师失败:', teacherError);
      return;
    }
    
    if (!teachers || teachers.length === 0) {
      console.error('❌ 没有找到教师用户');
      return;
    }
    
    const teacher = teachers[0];
    console.log('✅ 找到教师:', teacher.username);
    
    // 尝试使用服务端密钥生成token
    let token = null;
    
    // 方法1: 尝试登录（如果有邮箱）
    if (teacher.email) {
      try {
        const loginResponse = await axios.post(`${API_BASE}/users/login`, {
          email: teacher.email,
          password: '123456' // 假设密码
        });
        
        if (loginResponse.data.success) {
          token = loginResponse.data.data.token;
          console.log('✅ 登录成功，获取到token');
        }
      } catch (loginError) {
        console.log('⚠️ 登录失败:', loginError.response?.data || loginError.message);
      }
    }
    
    // 方法2: 创建临时token（如果登录失败）
    if (!token) {
      console.log('🔧 尝试创建临时测试token...');
      
      // 创建一个临时的测试用户认证
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: 'test-teacher@example.com',
          options: {
            data: {
              role: 'teacher',
              username: 'test-teacher',
              user_id: teacher.id
            }
          }
        });
        
        if (authError) {
          console.log('⚠️ 生成临时token失败:', authError.message);
        } else {
          console.log('✅ 临时认证链接生成成功');
        }
      } catch (tokenError) {
        console.log('⚠️ 临时token创建失败:', tokenError.message);
      }
      
      // 最后的手段：使用任意token来测试API结构
      token = 'test-token-for-structure';
      console.log('🔧 使用测试token检查API结构...');
    }
    
    // 2. 测试API端点
    console.log('\n📚 测试 /teacher/student-achievements API...');
    
    try {
      const response = await axios.get(`${API_BASE}/teacher/student-achievements?page=1&pageSize=10`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ API调用成功!');
      console.log('📋 状态码:', response.status);
      console.log('📋 响应数据:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.error('❌ API调用失败:');
      console.error('📋 状态码:', error.response?.status);
      console.error('📋 状态文本:', error.response?.statusText);
      console.error('📋 错误数据:', error.response?.data);
      console.error('📋 请求配置:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        params: error.config?.params
      });
      
      // 如果是401错误，检查token验证逻辑
      if (error.response?.status === 401) {
        console.log('\n🔍 分析401错误原因...');
        console.log('📋 使用的token:', token.substring(0, 50) + '...');
        console.log('📋 Token类型:', typeof token);
      }
      
      // 如果是400错误，检查参数验证
      if (error.response?.status === 400) {
        console.log('\n🔍 分析400错误原因...');
        console.log('📋 可能的验证问题:');
        console.log('  - paginationSchema验证失败');
        console.log('  - requireTeacher权限检查失败');
        console.log('  - 数据库查询参数错误');
      }
    }
    
    // 3. 测试简化的API端点
    console.log('\n🧪 测试其他教师API端点...');
    
    const endpoints = [
      '/teacher/profile',
      '/teacher/projects',
      '/teacher/pending-projects'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${API_BASE}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        });
        console.log(`✅ ${endpoint}: ${response.status}`);
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.response?.status} - ${error.response?.data?.error || error.message}`);
      }
    }
    
  } catch (error) {
    console.error('🔥 测试过程中发生错误:', error);
  }
}

testTeacherAPIDirect();