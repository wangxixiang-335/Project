import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

async function debugTeacherNotifications() {
    try {
        console.log('🔍 调试教师通知功能...');
        
        // 1. 测试教师登录
        console.log('\n1. 测试教师登录...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: 'teacher1763449748933@example.com',
            password: 'password123'
        });
        
        if (loginResponse.data.success) {
            const token = loginResponse.data.data.token;
            console.log('✅ 登录成功');
            console.log('Token:', token.substring(0, 50) + '...');
            
            // 2. 测试教师通知API
            console.log('\n2. 测试教师通知API...');
            
            // 测试待审批通知
            try {
                console.log('测试待审批通知...');
                const pendingResponse = await axios.get(`${API_BASE}/teacher/notifications/pending`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('✅ 待审批通知:', pendingResponse.data);
            } catch (error) {
                console.log('❌ 待审批通知失败:', error.response?.data || error.message);
            }
            
            // 测试已通过通知
            try {
                console.log('测试已通过通知...');
                const approvedResponse = await axios.get(`${API_BASE}/teacher/notifications/approved`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('✅ 已通过通知:', approvedResponse.data);
            } catch (error) {
                console.log('❌ 已通过通知失败:', error.response?.data || error.message);
            }
            
            // 测试已驳回通知
            try {
                console.log('测试已驳回通知...');
                const rejectedResponse = await axios.get(`${API_BASE}/teacher/notifications/rejected`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('✅ 已驳回通知:', rejectedResponse.data);
            } catch (error) {
                console.log('❌ 已驳回通知失败:', error.response?.data || error.message);
            }
            
            // 3. 测试教师统计信息
            console.log('\n3. 测试教师统计信息...');
            try {
                const statsResponse = await axios.get(`${API_BASE}/teacher/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('✅ 教师统计:', statsResponse.data);
            } catch (error) {
                console.log('❌ 教师统计失败:', error.response?.data || error.message);
            }
            
        } else {
            console.log('❌ 登录失败:', loginResponse.data.error);
        }
        
    } catch (error) {
        console.error('测试失败:', error.message);
        if (error.response) {
            console.error('响应数据:', error.response.data);
            console.error('状态码:', error.response.status);
        }
    }
}

// 运行调试
debugTeacherNotifications();