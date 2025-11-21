import axios from 'axios';

async function testLibraryView() {
    try {
        console.log('🧪 开始测试成果查看功能...');
        
        // 1. 教师登录
        console.log('\n🔑 教师登录...');
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'teacher1763449748933@example.com',
            password: 'password123'
        });
        
        if (!loginResponse.data.success) {
            console.error('❌ 登录失败:', loginResponse.data.error);
            return;
        }
        
        const token = loginResponse.data.data.token;
        console.log('✅ 登录成功');
        
        // 2. 测试成果库API端点
        console.log('\n📋 测试成果库API端点...');
        try {
            const response = await axios.get('http://localhost:3000/api/teacher/library?page=1&pageSize=10', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            console.log('✅ 成果库API调用成功');
            console.log('📊 响应状态:', response.status);
            console.log('📋 数据格式:', JSON.stringify(response.data, null, 2));
            
            if (response.data.success && response.data.data) {
                const items = response.data.data.items || [];
                console.log(`🎯 获取到 ${items.length} 个成果`);
                
                if (items.length > 0) {
                    console.log('\n📋 成果详情:');
                    items.forEach((item, index) => {
                        console.log(`${index + 1}. ${item.title}`);
                        console.log(`   学生: ${item.student_name || '未知'}`);
                        console.log(`   状态: ${item.status || '未知'}`);
                        console.log(`   提交时间: ${item.created_at || '未知'}`);
                    });
                } else {
                    console.log('ℹ️  成果库为空');
                }
            } else {
                console.warn('⚠️  API返回数据格式异常');
            }
            
        } catch (error) {
            console.error('❌ 成果库API调用失败');
            if (error.response) {
                console.error('📊 状态码:', error.response.status);
                console.error('📋 错误详情:', error.response.data);
            } else {
                console.error('❌ 错误:', error.message);
            }
        }
        
        // 3. 测试其他相关端点
        console.log('\n🔄 测试其他教师端点...');
        const endpoints = [
            '/teacher/projects',
            '/teacher/pending-projects'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(`http://localhost:3000/api${endpoint}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log(`✅ ${endpoint}: ${response.data.data?.items?.length || 0} 个项目`);
            } catch (error) {
                console.error(`❌ ${endpoint}: 失败`);
            }
        }
        
        console.log('\n🎯 测试完成！');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

testLibraryView();