// 通过API创建测试数据
async function createDataViaAPI() {
    console.log('🔧 通过API创建测试数据...\n');

    try {
        // 1. 登录获取token
        console.log('🔐 登录教师账号...');
        const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'teacher1763610712207@example.com',
                password: 'password123'
            })
        });

        const loginResult = await loginResponse.json();

        if (!loginResponse.ok || !loginResult.success) {
            console.error('❌ 登录失败:', loginResult);
            return;
        }

        const token = loginResult.data.token;
        console.log('✅ 登录成功');

        // 2. 检查是否可以直接操作数据库
        console.log('\n🔍 尝试创建测试数据...');
        
        // 尝试创建一个已通过的项目
        const createResponse = await fetch('http://localhost:3000/api/projects', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: '测试成果 - 机器学习研究',
                description: '这是一个测试成果，用于验证成果库功能。包含深度学习算法的研究成果。',
                type: '论文',
                status: 2, // 已通过
                score: 95
            })
        });

        const createResult = await createResponse.json();
        console.log('📝 创建成果响应:', {
            status: createResponse.status,
            success: createResult.success,
            data: createResult.data
        });

        // 3. 再次检查成果库
        console.log('\n📚 检查成果库更新情况...');
        const libraryResponse = await fetch('http://localhost:3000/api/teacher/library', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const libraryResult = await libraryResponse.json();
        console.log('📚 成果库更新后:', {
            itemCount: libraryResult.data?.items?.length || 0,
            firstItem: libraryResult.data?.items?.[0] || null
        });

    } catch (error) {
        console.error('❌ 创建测试数据失败:', error);
    }
}

createDataViaAPI();