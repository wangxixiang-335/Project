import axios from 'axios';

// 模拟真实的教师系统环境
class TestTeacherSystem {
    constructor() {
        this.token = null;
        this.user = null;
        this.projects = [];
        this.currentPage = 'home';
    }
    
    async checkAuth() {
        try {
            console.log('🔑 检查认证状态...');
            
            // 模拟登录过程
            const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
                email: 'teacher1763449748933@example.com',
                password: 'password123'
            });
            
            if (loginResponse.data.success) {
                this.token = loginResponse.data.data.token;
                this.user = loginResponse.data.data;
                console.log('✅ 认证成功:', this.user.username);
                return true;
            } else {
                console.error('❌ 认证失败:', loginResponse.data.error);
                return false;
            }
        } catch (error) {
            console.error('❌ 认证异常:', error.message);
            return false;
        }
    }
    
    // 模拟前端的apiRequest方法
    async apiRequest(endpoint, method = 'GET', data = null) {
        const url = `http://localhost:3000/api${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        console.log(`📡 API请求: ${method} ${url}`);
        
        try {
            const response = await fetch(url, {
                method,
                headers,
                body: data && (method === 'POST' || method === 'PUT') ? JSON.stringify(data) : undefined
            });
            
            console.log(`📊 响应状态: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                const error = new Error(`HTTP错误: ${response.status} ${response.statusText}`);
                error.status = response.status;
                throw error;
            }
            
            const result = await response.json();
            console.log('✅ API响应成功:', result.message || '操作成功');
            return result;
            
        } catch (error) {
            console.error('❌ API请求失败:', error.message);
            throw error;
        }
    }
    
    // 模拟前端的loadProjects方法（修复后的版本）
    async loadProjects() {
        console.log('\n🚀 开始加载教师项目列表（模拟前端逻辑）');
        
        if (!this.token) {
            console.error('❌ 没有认证token');
            return false;
        }
        
        // 使用与前段相同的端点配置
        const apiEndpoints = [
            '/teacher/my-projects',     // 教师个人项目
            '/teacher/projects',        // 教师所有项目  
            '/projects',                // 通用项目列表（学生端）
            '/achievements'             // 成果列表
        ];
        
        let apiSuccess = false;
        let lastError = null;
        
        for (let i = 0; i < apiEndpoints.length; i++) {
            const endpoint = apiEndpoints[i];
            console.log(`\n🔄 尝试API端点 ${i + 1}/${apiEndpoints.length}: ${endpoint}`);
            
            try {
                const response = await this.apiRequest(endpoint, 'GET');
                
                if (response.success && response.data) {
                    // 处理分页响应格式（修复后的逻辑）
                    let projectsData = [];
                    if (Array.isArray(response.data)) {
                        // 直接数组格式
                        projectsData = response.data;
                        console.log(`✅ 检测到直接数组格式，项目数: ${response.data.length}`);
                    } else if (response.data.items && Array.isArray(response.data.items)) {
                        // 分页格式
                        projectsData = response.data.items;
                        console.log(`✅ 检测到分页格式，项目数: ${response.data.items.length}`);
                    }
                    
                    if (projectsData.length > 0) {
                        apiSuccess = true;
                        
                        // 格式化项目数据（与前段相同的逻辑）
                        this.projects = projectsData.map(project => ({
                            id: project.id || project.project_id,
                            title: project.title,
                            type: project.status_text || project.type || '项目',
                            status: project.status || 0,
                            coverImage: project.cover_image || project.coverImage || '📄',
                            publishTime: project.created_at ? new Date(project.created_at).toLocaleDateString() : '未知日期'
                        }));
                        
                        console.log('✅ 项目数据格式化完成');
                        console.log(`📊 最终项目数量: ${this.projects.length}`);
                        
                        if (this.projects.length === 0) {
                            console.log('ℹ️  项目列表为空');
                        }
                        
                        // 成功就跳出循环
                        break;
                    } else {
                        console.log('ℹ️  项目列表为空，继续尝试下一个端点');
                    }
                } else {
                    console.warn(`⚠️  API端点 ${endpoint} 返回数据无效:`, response.message);
                    lastError = new Error(`API返回数据无效: ${response.message || '未知错误'}`);
                }
                
            } catch (error) {
                console.error(`❌ API端点 ${endpoint} 失败:`, error.message);
                lastError = error;
                
                // 继续尝试下一个端点
                if (i < apiEndpoints.length - 1) {
                    console.log('🔄 尝试下一个端点...');
                    continue;
                }
            }
        }
        
        if (!apiSuccess) {
            console.error('❌ 所有API端点都失败，最后错误:', lastError?.message);
            
            // 显示前端会显示的错误信息
            const errorMsg = lastError?.message || '所有API端点都失败';
            console.error(`🎯 前端显示的错误: 获取项目列表失败: ${errorMsg}`);
            
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ 加载项目失败:', error.message);
        return false;
    }
    
    // 显示结果
    displayResults() {
        console.log('\n📋 === 最终结果 ===');
        if (this.projects.length > 0) {
            console.log('✅ 项目列表加载成功！');
            console.log(`📊 项目数量: ${this.projects.length}`);
            console.log('\n📋 项目详情:');
            this.projects.forEach((project, index) => {
                console.log(`${index + 1}. ${project.title} (${project.type}) - ${project.publishTime}`);
            });
        } else {
            console.log('❌ 项目列表加载失败');
        }
    }
}

// 运行完整测试
async function runCompleteTest() {
    console.log('🧪 === 开始完整教师系统测试 ===\n');
    
    const teacherSystem = new TestTeacherSystem();
    
    // 1. 认证
    const authSuccess = await teacherSystem.checkAuth();
    if (!authSuccess) {
        console.log('❌ 测试终止：认证失败');
        return;
    }
    
    // 2. 加载项目
    const loadSuccess = await teacherSystem.loadProjects();
    
    // 3. 显示结果
    teacherSystem.displayResults();
    
    console.log('\n🎯 === 测试结论 ===');
    if (loadSuccess) {
        console.log('✅ 修复成功！项目列表可以正常加载');
        console.log('💡 如果实际环境仍然显示404错误，请检查：');
        console.log('   1. 前端文件是否正确加载（清除浏览器缓存）');
        console.log('   2. 服务器是否正确重启');
        console.log('   3. 网络请求是否被代理或重定向');
    } else {
        console.log('❌ 仍然存在问题，需要进一步调试');
    }
}

runCompleteTest();