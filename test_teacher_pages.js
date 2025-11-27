// 测试教师两个页面的数据差异
import axios from 'axios';

async function testTeacherPages() {
    console.log('🔍 测试教师两个页面的数据差异...\n');
    
    const token = 'dev-teacher-token';
    const baseURL = 'http://localhost:3000/api';
    
    try {
        // 测试成果管理页面（应该显示教师自己的成果）
        console.log('📋 测试1: 成果管理页面数据');
        const manageResponse = await axios.get(`${baseURL}/teacher/my-projects`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const manageProjects = manageResponse.data.data?.items || [];
        console.log('✅ 成果管理页面数据:');
        console.log('- 数量:', manageProjects.length);
        console.log('- 项目:', manageProjects.map(p => p.title));
        
        // 测试成果查看页面（应该显示所有学生成果）
        console.log('\n👥 测试2: 成果查看页面数据');
        const libraryResponse = await axios.get(`${baseURL}/teacher/student-achievements`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        let libraryProjects = [];
        if (libraryResponse.data.data?.items) {
            libraryProjects = libraryResponse.data.data.items;
        } else if (Array.isArray(libraryResponse.data.data)) {
            libraryProjects = libraryResponse.data.data;
        }
        
        console.log('✅ 成果查看页面数据:');
        console.log('- 数量:', libraryProjects.length);
        console.log('- 项目:', libraryProjects.slice(0, 3).map(p => p.title));
        
        // 分析差异
        console.log('\n🔍 数据差异分析:');
        console.log('- 成果管理页面数量:', manageProjects.length);
        console.log('- 成果查看页面数量:', libraryProjects.length);
        console.log('- 数据是否相同:', manageProjects.length === libraryProjects.length && 
                    JSON.stringify(manageProjects) === JSON.stringify(libraryProjects) ? '是' : '否');
        
        if (manageProjects.length === 0 && libraryProjects.length > 0) {
            console.log('✅ 正确: 成果管理页面为空（该教师无成果），成果查看页面有学生数据');
        } else if (manageProjects.length > 0 && libraryProjects.length > 0) {
            const manageIds = new Set(manageProjects.map(p => p.id));
            const overlapping = libraryProjects.filter(p => manageIds.has(p.id));
            if (overlapping.length > 0) {
                console.log('⚠️ 警告: 两个页面有重叠数据，可能有问题');
            } else {
                console.log('✅ 正确: 两个页面显示不同数据，无重叠');
            }
        } else if (manageProjects.length > 0 && libraryProjects.length === 0) {
            console.log('ℹ️ 正常: 教师有个人成果，但暂无学生成果');
        } else if (manageProjects.length === 0 && libraryProjects.length === 0) {
            console.log('ℹ️ 信息: 两个页面都为空，数据库中可能没有成果数据');
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        if (error.response) {
            console.error('状态码:', error.response.status);
        }
    }
}

// 运行测试
testTeacherPages().then(() => {
    console.log('\n🏁 页面数据测试完成');
    process.exit(0);
}).catch(error => {
    console.error('测试过程中发生错误:', error);
    process.exit(1);
});