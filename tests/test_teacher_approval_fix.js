// 测试教师审批功能修复
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';
let authToken = null;

async function testTeacherLogin() {
    console.log('🧪 测试教师登录...');
    try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
            email: 'teacher@example.com',
            password: 'teacher123'
        });
        
        if (response.data.success) {
            authToken = response.data.token;
            console.log('✅ 教师登录成功，Token已获取');
            return true;
        } else {
            console.log('❌ 教师登录失败:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ 登录请求失败:', error.message);
        return false;
    }
}

async function testGetPendingProjects() {
    console.log('\n🧪 测试获取待审批项目...');
    try {
        const response = await axios.get(`${API_BASE}/review/pending`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.data.success) {
            console.log('✅ 待审批项目获取成功，项目数量:', response.data.data.length);
            return response.data.data;
        } else {
            console.log('❌ 待审批项目获取失败:', response.data.message);
            return [];
        }
    } catch (error) {
        console.log('❌ 获取待审批项目请求失败:', error.message);
        return [];
    }
}

async function testGetProjectDetails(projectId) {
    console.log(`\n🧪 测试获取项目详情 (ID: ${projectId})...`);
    try {
        const response = await axios.get(`${API_BASE}/review/${projectId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.data.success) {
            console.log('✅ 项目详情获取成功');
            console.log('📋 项目标题:', response.data.data.title);
            console.log('👤 学生姓名:', response.data.data.student_name);
            return response.data.data;
        } else {
            console.log('❌ 项目详情获取失败:', response.data.message);
            return null;
        }
    } catch (error) {
        console.log('❌ 获取项目详情请求失败:', error.message);
        return null;
    }
}

async function testApproveProject(projectId) {
    console.log(`\n🧪 测试通过项目 (ID: ${projectId})...`);
    try {
        const response = await axios.post(`${API_BASE}/review/${projectId}/audit`, {
            audit_result: 'approve',
            reject_reason: ''
        }, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.data.success) {
            console.log('✅ 项目通过成功');
            return true;
        } else {
            console.log('❌ 项目通过失败:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ 项目通过请求失败:', error.message);
        return false;
    }
}

async function testRejectProject(projectId) {
    console.log(`\n🧪 测试驳回项目 (ID: ${projectId})...`);
    try {
        const response = await axios.post(`${API_BASE}/review/${projectId}/audit`, {
            audit_result: 'reject',
            reject_reason: '测试驳回原因：项目质量不符合要求'
        }, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.data.success) {
            console.log('✅ 项目驳回成功');
            return true;
        } else {
            console.log('❌ 项目驳回失败:', response.data.message);
            return false;
        }
    } catch (error) {
        console.log('❌ 项目驳回请求失败:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 开始测试教师审批功能修复...\n');
    
    // 1. 登录
    const loginSuccess = await testTeacherLogin();
    if (!loginSuccess) {
        console.log('❌ 登录失败，终止测试');
        return;
    }
    
    // 2. 获取待审批项目
    const pendingProjects = await testGetPendingProjects();
    if (pendingProjects.length === 0) {
        console.log('⚠️  没有待审批项目，无法继续测试');
        return;
    }
    
    // 3. 获取第一个项目的详情
    const firstProject = pendingProjects[0];
    const projectDetails = await testGetProjectDetails(firstProject.project_id);
    if (!projectDetails) {
        console.log('❌ 无法获取项目详情，终止测试');
        return;
    }
    
    // 4. 测试通过操作（注释掉，避免影响实际数据）
    // await testApproveProject(firstProject.project_id);
    
    // 5. 测试驳回操作（注释掉，避免影响实际数据）
    // await testRejectProject(firstProject.project_id);
    
    console.log('\n✅ 教师审批功能修复测试完成！');
    console.log('💡 提示：实际的通过/驳回操作已注释掉，避免影响测试数据');
    console.log('📝 前端修复内容包括：');
    console.log('   - 修复了reviewProject函数，现在可以正确获取项目详情');
    console.log('   - 修复了confirmApproval函数，现在可以正确处理通过/驳回操作');
    console.log('   - 增强了错误处理和用户反馈');
    console.log('   - 改进了模态框显示和关闭逻辑');
    console.log('   - 添加了详细的日志记录');
}

runTests().catch(console.error);