# API路径修复指南

## 🔧 修复内容

### 问题原因
前端在调用登录API时使用了错误的路径：
- ❌ 错误路径：`/api/users/login`
- ✅ 正确路径：`/api/auth/login`

### 修复位置
- **文件**: `d:/Work/Project/temp-frontend/src/App.jsx`
- **行号**: 第95行
- **修改**: 将 `users/login` 改为 `auth/login`

## 📋 验证步骤

### 1. 服务器启动
```bash
# 后端服务器
cd d:/Work/Project
npm start
# 服务器运行在 http://localhost:3000

# 前端开发服务器
cd d:/Work/Project/temp-frontend  
npm run dev
# 前端运行在 http://localhost:5177 (端口可能变化)
```

### 2. API端点测试
```bash
# 健康检查
curl http://localhost:5177/health

# 登录测试 (POST)
curl -X POST http://localhost:5177/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"123456"}'
```

### 3. 测试账号
- **学生账号**: `student@test.com` / `123456`
- **教师账号**: `teacher@test.com` / `123456`

## 🛡️ 代理配置

前端使用Vite代理，配置在 `vite.config.js`:
```javascript
server: {
  port: 5177,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true
    }
  }
}
```

## ✅ 修复验证

| 功能 | 状态 | 说明 |
|------|------|------|
| 健康检查 | ✅ | `GET /health` |
| 用户注册 | ✅ | `POST /api/auth/register` |
| 用户登录 | ✅ | `POST /api/auth/login` |
| 获取用户信息 | ✅ | `GET /api/auth/me` |
| 用户登出 | ✅ | `POST /api/auth/logout` |
| 刷新Token | ✅ | `POST /api/auth/refresh` |

## 🎯 使用方法

1. **确保两个服务都在运行**
2. **访问前端页面**: `http://localhost:5177`
3. **使用测试账号登录**
4. **系统将自动跳转到对应角色页面**

## 🚨 注意事项

- 前端端口可能变化（如5177），查看启动日志确认
- 如果代理不生效，重启前端开发服务器
- 确保后端服务器运行在3000端口

---
*修复时间: 2025-11-21*