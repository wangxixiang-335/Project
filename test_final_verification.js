import axios from 'axios';

async function testFinalVerification() {
    try {
        console.log('🧪 最终验证 - 检查成果查看功能是否生效...\n');
        
        // 1. 教师登录
        console.log('🔑 1. 教师登录...');
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
        
        // 2. 检查静态文件是否包含修改后的文本
        console.log('\n📄 2. 检查静态文件内容...');
        try {
            const staticResponse = await fetch('http://localhost:3000/teacher.html');
            const staticText = await staticResponse.text();
            
            if (staticText.includes('成果查看')) {
                console.log('✅ temp-frontend/teacher.html 已更新为 "成果查看"');
            } else {
                console.log('❌ temp-frontend/teacher.html 仍然显示旧文本');
            }
            
            if (staticText.includes('成果库管理')) {
                console.log('⚠️  temp-frontend/teacher.html 仍然包含 "成果库管理"');
            }
        } catch (error) {
            console.log('❌ 无法访问静态文件:', error.message);
        }
        
        // 3. 检查React组件API是否正常工作
        console.log('\n⚛️ 3. 检查React组件相关API...');
        try {
            const libraryResponse = await axios.get('http://localhost:3000/api/teacher/library?page=1&pageSize=10', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (libraryResponse.data.success) {
                console.log('✅ 成果库API正常工作');
                const items = libraryResponse.data.data?.items || [];
                console.log(`📊 获取到 ${items.length} 个成果`);
            } else {
                console.log('❌ 成果库API调用失败:', libraryResponse.data.error);
            }
        } catch (error) {
            console.log('❌ 成果库API异常:', error.message);
        }
        
        // 4. 检查其他教师端点
        console.log('\n🔄 4. 检查其他教师端点...');
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
                console.log(`❌ ${endpoint}: 失败`);
            }
        }
        
        // 5. 提供访问建议
        console.log('\n💡 5. 访问建议:');
        console.log('   - 清除浏览器缓存（Ctrl+Shift+R 强制刷新）');
        console.log('   - 或者直接访问: http://localhost:3000');
        console.log('   - 教师登录页面: http://localhost:3000/login.html');
        console.log('   - React版本页面: http://localhost:3000 (如果项目使用React前端)');
        
        console.log('\n🎯 验证完成！');
        
    } catch (error) {
        console.error('❌ 验证失败:', error.message);
    }
}

// 运行验证
testFinalVerification();