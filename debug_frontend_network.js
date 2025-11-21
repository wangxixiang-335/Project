// 前端网络请求调试脚本
// 在浏览器控制台中运行此脚本来调试网络请求

(function() {
    'use strict';
    
    console.log('🔍 开始调试前端网络请求...');
    
    // 保存原始的fetch函数
    const originalFetch = window.fetch;
    
    // 重写fetch函数来捕获所有网络请求
    window.fetch = function(...args) {
        console.log('📡 Fetch请求捕获:', args[0], {
            url: args[0],
            options: args[1]
        });
        
        return originalFetch.apply(this, args)
            .then(response => {
                console.log('📊 Fetch响应状态:', response.status, response.statusText);
                console.log('📋 响应URL:', response.url);
                
                // 克隆响应以便读取内容
                const clonedResponse = response.clone();
                clonedResponse.text().then(text => {
                    console.log('📄 响应内容:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
                }).catch(err => {
                    console.log('❌ 读取响应内容失败:', err);
                });
                
                return response;
            })
            .catch(error => {
                console.error('❌ Fetch请求失败:', error);
                throw error;
            });
    };
    
    // 保存原始的XMLHttpRequest
    const originalXHR = window.XMLHttpRequest;
    
    // 重写XMLHttpRequest来捕获所有AJAX请求
    window.XMLHttpRequest = function() {
        const xhr = new originalXHR();
        const originalOpen = xhr.open;
        const originalSend = xhr.send;
        
        xhr.open = function(method, url, async, user, password) {
            console.log('📡 XHR请求捕获:', method, url);
            this._method = method;
            this._url = url;
            return originalOpen.apply(this, arguments);
        };
        
        xhr.send = function(data) {
            console.log('📤 XHR请求数据:', data);
            
            xhr.addEventListener('loadstart', function() {
                console.log('🚀 XHR请求开始:', this._method, this._url);
            });
            
            xhr.addEventListener('load', function() {
                console.log('📊 XHR响应状态:', this.status, this.statusText);
                console.log('📋 响应内容:', this.responseText?.substring(0, 500) + (this.responseText?.length > 500 ? '...' : ''));
            });
            
            xhr.addEventListener('error', function() {
                console.error('❌ XHR请求失败:', this._method, this._url);
            });
            
            return originalSend.apply(this, arguments);
        };
        
        return xhr;
    };
    
    console.log('✅ 网络调试工具已安装');
    console.log('💡 现在刷新页面或执行操作来查看网络请求详情');
    
    // 添加一个全局错误处理器
    window.addEventListener('error', function(event) {
        console.error('🌐 全局错误捕获:', event.error);
        console.error('📍 错误位置:', event.filename, '行号:', event.lineno, '列号:', event.colno);
    });
    
    // 添加未处理的Promise拒绝处理器
    window.addEventListener('unhandledrejection', function(event) {
        console.error('🌐 未处理的Promise拒绝:', event.reason);
    });
    
})();