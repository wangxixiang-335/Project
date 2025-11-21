// 详细的错误检测脚本
async function checkTeacherProjectsError() {
    console.log('🕵️ 开始详细错误检测...\n');
    
    // 1. 检查基本环境
    console.log('1️⃣ 环境检查:');
    console.log('- teacherSystem 存在:', typeof window.teacherSystem !== 'undefined');
    console.log('- 当前页面:', window.teacherSystem?.currentPage || '未知');
    console.log('- 用户认证:', window.teacherSystem?.user ? '已登录' : '未登录');
    
    if (typeof window.teacherSystem === 'undefined') {
        console.error('❌ teacherSystem 未定义');
        return;
    }
    
    // 2. 检查token
    console.log('\n2️⃣ Token检查:');
    const token = localStorage.getItem('teacherToken') || sessionStorage.getItem('teacherToken');
    console.log('- Token存在:', !!token);
    if (token) {
        console.log('- Token长度:', token.length);
        console.log('- Token预览:', token.substring(0, 20) + '...');
    }
    
    // 3. 检查容器
    console.log('\n3️⃣ 容器检查:');
    const container = document.getElementById('projectManageList');
    console.log('- projectManageList容器存在:', !!container);
    if (container) {
        console.log('- 当前内容:', container.innerHTML.substring(0, 200));
    }
    
    // 4. 检查函数定义
    console.log('\n4️⃣ 函数检查:');
    console.log('- loadProjects函数:', typeof window.teacherSystem.loadProjects === 'function');
    console.log('- renderProjects函数:', typeof window.teacherSystem.renderProjects === 'function');
    console.log('- apiRequest函数:', typeof window.teacherSystem.apiRequest === 'function');
    
    // 5. 手动调用loadProjects并捕获错误
    console.log('\n5️⃣ 手动测试loadProjects:');
    try {
        await window.teacherSystem.loadProjects();
        console.log('✅ loadProjects调用完成');
        console.log('- 项目数量:', window.teacherSystem.projects?.length || 0);
        if (window.teacherSystem.projects && window.teacherSystem.projects.length > 0) {
            console.log('- 第一个项目:', window.teacherSystem.projects[0]);
        }
    } catch (error) {
        console.error('❌ loadProjects失败:', error.message);
        console.error('错误堆栈:', error.stack);
    }
    
    // 6. 检查API请求
    console.log('\n6️⃣ API请求测试:');
    if (token) {
        try {
            const response = await fetch('http://localhost:3000/api/teacher/my-projects', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('- API响应状态:', response.status, response.statusText);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ API请求成功');
                console.log('- 返回数据:', JSON.stringify(data, null, 2).substring(0, 300));
            } else {
                const errorText = await response.text();
                console.error('❌ API请求失败:', errorText);
            }
        } catch (apiError) {
            console.error('❌ API连接失败:', apiError.message);
        }
    }
    
    // 7. 检查渲染逻辑
    console.log('\n7️⃣ 渲染逻辑检查:');
    const containerNow = document.getElementById('projectManageList');
    if (containerNow) {
        console.log('- 渲染后内容:', containerNow.innerHTML.substring(0, 300));
        
        // 检查是否有错误信息显示
        if (containerNow.innerHTML.includes('获取项目列表失败')) {
            console.error('❌ 检测到错误信息显示');
        }
        
        // 检查是否有项目卡片
        if (containerNow.innerHTML.includes('project-card') || containerNow.innerHTML.includes('机器学习算法研究')) {
            console.log('✅ 检测到项目数据渲染');
        } else {
            console.warn('⚠️ 未检测到项目数据渲染');
        }
    }
    
    console.log('\n🔍 错误检测完成！');
}

// 在浏览器控制台中运行这个函数
checkTeacherProjectsError().catch(console.error);