// 测试教师认证和API调用
import axios from 'axios';

const API_BASE = 'http://localhost:8090/api';

async function testTeacherAuth() {
    try {
        console.log('🔍 测试1: 测试教师登录...');
        
        // 1. 先尝试登录获取token
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'teacherdemo@example.com',
            password: 'demo123456'
        });
        
        console.log('登录响应:', JSON.stringify(loginResponse.data, null, 2));
        
        if (loginResponse.data.success && loginResponse.data.data.token) {
            const token = loginResponse.data.data.token;
            console.log('✅ 登录成功，获得token:', token.substring(0, 20) + '...');
            
            // 2. 使用token测试API调用
            console.log('\n🔍 测试2: 使用token调用学生成果API...');
            
            const apiResponse = await axios.get(`${API_BASE}/teacher/student-achievements`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    page: 1,
                    pageSize: 10
                }
            });
            
            console.log('✅ API调用成功!');
            console.log('响应数据:', JSON.stringify(apiResponse.data, null, 2));
            
        } else {
            console.error('❌ 登录失败:', loginResponse.data);
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testTeacherAuth();