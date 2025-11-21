// 教师管理系统JavaScript
class TeacherSystem {
    constructor() {
        this.currentPage = 'home';
        this.currentTab = 'pending';
        this.user = null;
        this.notifications = {
            pending: [],
            approved: [],
            rejected: []
        };
        this.projects = [];
        this.approvalProjects = [];
        this.init();
    }

    // 初始化系统
    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        await this.loadUserData();
        await this.loadNotifications();
        await this.loadProjects();
        this.showPage(this.currentPage);
    }

    // 检查认证状态
    async checkAuth() {
        const token = localStorage.getItem('teacherToken') || sessionStorage.getItem('teacherToken');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await this.apiRequest('/api/auth/me', 'GET', null, token);
            if (response.success) {
                this.user = response.data;
                console.log('用户信息已加载:', this.user);
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('认证检查失败:', error);
            this.logout();
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        // 导航切换
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.dataset.page;
                this.showPage(page);
            });
        });

        // 通知标签切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchNotificationTab(tab);
            });
        });
    }

    // 显示页面
    showPage(page) {
        // 隐藏所有页面
        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.remove('active');
        });

        // 显示目标页面
        const targetSection = document.getElementById(page);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // 更新导航状态
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-page="${page}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        this.currentPage = page;

        // 加载页面数据
        this.loadPageData(page);
    }

    // 加载页面数据
    async loadPageData(page) {
        switch(page) {
            case 'library':
                await this.loadLibraryData();
                break;
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'home':
                await this.loadNotifications();
                break;
            case 'approval':
                await this.loadApprovalProjects();
                break;
            case 'manage':
                await this.loadProjects();
                break;
            case 'library':
                await this.loadLibraryProjects();
                break;
            case 'dashboard':
                await this.loadDashboardData();
                break;
        }
    }

    // API请求方法
    async apiRequest(endpoint, method = 'GET', data = null, token = null) {
        const url = `http://localhost:3000${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers,
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            config.body = JSON.stringify(data);
        }

        try {
            console.log(`📡 API请求: ${method} ${url}`, data || '无数据');
            console.log(`📋 请求头:`, headers);
            
            const response = await fetch(url, config);
            
            console.log(`📊 响应状态: ${response.status} ${response.statusText}`);
            console.log(`📋 响应头:`, Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
                let errorData = null;
                try {
                    errorData = await response.json();
                    console.error('📋 错误响应数据:', errorData);
                } catch (e) {
                    const errorText = await response.text();
                    console.error('📋 错误响应文本:', errorText);
                }
                
                const error = new Error(`HTTP错误: ${response.status} ${response.statusText}`);
                error.status = response.status;
                error.data = errorData;
                throw error;
            }
            
            const result = await response.json();
            console.log('✅ API响应成功:', result);
            return result;
        } catch (error) {
            console.error('❌ API请求失败:', error);
            console.error('📋 错误详情:', {
                message: error.message,
                status: error.status,
                data: error.data,
                stack: error.stack
            });
            throw error;
        }
    }

    // 加载用户数据
    async loadUserData() {
        if (this.user) {
            // 填充用户信息到表单
            const usernameInput = document.getElementById('username');
            const emailInput = document.getElementById('email');
            const signatureInput = document.getElementById('signature');

            if (usernameInput) usernameInput.value = this.user.username || '';
            if (emailInput) emailInput.value = this.user.email || '';
            if (signatureInput) signatureInput.value = this.user.signature || '';
        }
    }

    // 通知相关方法
    async loadNotifications() {
        try {
            // 模拟通知数据
            this.notifications = {
                pending: [
                    {
                        id: '1',
                        title: '基于AI的智能学习系统',
                        type: '项目',
                        submitTime: '2024-01-15',
                        status: 0
                    },
                    {
                        id: '2', 
                        title: '数据可视化平台',
                        type: '作品',
                        submitTime: '2024-01-14',
                        status: 0
                    }
                ],
                approved: [
                    {
                        id: '3',
                        title: '移动应用开发',
                        type: '项目',
                        score: 95,
                        status: 2
                    }
                ],
                rejected: [
                    {
                        id: '4',
                        title: '算法优化研究',
                        type: '论文',
                        reject_reason: '创新性不足，需要更多实验数据支撑',
                        status: 3
                    }
                ]
            };
            
            this.renderNotifications();
        } catch (error) {
            console.error('加载通知失败:', error);
        }
    }

    switchNotificationTab(tab) {
        this.currentTab = tab;
        
        // 更新标签状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-tab="${tab}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        this.renderNotifications();
    }

    renderNotifications() {
        const container = document.getElementById('notificationList');
        if (!container) return;
        
        const notifications = this.notifications[this.currentTab] || [];
        
        if (notifications.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #999; padding: 40px;">暂无通知</div>';
            return;
        }

        container.innerHTML = notifications.map(notification => `
            <div class="notification-item">
                <div class="notification-cover">
                    📋
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-info">
                        ${notification.score ? `分数: ${notification.score}` : `驳回原因: ${notification.reject_reason || '无'}`}
                    </div>
                </div>
                <div class="notification-status ${this.getStatusClass(notification.status)}">
                    ${this.getStatusIcon(notification.status)}
                </div>
                <button class="notification-close" onclick="teacherSystem.clearNotification('${notification.id}')">&times;</button>
            </div>
        `).join('');
    }

    getStatusClass(status) {
        switch(status) {
            case 2: return 'approved';
            case 3: return 'rejected';
            default: return 'pending';
        }
    }

    getStatusIcon(status) {
        switch(status) {
            case 2: return '✓';
            case 3: return '✗';
            default: return '';
        }
    }

    clearNotification(id) {
        // 清除单个通知
        this.notifications[this.currentTab] = this.notifications[this.currentTab].filter(n => n.id !== id);
        this.renderNotifications();
    }

    clearAllNotifications() {
        this.notifications[this.currentTab] = [];
        this.renderNotifications();
    }

    // 成果审批相关方法
    async loadApprovalProjects() {
        try {
            console.log('开始加载待审批项目列表');
            
            const token = localStorage.getItem('teacherToken') || sessionStorage.getItem('teacherToken');
            if (!token) {
                console.error('没有认证token');
                this.showMessage('请先登录', 'error');
                return;
            }
            
            // 从API获取待审批项目列表
            const response = await this.apiRequest('/api/review/pending', 'GET', null, token);
            
            if (response.success) {
                console.log('待审批项目列表获取成功:', response.data);
                
                // 格式化数据以适配前端显示
                this.approvalProjects = response.data.map(project => ({
                    id: project.project_id,
                    title: project.title,
                    type: '项目', // 默认类型，实际应该从项目数据中获取
                    studentName: project.student_name || '未知学生',
                    instructorName: '待分配', // 可以从项目数据中获取指导老师
                    submitTime: new Date(project.submitted_at).toLocaleDateString(),
                    status: 1 // 待审核状态
                }));
                
                console.log('格式化后的项目数据:', this.approvalProjects);
                this.renderApprovalProjects();
            } else {
                console.error('获取待审批项目失败:', response.message);
                this.showMessage('获取待审批项目失败: ' + response.message, 'error');
                
                // 如果没有数据，显示空列表
                this.approvalProjects = [];
                this.renderApprovalProjects();
            }
            
        } catch (error) {
            console.error('加载审批项目失败:', error);
            this.showMessage('加载审批项目失败，请重试', 'error');
            
            // 显示空列表
            this.approvalProjects = [];
            this.renderApprovalProjects();
        }
    }

    renderApprovalProjects() {
        const container = document.getElementById('approvalList');
        if (!container) return;
        
        if (this.approvalProjects.length === 0) {
            container.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">暂无待审批项目</td></tr>';
            return;
        }

        container.innerHTML = this.approvalProjects.map(project => `
            <tr>
                <td>${project.title}</td>
                <td>${project.type}</td>
                <td>${project.studentName}</td>
                <td>${project.instructorName}</td>
                <td>${project.submitTime}</td>
                <td>
                    <button class="btn btn-primary" onclick="teacherSystem.reviewProject('${project.id}')">批改</button>
                </td>
            </tr>
        `).join('');
    }

    async reviewProject(id) {
        try {
            console.log('查看项目详情:', id);
            this.currentReviewId = id;
            
            // 获取项目详情
            const token = localStorage.getItem('teacherToken') || sessionStorage.getItem('teacherToken');
            const response = await this.apiRequest(`/api/review/${id}`, 'GET', null, token);
            
            if (response.success) {
                const project = response.data;
                console.log('项目详情:', project);
                
                // 显示项目详情模态框
                this.showApprovalModal(project);
            } else {
                console.error('获取项目详情失败:', response.message);
                this.showMessage('获取项目详情失败: ' + response.message, 'error');
            }
        } catch (error) {
            console.error('查看项目失败:', error);
            this.showMessage('查看项目失败，请重试', 'error');
        }
    }

    showApprovalModal(project) {
        const modal = document.getElementById('approvalModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        
        if (!modal || !modalTitle || !modalContent) {
            console.error('模态框元素不存在');
            return;
        }
        
        // 设置模态框标题
        modalTitle.textContent = '项目审批 - ' + project.title;
        
        // 构建项目详情内容
        let content = `
            <div style="margin-bottom: 20px;">
                <h4>${project.title}</h4>
                <p><strong>学生:</strong> ${project.student_name || '未知学生'}</p>
                <p><strong>提交时间:</strong> ${new Date(project.created_at).toLocaleString()}</p>
                <p><strong>类型:</strong> ${project.type_id || '未分类'}</p>
                ${project.description ? `<p><strong>描述:</strong></p><div style="margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 5px;">${project.description}</div>` : ''}
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px;">
                <h4>审批操作</h4>
                <div style="margin: 15px 0;">
                    <label style="display: block; margin-bottom: 10px;">
                        <input type="radio" name="approvalType" value="approve" checked> 通过
                    </label>
                    <label style="display: block; margin-bottom: 10px;">
                        <input type="radio" name="approvalType" value="reject"> 驳回
                    </label>
                </div>
                
                <div id="rejectReasonSection" style="display: none; margin: 15px 0;">
                    <label for="rejectReason"><strong>驳回原因:</strong></label>
                    <textarea id="rejectReason" class="form-control" rows="3" placeholder="请输入驳回原因..."></textarea>
                </div>
            </div>
        `;
        
        modalContent.innerHTML = content;
        
        // 添加事件监听器
        const approveRadio = modalContent.querySelector('input[value="approve"]');
        const rejectRadio = modalContent.querySelector('input[value="reject"]');
        const rejectReasonSection = modalContent.querySelector('#rejectReasonSection');
        
        if (approveRadio && rejectRadio && rejectReasonSection) {
            approveRadio.addEventListener('change', () => {
                rejectReasonSection.style.display = 'none';
            });
            
            rejectRadio.addEventListener('change', () => {
                rejectReasonSection.style.display = 'block';
            });
        }
        
        // 显示模态框
        modal.style.display = 'block';
        modal.classList.add('active');
    }

    async confirmApproval() {
        try {
            if (!this.currentReviewId) {
                console.error('没有当前审批的项目ID');
                this.showMessage('请先选择要审批的项目', 'error');
                return;
            }
            
            const type = document.querySelector('input[name="approvalType"]:checked')?.value;
            const rejectReason = document.getElementById('rejectReason')?.value || '';
            
            if (!type) {
                this.showMessage('请选择审批类型', 'error');
                return;
            }
            
            if (type === 'reject' && !rejectReason.trim()) {
                this.showMessage('请输入驳回原因', 'error');
                return;
            }
            
            console.log('审批确认:', { id: this.currentReviewId, type, rejectReason });
            
            // 调用API进行审批
            const token = localStorage.getItem('teacherToken') || sessionStorage.getItem('teacherToken');
            const response = await this.apiRequest(`/api/review/${this.currentReviewId}/audit`, 'POST', {
                audit_result: type,
                reject_reason: rejectReason
            }, token);
            
            if (response.success) {
                const message = type === 'approve' ? '项目已通过审批' : '项目已驳回';
                this.showMessage(message, 'success');
                
                // 关闭模态框
                this.closeModal();
                
                // 重新加载审批列表
                await this.loadApprovalProjects();
                
                // 清除当前审批ID
                this.currentReviewId = null;
            } else {
                console.error('审批失败:', response.message);
                this.showMessage('审批失败: ' + response.message, 'error');
            }
            
        } catch (error) {
            console.error('审批操作失败:', error);
            this.showMessage('审批操作失败，请重试', 'error');
        }
    }

    // 成果管理相关方法
    async loadProjects() {
        try {
            console.log('🚀 开始加载教师项目列表');
            
            const token = localStorage.getItem('teacherToken') || sessionStorage.getItem('teacherToken');
            if (!token) {
                console.error('❌ 没有认证token');
                this.showMessage('请先登录', 'error');
                this.renderError('请先登录系统');
                return;
            }
            
            console.log('✅ Token存在，长度:', token.length);
            
            // 尝试从API获取项目数据 - 使用多个备选端点
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
                console.log(`🔄 尝试API端点 ${i + 1}/${apiEndpoints.length}: ${endpoint}`);
                
                try {
                    const response = await this.apiRequest(endpoint, 'GET', null, token);
                    
                    if (response.success && response.data) {
                        // 处理分页响应格式
                        let projectsData = [];
                        if (Array.isArray(response.data)) {
                            // 直接数组格式
                            projectsData = response.data;
                            console.log(`✅ API端点 ${endpoint} 成功，获取到 ${response.data.length} 个项目`);
                        } else if (response.data.items && Array.isArray(response.data.items)) {
                            // 分页格式
                            projectsData = response.data.items;
                            console.log(`✅ API端点 ${endpoint} 成功，获取到 ${response.data.items.length} 个项目 (分页格式)`);
                        }
                        
                        if (projectsData.length > 0) {
                            apiSuccess = true;
                            
                            // 格式化项目数据
                            this.projects = projectsData.map(project => ({
                                id: project.id || project.project_id,
                                title: project.title,
                                type: project.status_text || project.type || '项目',
                                status: project.status || 0,
                                coverImage: project.cover_image || project.coverImage || '📄',
                                publishTime: project.created_at ? new Date(project.created_at).toLocaleDateString() : '未知日期'
                            }));
                        
                        console.log('✅ 格式化后的项目数据:', this.projects);
                        
                        if (this.projects.length === 0) {
                            console.log('ℹ️  项目列表为空');
                            this.showMessage('暂无项目数据', 'info');
                        }
                        
                        this.renderProjects();
                        break;
                        
                    } else {
                        console.warn(`⚠️  API端点 ${endpoint} 返回数据无效:`, response);
                        lastError = new Error(`API返回数据无效: ${response.message || '未知错误'}`);
                    }
                    
                } catch (endpointError) {
                    console.error(`❌ API端点 ${endpoint} 失败:`, endpointError.message);
                    lastError = endpointError;
                    
                    // 继续尝试下一个端点
                    if (i < apiEndpoints.length - 1) {
                        console.log('🔄 尝试下一个端点...');
                        continue;
                    }
                }
            }
            
            if (!apiSuccess) {
                console.error('❌ 所有API端点都失败，最后错误:', lastError);
                const errorMsg = lastError?.message || '所有API端点都失败';
                this.showMessage('获取项目列表失败: ' + errorMsg, 'error');
                this.renderError('获取项目列表失败: ' + errorMsg);
                
                // 使用模拟数据作为后备
                this.loadMockProjects();
            }
            
        } catch (error) {
            console.error('❌ 加载项目失败:', error);
            console.error('📋 错误详情:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            
            const errorMsg = error.message || '未知错误';
            this.showMessage('加载项目失败: ' + errorMsg, 'error');
            this.renderError('加载项目失败: ' + errorMsg);
            
            // 使用模拟数据作为后备
            this.loadMockProjects();
        }
    }

    // 渲染错误信息
    renderError(message) {
        const container = document.getElementById('projectManageList');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                    <div style="font-size: 16px; margin-bottom: 8px;">获取项目列表失败</div>
                    <div style="font-size: 14px; color: #999;">${message}</div>
                    <button onclick="teacherSystem.retryLoadProjects()" class="btn btn-primary" style="margin-top: 16px;">
                        重新加载
                    </button>
                </div>
            `;
        }
    }

    // 重新加载项目
    retryLoadProjects() {
        console.log('🔄 重新加载项目列表');
        this.showMessage('正在重新加载...', 'info');
        this.loadProjects();
    }

    // 模拟数据加载（后备方案）
    loadMockProjects() {
        console.log('使用模拟项目数据');
        
        this.projects = [
            {
                id: '1',
                title: '机器学习算法研究',
                type: '论文',
                status: 2, // 已发布
                coverImage: '📚',
                publishTime: '2024-01-10'
            },
            {
                id: '2',
                title: 'Web应用开发',
                type: '项目',
                status: 1, // 审核中
                coverImage: '🌐',
                publishTime: '2024-01-12'
            },
            {
                id: '3',
                title: '数据分析报告',
                type: '报告',
                status: 3, // 未通过
                coverImage: '📊',
                publishTime: '2024-01-13'
            },
            {
                id: '4',
                title: 'AI模型设计',
                type: '草稿',
                status: 0, // 草稿
                coverImage: '🤖',
                publishTime: '2024-01-14'
            }
        ];
        
        this.renderProjects();
    }

    renderProjects() {
        const container = document.getElementById('projectManageList');
        if (!container) return;
        
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.status || 'all';
        let filteredProjects = this.projects;
        
        if (activeFilter !== 'all') {
            filteredProjects = this.projects.filter(p => p.status === parseInt(activeFilter));
        }

        if (filteredProjects.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #999; padding: 40px;">暂无项目</div>';
            return;
        }

        container.innerHTML = filteredProjects.map(project => `
            <div class="project-card">
                <div class="project-cover">${project.coverImage}</div>
                <div class="project-info">
                    <div class="project-title">${project.title}</div>
                    <div class="project-meta">${project.type} · ${project.publishTime}</div>
                </div>
                <div class="project-actions">
                    ${this.getProjectActions(project.status, project.id)}
                </div>
            </div>
        `).join('');
    }

    getProjectActions(status, id) {
        switch(status) {
            case 2: // 已发布
                return `
                    <button class="btn btn-outline" onclick="teacherSystem.editProject('${id}')">编辑</button>
                    <button class="btn btn-danger" onclick="teacherSystem.deleteProject('${id}')">删除</button>
                `;
            case 1: // 审核中
                return `<button class="btn btn-secondary" onclick="teacherSystem.withdrawProject('${id}')">撤回</button>`;
            case 3: // 未通过
                return `
                    <button class="btn btn-outline" onclick="teacherSystem.editProject('${id}')">编辑</button>
                    <button class="btn btn-danger" onclick="teacherSystem.deleteProject('${id}')">删除</button>
                    <button class="btn btn-secondary" onclick="teacherSystem.saveDraft('${id}')">存草稿</button>
                    <button class="btn btn-primary" onclick="teacherSystem.publishProject('${id}')">发布</button>
                `;
            case 0: // 草稿
                return `
                    <button class="btn btn-outline" onclick="teacherSystem.editProject('${id}')">编辑</button>
                    <button class="btn btn-danger" onclick="teacherSystem.deleteProject('${id}')">删除</button>
                `;
            default:
                return '';
        }
    }

    editProject(id) {
        console.log('编辑项目:', id);
    }

    deleteProject(id) {
        if (confirm('确定要删除这个项目吗？')) {
            console.log('删除项目:', id);
            this.projects = this.projects.filter(p => p.id !== id);
            this.renderProjects();
        }
    }

    withdrawProject(id) {
        if (confirm('确定要撤回这个项目吗？')) {
            console.log('撤回项目:', id);
            const project = this.projects.find(p => p.id === id);
            if (project) {
                project.status = 0; // 改为草稿
                this.renderProjects();
            }
        }
    }

    saveDraft(id) {
        console.log('保存草稿:', id);
        const project = this.projects.find(p => p.id === id);
        if (project) {
            project.status = 0; // 草稿状态
            this.renderProjects();
        }
    }

    publishProject(id) {
        console.log('发布项目:', id);
        const project = this.projects.find(p => p.id === id);
        if (project) {
            project.status = 1; // 审核中状态
            this.renderProjects();
        }
    }

    // 成果查看
    async loadLibraryProjects() {
        try {
            console.log('📋 开始加载成果查看数据...');
            
            const token = localStorage.getItem('teacherToken') || sessionStorage.getItem('teacherToken');
            if (!token) {
                console.error('❌ 没有认证token');
                this.renderLibraryProjects([]);
                return;
            }
            
            // 调用真实的API获取已通过审核的成果
            const response = await this.apiRequest('/api/teacher/library', 'GET', null, token);
            
            console.log('📊 成果库API响应:', response);
            
            if (response.success && response.data) {
                const items = response.data.items || [];
                console.log(`📚 从API获取到 ${items.length} 个成果`);
                
                if (items.length === 0) {
                    console.log('ℹ️ 成果库为空，显示空状态');
                    this.renderLibraryProjects([]);
                    return;
                }
                
                const libraryProjects = items.map(project => ({
                    id: project.id,
                    title: project.title || '未命名成果',
                    score: project.score || '未评分',
                    type: this.getProjectTypeText(project.type) || '未知类型',
                    studentName: project.student_name || project.studentName || '未知学生',
                    instructorName: project.instructor_name || project.instructorName || '未分配',
                    submitTime: project.created_at ? new Date(project.created_at).toLocaleDateString() : '未知时间'
                }));
                
                console.log(`✅ 成功处理 ${libraryProjects.length} 个成果:`, libraryProjects);
                this.renderLibraryProjects(libraryProjects);
            } else {
                console.warn('⚠️ 成果查看数据为空或格式错误:', response);
                this.renderLibraryProjects([]);
            }
        } catch (error) {
            console.error('❌ 加载成果查看失败:', error);
            this.renderLibraryProjects([]);
        }
    }

    renderLibraryProjects(projects) {
        const container = document.getElementById('libraryList');
        if (!container) return;
        
        if (projects.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; background: #f8fafc;">
                        <div style="text-align: center; color: #666; max-width: 400px; margin: 0 auto;">
                            <div style="font-size: 48px; margin-bottom: 16px;">📚</div>
                            <h3 style="margin-bottom: 8px; color: #333;">成果库为空</h3>
                            <p style="margin-bottom: 16px; line-height: 1.5;">目前还没有已通过的成果可以查看</p>
                            <div style="background: #e5f3ff; padding: 12px; border-radius: 6px; border-left: 4px solid #3b82f6; text-align: left; margin-top: 16px;">
                                <strong>💡 说明：</strong><br>
                                • 学生提交的成果需要经过审批通过后才会显示在这里<br>
                                • 您可以在"成果审批"页面处理待审批的申请<br>
                                • 已通过的成果会自动出现在此列表中
                            </div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = projects.map(project => `
            <tr>
                <td>${project.title}</td>
                <td>${project.score}</td>
                <td>${project.type}</td>
                <td>${project.studentName}</td>
                <td>${project.instructorName}</td>
                <td>${project.submitTime}</td>
                <td>
                    <button class="btn btn-primary" onclick="teacherSystem.viewProject('${project.id}')">查看</button>
                </td>
            </tr>
        `).join('');
    }

    viewProject(id) {
        console.log('查看项目:', id);
    }

    // 辅助方法：获取项目类型文本
    getProjectTypeText(type) {
        const typeMap = {
            'paper': '论文',
            'project': '项目',
            'thesis': '毕业论文',
            'report': '报告',
            'design': '设计',
            'other': '其他'
        };
        return typeMap[type] || type || '项目';
    }

    // 数据看板
    async loadDashboardData() {
        try {
            // 模拟统计数据
            const stats = {
                total: 100,
                approved: 75,
                pending: 15,
                rejected: 10
            };
            
            this.renderDashboardStats(stats);
        } catch (error) {
            console.error('加载看板数据失败:', error);
        }
    }

    renderDashboardStats(stats) {
        // 渲染统计卡片
        const cards = [
            { label: '总发布量', value: stats.total, icon: '📊' },
            { label: '已通过', value: stats.approved, icon: '✅' },
            { label: '待审批', value: stats.pending, icon: '⏳' },
            { label: '已打回', value: stats.rejected, icon: '❌' }
        ];
        
        const container = document.querySelector('.stats-grid');
        if (container) {
            container.innerHTML = cards.map(card => `
                <div class="stat-card">
                    <div class="stat-icon">${card.icon}</div>
                    <div class="stat-value">${card.value}</div>
                    <div class="stat-label">${card.label}</div>
                </div>
            `).join('');
        }
    }

    // 通用方法
    logout() {
        localStorage.removeItem('teacherToken');
        sessionStorage.removeItem('teacherToken');
        window.location.href = 'login.html';
    }

    closeModal() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
            modal.classList.remove('active');
        });
        
        // 清除当前审批ID
        this.currentReviewId = null;
        
        console.log('模态框已关闭');
    }

    showMessage(message, type = 'info') {
        console.log(`消息提示 [${type}]:`, message);
        
        // 创建消息提示元素
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        // 设置样式
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease;
        `;
        
        // 根据类型设置背景色
        switch(type) {
            case 'success':
                messageDiv.style.backgroundColor = '#10b981';
                break;
            case 'error':
                messageDiv.style.backgroundColor = '#ef4444';
                break;
            case 'warning':
                messageDiv.style.backgroundColor = '#f59e0b';
                break;
            default:
                messageDiv.style.backgroundColor = '#6b7280';
        }
        
        // 添加动画样式
        if (!document.getElementById('messageAnimations')) {
            const style = document.createElement('style');
            style.id = 'messageAnimations';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(messageDiv);
        
        // 3秒后自动移除
        setTimeout(() => {
            messageDiv.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 3000);
        
        // 点击移除
        messageDiv.addEventListener('click', () => {
            messageDiv.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        });
    }
}

// 初始化系统
let teacherSystem;

window.addEventListener('DOMContentLoaded', () => {
    teacherSystem = new TeacherSystem();
    console.log('教师系统已初始化');
});

// 全局函数绑定
window.switchNotificationTab = (tab) => teacherSystem.switchNotificationTab(tab);
window.clearNotification = (id) => teacherSystem.clearNotification(id);
window.clearAllNotifications = () => teacherSystem.clearAllNotifications();
window.searchApprovals = () => teacherSystem.searchApprovals();
window.reviewProject = (id) => teacherSystem.reviewProject(id);
window.confirmApproval = () => teacherSystem.confirmApproval();
window.editProject = (id) => teacherSystem.editProject(id);
window.deleteProject = (id) => teacherSystem.deleteProject(id);
window.withdrawProject = (id) => teacherSystem.withdrawProject(id);
window.saveDraft = (id) => teacherSystem.saveDraft(id);
window.publishProject = (id) => teacherSystem.publishProject(id);
window.viewProject = (id) => teacherSystem.viewProject(id);
window.updateProfile = () => teacherSystem.updateProfile();

// 添加数据看板相关的方法
async loadLibraryData() {
    await this.loadLibraryProjects();
}

async loadDashboardData() {
    await this.loadDashboardStats();
}

async loadDashboardStats() {
    try {
        console.log('📊 开始加载看板统计数据...');
        
        const token = localStorage.getItem('teacherToken') || sessionStorage.getItem('teacherToken');
        if (!token) {
            console.error('❌ 没有认证token');
            this.renderDashboardStats({}, {});
            return;
        }
        
        // 获取各种统计数据
        const [publishResponse, scoreResponse, classResponse] = await Promise.all([
            this.apiRequest('/api/teacher/dashboard/publish-stats', 'GET', null, token),
            this.apiRequest('/api/teacher/dashboard/score-distribution', 'GET', null, token),
            this.apiRequest('/api/teacher/dashboard/class-stats', 'GET', null, token)
        ]);
        
        console.log('📈 看板数据:', {
            publish: publishResponse,
            score: scoreResponse,
            class: classResponse
        });
        
        this.renderDashboardStats(
            publishResponse.data || [],
            scoreResponse.data || [],
            classResponse.data || []
        );
        
    } catch (error) {
        console.error('❌ 加载看板数据失败:', error);
        this.renderDashboardStats([], [], []);
    }
}

renderDashboardStats(publishStats, scoreDistribution, classStats) {
    // 渲染统计数字
    this.renderStatCards(scoreDistribution);
    
    // 渲染发布量统计图
    this.renderPublishChart(publishStats);
    
    // 渲染分数分布图
    this.renderScoreChart(scoreDistribution);
    
    // 渲染班级选择
    this.renderClassSelect(classStats);
}

renderStatCards(scoreData) {
    const total = scoreData.reduce((sum, item) => sum + (item.count || 0), 0);
    const excellent = scoreData.find(s => s.range === '90-100')?.count || 0;
    const good = scoreData.find(s => s.range === '80-89')?.count || 0;
    const passed = scoreData.find(s => s.range === '70-79')?.count || 0;
    const failed = scoreData.find(s => s.range === '0-59')?.count || 0;
    
    // 更新统计数字
    const statElements = [
        { selector: '.grid-4 .card:nth-child(1) div:first-child', value: total },
        { selector: '.grid-4 .card:nth-child(2) div:first-child', value: excellent + good },
        { selector: '.grid-4 .card:nth-child(3) div:first-child', value: passed },
        { selector: '.grid-4 .card:nth-child(4) div:first-child', value: failed }
    ];
    
    statElements.forEach(({ selector, value }) => {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = value;
        }
    });
}

renderPublishChart(publishStats) {
    const container = document.querySelector('.grid-2 .card:first-child');
    if (!container) return;
    
    // 清除现有内容
    const chartArea = container.querySelector('div[style*="height: 300px"]');
    if (chartArea) {
        chartArea.remove();
    }
    
    // 创建图表容器
    const chartContainer = document.createElement('div');
    chartContainer.style.cssText = 'height: 300px; padding: 20px;';
    
    if (!publishStats || publishStats.length === 0) {
        chartContainer.innerHTML = `
            <div style="height: 100%; display: flex; align-items: center; justify-content: center; color: #999; text-align: center;">
                <div>
                    <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                    <div>暂无发布量数据</div>
                </div>
            </div>
        `;
    } else {
        // 创建简单的柱状图
        const maxValue = Math.max(...publishStats.map(item => item.total || 0));
        const chartHTML = `
            <div style="height: 100%; display: flex; flex-direction: column;">
                <h4 style="margin-bottom: 20px; color: #333;">发布量统计</h4>
                <div style="flex: 1; display: flex; align-items: flex-end; gap: 10px; padding: 10px; border-left: 2px solid #f0f0f0; border-bottom: 2px solid #f0f0f0;">
                    ${publishStats.map((item, index) => {
                        const height = maxValue > 0 ? ((item.total || 0) / maxValue) * 200 : 0;
                        const date = item.date ? new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) : `Day ${index + 1}`;
                        return `
                            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; min-width: 40px;">
                                <div style="height: ${height}px; width: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 4px 4px 0 0; position: relative;">
                                    <span style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 12px; color: #666; white-space: nowrap;">${item.total || 0}</span>
                                </div>
                                <span style="margin-top: 8px; font-size: 12px; color: #666;">${date}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        chartContainer.innerHTML = chartHTML;
    }
    
    container.appendChild(chartContainer);
}

renderScoreChart(scoreData) {
    const container = document.querySelector('.grid-2 .card:nth-child(2)');
    if (!container) return;
    
    // 清除现有内容
    const chartArea = container.querySelector('div[style*="height: 300px"]');
    if (chartArea) {
        chartArea.remove();
    }
    
    // 创建图表容器
    const chartContainer = document.createElement('div');
    chartContainer.style.cssText = 'height: 300px; padding: 20px;';
    
    if (!scoreData || scoreData.length === 0) {
        chartContainer.innerHTML = `
            <div style="height: 100%; display: flex; align-items: center; justify-content: center; color: #999; text-align: center;">
                <div>
                    <div style="font-size: 48px; margin-bottom: 16px;">📈</div>
                    <div>暂无分数分布数据</div>
                </div>
            </div>
        `;
    } else {
        // 创建饼图
        const total = scoreData.reduce((sum, item) => sum + (item.count || 0), 0);
        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'];
        
        const chartHTML = `
            <div style="height: 100%; display: flex; flex-direction: column;">
                <h4 style="margin-bottom: 20px; color: #333;">分数分布</h4>
                <div style="flex: 1; display: flex; align-items: center; justify-content: space-around;">
                    <div style="width: 120px; height: 120px; border-radius: 50%; background: conic-gradient(${scoreData.map((item, index) => {
                        const percentage = total > 0 ? (item.count || 0) / total : 0;
                        const startAngle = scoreData.slice(0, index).reduce((sum, prev) => sum + (total > 0 ? (prev.count || 0) / total : 0), 0) * 360;
                        return `${colors[index]} 0deg ${startAngle + percentage * 360}deg`;
                    }).join(', ')}); position: relative;">
                        <div style="position: absolute; inset: 20%; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #333;">
                            ${total}
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${scoreData.map((item, index) => `
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="width: 12px; height: 12px; background: ${colors[index]}; border-radius: 2px;"></div>
                                <span style="font-size: 14px; color: #666;">${item.range}: ${item.count || 0} (${total > 0 ? Math.round(((item.count || 0) / total) * 100) : 0}%)</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        chartContainer.innerHTML = chartHTML;
    }
    
    container.appendChild(chartContainer);
}

renderClassSelect(classStats) {
    const select = document.getElementById('dashboardClass');
    if (!select) return;
    
    if (!classStats || classStats.length === 0) {
        select.innerHTML = '<option value="">选择班级</option>';
        return;
    }
    
    select.innerHTML = '<option value="">全部班级</option>' + 
        classStats.map(cls => `
            <option value="${cls.class_name}">${cls.class_name} (${cls.total_students}人)</option>
        `).join('');
}

getProjectTypeText(type) {
    const types = {
        'project': '项目',
        '论文': '论文', 
        '设计': '设计',
        '作品': '作品'
    };
    return types[type] || type || '项目';
}
window.closeModal = () => teacherSystem.closeModal();
window.switchEditMode = (mode) => teacherSystem.switchEditMode(mode);
window.generateAIlayout = () => teacherSystem.generateAIlayout();
window.generateAIpolish = () => teacherSystem.generateAIpolish();
window.uploadFile = () => teacherSystem.uploadFile();
window.changeClassFilter = (classId) => teacherSystem.changeClassFilter(classId);