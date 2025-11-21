import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function debugUserProfile() {
  try {
    console.log('1. 注册新用户...');
    const registerData = {
      email: 'debuguser@example.com',
      password: '123456',
      username: 'debuguser',
      role: 'student'
    };
    
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, registerData);
    console.log('注册响应:', JSON.stringify(registerResponse.data, null, 2));
    
    if (registerResponse.data.success) {
      const token = registerResponse.data.data.token;
      const userId = registerResponse.data.data.user_id;
      
      console.log('\n2. 使用token检查用户...');
      try {
        const { data: { user }, error } = await getUserFromToken(token);
        console.log('Token验证结果:', { user: !!user, error });
        if (user) {
          console.log('用户ID:', user.id);
          
          console.log('\n3. 直接查询profiles表...');
          await checkProfileDirectly(userId, token);
        }
      } catch (tokenError) {
        console.log('Token验证失败:', tokenError.message);
      }
    }
    
  } catch (error) {
    console.log('调试错误:', error.response?.data || error.message);
  }
}

async function getUserFromToken(token) {
  // 这里我们需要使用supabase客户端，但先用简单方式测试
  try {
    const response = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return { data: { user: response.data.data }, error: null };
  } catch (error) {
    return { data: { user: null }, error: error.response?.data };
  }
}

async function checkProfileDirectly(userId, token) {
  try {
    // 尝试通过Supabase API直接查询（如果配置了正确的密钥）
    console.log('尝试查询profiles表，用户ID:', userId);
    
    // 先尝试获取用户信息看是否profile存在
    const meResponse = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (meResponse.data.success) {
      console.log('✅ 用户profile存在:', meResponse.data.data);
    } else {
      console.log('❌ 获取profile失败:', meResponse.data.error);
    }
    
  } catch (error) {
    console.log('查询profile错误:', error.response?.data || error.message);
  }
}

console.log('开始调试用户profile问题...');
debugUserProfile();