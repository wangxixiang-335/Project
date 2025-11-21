// 通过API检查数据库中的真实数据
async function checkApiData() {
    console.log('🔍 通过API检查数据库中的真实数据...\n');

    try {
        // 1. 尝试登录获取token
        console.log('🔐 尝试登录获取token...');
        const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'teacher1763449748933@example.com',
                password: 'password123'
            })
        });

        const loginResult = await loginResponse.json();

        if (!loginResponse.ok || !loginResult.success) {
            console.error('❌ 登录失败:', loginResult);
            return;
        }

        const token = loginResult.data.token;
        console.log('✅ 登录成功，获取到token');

        // 2. 检查成果库数据
        console.log('\n📚 检查成果库数据...');
        const libraryResponse = await fetch('http://localhost:3000/api/teacher/library', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const libraryResult = await libraryResponse.json();
        console.log('📋 成果库响应:', {
            status: libraryResponse.status,
            success: libraryResult.success,
            dataKeys: libraryResult.data ? Object.keys(libraryResult.data) : 'no data',
            itemCount: libraryResult.data?.items?.length || 0
        });

        if (libraryResult.success && libraryResult.data?.items) {
            console.log('\n📊 成果列表:');
            libraryResult.data.items.forEach((item, index) => {
                console.log(`  ${index + 1}. ID: ${item.id}, 标题: ${item.title}, 状态: ${item.status}`);
                console.log(`      学生: ${item.student_name || '未知'}, 指导老师: ${item.instructor_name || '未知'}`);
                console.log(`      创建时间: ${item.created_at}, 类型: ${item.type || '未知'}`);
                console.log('');
            });
        }

        // 3. 检查待审批数据
        console.log('⏳ 检查待审批数据...');
        const pendingResponse = await fetch('http://localhost:3000/api/review/pending', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const pendingResult = await pendingResponse.json();
        console.log('⏳ 待审批响应:', {
            status: pendingResponse.status,
            success: pendingResult.success,
            itemCount: pendingResult.data?.items?.length || 0
        });

        // 4. 检查用户信息
        console.log('👤 检查用户信息...');
        const userResponse = await fetch('http://localhost:3000/api/auth/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const userResult = await userResponse.json();
        console.log('👥 用户信息:', {
            status: userResponse.status,
            success: userResult.success,
            role: userResult.data?.role,
            id: userResult.data?.id
        });

    } catch (error) {
        console.error('❌ 检查过程中发生错误:', error);
    }
}

checkApiData();