// 测试教师登录流程
import axios from 'axios';

async function testTeacherLogin() {
    try {
        console.log('🧪 测试教师登录流程...');
        
        // 1. 测试登录
        console.log('\n1. 测试教师登录...');
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'teacher1763449748933@example.com',
            password: 'password123'
        });
        
        if (loginResponse.data.success) {
            console.log('✅ 登录成功');
            console.log('用户信息:', loginResponse.data.data);
            console.log('Token:', loginResponse.data.data.token ? '已生成' : '未生成');
            
            // 2. 测试用户信息获取
            console.log('\n2. 测试获取用户信息...');
            const userInfoResponse = await axios.get('http://localhost:3000/auth/me', {
                headers: {
                    'Authorization': `Bearer ${loginResponse.data.data.token}`
                }
            });
            
            if (userInfoResponse.data.success) {
                console.log('✅ 用户信息获取成功');
                console.log('用户角色:', userInfoResponse.data.data.role);
                console.log('角色验证:', userInfoResponse.data.data.role === 1 ? '教师角色 ✓' : '非教师角色 ✗');
            } else {
                console.log('❌ 用户信息获取失败');
            }
        } else {
            console.log('❌ 登录失败:', loginResponse.data.error);
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        if (error.response) {
            console.log('响应状态:', error.response.status);
            console.log('响应数据:', error.response.data);
        }
    }
}

testTeacherLogin();