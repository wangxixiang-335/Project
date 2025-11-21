import axios from 'axios';

async function testExistingTeacherLogin() {
    try {
        console.log('🧪 测试现有教师登录流程...');
        
        // 1. 测试登录 - 使用数据库中存在的教师账户
        console.log('\n1. 测试教师登录...');
        
        // 从数据库中我们知道存在用户名为 'teacher1763449748933' 的教师
        // 但登录需要邮箱，所以我们需要构造邮箱地址
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'teacher1763449748933@example.com',  // 构造邮箱地址
            password: 'password123'  // 使用默认密码
        });
        
        if (loginResponse.data.success) {
            console.log('✅ 登录成功');
            console.log('用户信息:', loginResponse.data.data);
            
            const token = loginResponse.data.data.token;
            
            // 2. 测试教师项目列表
            console.log('\n2. 测试教师项目列表...');
            const projectsResponse = await axios.get('http://localhost:3000/api/teacher/projects', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (projectsResponse.data.success) {
                console.log('✅ 项目列表获取成功');
                console.log('完整响应:', JSON.stringify(projectsResponse.data, null, 2));
                console.log('项目数量:', projectsResponse.data.data?.length || '未定义');
            } else {
                console.log('❌ 项目列表获取失败:', projectsResponse.data.error);
            }
            
        } else {
            console.log('❌ 登录失败:', loginResponse.data.error);
            
            // 尝试其他可能存在的教师邮箱
            console.log('\n🔄 尝试其他教师账户...');
            const altEmails = [
                'teacher1@example.com',
                '测试教师@example.com',
                'testteacher@example.com'
            ];
            
            for (const email of altEmails) {
                try {
                    console.log(`尝试邮箱: ${email}`);
                    const altResponse = await axios.post('http://localhost:3000/api/auth/login', {
                        email: email,
                        password: 'password123'
                    });
                    
                    if (altResponse.data.success) {
                        console.log(`✅ 使用 ${email} 登录成功`);
                        break;
                    }
                } catch (error) {
                    console.log(`❌ ${email} 失败:`, error.response?.data?.error || error.message);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        if (error.response) {
            console.log('响应状态:', error.response.status);
            console.log('响应数据:', error.response.data);
        }
    }
}

testExistingTeacherLogin();