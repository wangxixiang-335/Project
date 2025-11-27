// 验证教师两个API端点的区别
import axios from 'axios';

async function verifyTeacherAPIs() {
    console.log('🔍 开始验证教师API端点...\n');
    
    const token = 'dev-teacher-token';
    const baseURL = 'http://localhost:3000/api';
    
    try {
        // 测试1: 教师个人成果API
        console.log('📋 测试1: 教师个人成果API');
        console.log('端点: GET /teacher/my-projects');
        
        const myProjectsResponse = await axios.get(`${baseURL}/teacher/my-projects`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            params: { page: 1, pageSize: 10 }
        });
        
        console.log('✅ 教师个人成果API响应状态:', myProjectsResponse.status);
        const myProjects = myProjectsResponse.data.data || [];
        console.log('📊 教师个人成果数量:', myProjects.length);
        if (myProjects.length > 0) {
            console.log('📋 示例项目:', myProjects[0].title, '(类型:', myProjects[0].project_type, ')');
        }
        console.log('');
        
        // 测试2: 学生成果API
        console.log('👥 测试2: 学生成果API');
        console.log('端点: GET /teacher/student-achievements');
        
        const studentAchievementsResponse = await axios.get(`${baseURL}/teacher/student-achievements`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            params: { page: 1, pageSize: 10 }
        });
        
        console.log('✅ 学生成果API响应状态:', studentAchievementsResponse.status);
        const studentAchievements = studentAchievementsResponse.data.data?.items || 
                                studentAchievementsResponse.data.data || [];
        console.log('📊 学生成果数量:', studentAchievements.length);
        if (studentAchievements.length > 0) {
            console.log('📋 示例学生成果:', studentAchievements[0].title, '(类型:', studentAchievements[0].project_type, ')');
        }
        console.log('');
        
        // 分析差异
        console.log('🔍 API差异分析:');
        console.log('- 教师个人成果数量:', myProjects.length);
        console.log('- 学生成果数量:', studentAchievements.length);
        console.log('- 数据是否相同:', myProjects.length === studentAchievements.length && 
                    JSON.stringify(myProjects) === JSON.stringify(studentAchievements) ? '是' : '否');
        
        if (myProjects.length > 0 && studentAchievements.length > 0) {
            console.log('\n📋 数据内容对比:');
            console.log('教师成果预览:', myProjects.slice(0, 2).map(p => p.title));
            console.log('学生成果预览:', studentAchievements.slice(0, 2).map(p => p.title));
            
            // 检查是否有重叠
            const myProjectIds = new Set(myProjects.map(p => p.id));
            const overlapping = studentAchievements.filter(p => myProjectIds.has(p.id));
            if (overlapping.length > 0) {
                console.log('⚠️ 警告: 发现重叠数据，API可能有问题');
                console.log('重叠项目数量:', overlapping.length);
            } else {
                console.log('✅ 无重叠数据，API工作正常');
            }
        } else if (myProjects.length === 0 && studentAchievements.length === 0) {
            console.log('ℹ️ 两个API都返回空数据，数据库中可能没有成果数据');
        } else if (myProjects.length === 0 && studentAchievements.length > 0) {
            console.log('ℹ️ 正常: 教师没有个人成果，但存在学生成果');
        } else if (myProjects.length > 0 && studentAchievements.length === 0) {
            console.log('ℹ️ 正常: 教师有个人成果，但暂无学生成果');
        }
        
    } catch (error) {
        console.error('❌ API验证失败:', error.message);
        if (error.response) {
            console.error('状态码:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
    }
}

// 运行验证
verifyTeacherAPIs().then(() => {
    console.log('\n🏁 API验证完成');
    process.exit(0);
}).catch(error => {
    console.error('验证过程中发生错误:', error);
    process.exit(1);
});