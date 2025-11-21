# 项目启动指南

## 🚀 快速启动

### 第1步：启动后端服务器
```bash
cd d:/Work/Project
node start_server.js
```
应该看到：
```
🚀 启动后端服务器...
✅ 服务器进程已启动
服务器运行在端口 8090
环境: development
```

### 第2步：启动前端服务器（新开命令行窗口）
```bash
cd d:/Work/Project/temp-frontend
npm run dev
```
应该看到：
```
➜  Local:   http://localhost:5176/
```

### 第3步：访问应用
**推荐顺序**：
1. 先测试简化登录：`file:///D:/Work/Project/simple-frontend.html`
2. 再使用完整前端：`http://localhost:5176`

## 📱 访问地址

| 页面 | 地址 | 用途 |
|------|------|------|
| 完整前端 | http://localhost:5176 | 主要应用 |
| 简化登录 | file:///D:/Work/Project/simple-frontend.html | 快速测试 |
| 连接测试 | file:///D:/Work/Project/test-connection.html | 诊断问题 |

## 🔑 测试账户

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 教师 | testteacher123@example.com | 123456 |
| 教师 | teacher@example.com | 123456 |
| 学生 | student1@example.com | 123456 |

## ⚡ 一键启动脚本（可选）

创建 `start-project.bat` 文件：
```batch
@echo off
echo 🚀 启动学生项目管理系统...

echo 📦 启动后端服务器...
start "后端服务器" cmd /k "cd /d d:/Work/Project && node start_server.js"

echo 🌐 启动前端服务器...
timeout /t 3 >nul
start "前端服务器" cmd /k "cd /d d:/Work/Project/temp-frontend && npm run dev"

echo 🌟 正在打开应用...
timeout /t 5 >nul
start http://localhost:5176
start file:///D:/Work/Project/simple-frontend.html

echo ✅ 启动完成！
pause
```

## 🔍 故障排除

### 后端启动失败
- 检查端口3000是否被占用：`netstat -ano | findstr :3000`
- 杀死占用进程：`taskkill /PID 进程号 /F`

### 前端启动失败
- 进入temp-frontend目录：`npm install`
- 清除缓存：`npm cache clean --force`

### 页面无法访问
- 确认两个服务器都在运行
- 检查防火墙设置
- 尝试127.0.0.1代替localhost

## 📋 启动确认清单

- [ ] 后端服务器启动成功（端口8090/3000）
- [ ] 前端开发服务器启动成功（端口5176）
- [ ] 浏览器可以访问前端页面
- [ ] 登录功能正常工作
- [ ] 教师可以查看待审核项目
- [ ] 学生可以提交项目

## 🎯 推荐流程

1. **首次使用**：先用简化登录页面测试功能
2. **日常使用**：使用完整React前端
3. **开发调试**：使用连接测试页面诊断问题

---

💡 **提示**：如果遇到问题，查看 `FRONTEND_FIX_GUIDE.md` 获取详细解决方案。