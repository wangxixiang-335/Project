# 端口冲突解决指南

## ❌ 问题描述
```
Error: listen EADDRINUSE: address already in use :::8090
```

## ✅ 解决方案

### 方法1: 使用修复后的启动脚本
```bash
双击 d:/Work/Project/start-project.bat
```
新脚本会自动检查并终止端口占用进程。

### 方法2: 手动解决端口冲突

**步骤1：查找占用进程**
```bash
netstat -ano | findstr :8090
```

**步骤2：终止占用进程**（替换PID为实际进程ID）
```bash
taskkill /PID 进程号 /F
```

**步骤3：重新启动后端**
```bash
node start_server.js
```

### 方法3: 使用默认端口3000

如果端口8090持续有问题，可以直接使用主文件：

```bash
cd d:/Work/Project
node src/app.js
```

## 🔧 常见端口占用

| 端口 | 用途 | 默认进程 |
|------|------|----------|
| 3000 | 后端API | node src/app.js |
| 8090 | 后端备用 | node start_server.js |
| 5176 | 前端开发 | npm run dev |

## 📋 检查清单

- [ ] 终止了端口8090的占用进程
- [ ] 后端服务器启动成功
- [ ] 前端服务器启动成功
- [ ] 可以访问 http://localhost:5176

## 🚀 现在试试看

1. **重新运行**：`node start_server.js`
2. **或使用**：双击 `start-project.bat`
3. **验证启动**：应该看到服务器启动成功消息

如果问题仍然存在，请告诉我具体的错误信息。