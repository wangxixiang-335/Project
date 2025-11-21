// 使用新创建的教师账号检查数据
async function checkWithNewTeacher() {
    console.log('🔍 使用新教师账号检查数据...\n');

    try {
        // 1. 使用新账号登录
        console.log('🔐 使用新教师账号登录...');
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
        console.log('📚 成果库响应状态:', libraryResponse.status);
        console.log('📚 成果库成功:', libraryResult.success);
        
        if (libraryResult.success) {
            console.log('📊 成果库数据结构:', {
                hasData: !!libraryResult.data,
                dataKeys: libraryResult.data ? Object.keys(libraryResult.data) : [],
                itemCount: libraryResult.data?.items?.length || 0,
                sampleItem: libraryResult.data?.items?.[0] || null
            });
            
            if (libraryResult.data?.items && libraryResult.data.items.length > 0) {
                console.log('\n📋 成果列表:');
                libraryResult.data.items.forEach((item, index) => {
                    console.log(`  ${index + 1}. ID: ${item.id}`);
                    console.log(`      标题: ${item.title || '无标题'}`);
                    console.log(`      状态: ${item.status}`);
                    console.log(`      创建时间: ${item.created_at || '未知'}`);
                    console.log(`      学生ID: ${item.student_id || '未知'}`);
                    console.log(`      发布者ID: ${item.publisher_id || '未知'}`);
                    console.log('');
                });
            } else {
                console.log('ℹ️ 成果库中没有数据');
            }
        } else {
            console.error('❌ 成果库API调用失败:', libraryResult);
        }

        // 3. 检查是否有其他相关的表或数据
        console.log('\n🔍 检查待审批数据...');
        const pendingResponse = await fetch('http://localhost:3000/api/review/pending', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const pendingResult = await pendingResponse.json();
        console.log('📋 待审批数据:', {
            success: pendingResult.success,
            itemCount: pendingResult.data?.items?.length || 0
        });

        if (pendingResult.success && pendingResult.data?.items?.length > 0) {
            console.log('📋 待审批项目列表:');
            pendingResult.data.items.forEach((item, index) => {
                console.log(`  ${index + 1}. ${item.title} (状态: ${item.status})`);
            });
        }

    } catch (error) {
        console.error('❌ 检查过程中发生错误:', error);
    }
}

checkWithNewTeacher();