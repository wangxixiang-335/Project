// 登录功能JavaScript
class LoginSystem {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkExistingLogin();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    }

    checkExistingLogin() {
        const token = localStorage.getItem('teacherToken');
        if (token) {
            // 验证token是否仍然有效
            this.validateExistingToken(token);
        }
    }

    async validateExistingToken(token) {
        try {
            const response = await this.apiRequest('/api/auth/me', 'GET', null, token);
            if (response.success) {
                // Token有效，直接跳转
                window.location.href = 'teacher.html';
            } else {
                // Token无效，清除并继续登录流程
                localStorage.removeItem('teacherToken');
            }
        } catch (error) {
            // 验证失败，清除token
            localStorage.removeItem('teacherToken');
        }
    }

    async handleLogin() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember').checked;

        // 基本验证
        if (!email || !password) {
            this.showMessage('请填写邮箱和密码', 'error');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showMessage('请输入有效的邮箱地址', 'error');
            return;
        }

        this.setLoading(true);

        try {
            const response = await this.apiRequest('/api/auth/login', 'POST', {
                email,
                password
            });

            if (response.success) {
                // 登录成功
                const token = response.data.token || response.data.data.token;
                
                // 保存token
                if (remember) {
                    localStorage.setItem('teacherToken', token);
                } else {
                    sessionStorage.setItem('teacherToken', token);
                }

                this.showMessage('登录成功，正在跳转...', 'success');
                
                // 延迟跳转，让用户看到成功消息
                setTimeout(() => {
                    window.location.href = 'teacher.html';
                }, 1500);

            } else {
                // 登录失败
                this.showMessage(response.error || '登录失败，请检查邮箱和密码', 'error');
            }

        } catch (error) {
            console.error('登录错误:', error);
            this.showMessage('登录失败，请稍后重试', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    setLoading(loading) {
        const loginBtn = document.getElementById('loginBtn');
        const loginBtnText = document.getElementById('loginBtnText');
        
        if (loading) {
            loginBtn.disabled = true;
            loginBtnText.innerHTML = '<span class="loading"></span> 登录中...';
        } else {
            loginBtn.disabled = false;
            loginBtnText.textContent = '登录';
        }
    }

    showMessage(message, type = 'error') {
        const container = document.getElementById('messageContainer');
        const messageClass = type === 'success' ? 'success-message' : 'error-message';
        
        container.innerHTML = `<div class="${messageClass}">${message}</div>`;
        
        // 3秒后自动清除消息
        if (type === 'success') {
            setTimeout(() => {
                container.innerHTML = '';
            }, 3000);
        }
    }

    async apiRequest(endpoint, method = 'GET', data = null, token = null) {
        const url = `http://localhost:3000${endpoint}`;
        const headers = {
            'Content-Type': 'application/json'
        };

        // 尝试获取token
        const authToken = token || localStorage.getItem('teacherToken') || sessionStorage.getItem('teacherToken');
        if (authToken) {
            headers.Authorization = `Bearer ${authToken}`;
        }

        const config = {
            method,
            headers
        };

        if (data && method !== 'GET') {
            config.body = JSON.stringify(data);
        }

        const response = await fetch(url, config);
        return await response.json();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new LoginSystem();
});