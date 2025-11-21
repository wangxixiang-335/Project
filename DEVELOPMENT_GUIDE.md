# 🚀 开发环境配置指南

## 📋 确认：您的理解完全正确！

### 🎯 双终端开发模式

您现在需要运行**两个独立的终端**来启动完整的开发环境：

```
终端 1：D:\Work\Project (后端开发环境)
终端 2：D:\Work\Project\temp-frontend (前端开发环境)
```

## 🔧 启动步骤

### 🖥️ 终端 1：后端服务器
```bash
# 切换到项目根目录
cd D:\Work\Project

# 启动后端开发服务器
npm run dev
```
- **端口**：3000
- **功能**：API服务器 + 静态文件服务
- **热重载**：通过 nodemon 自动重启

### 🌐 终端 2：前端开发服务器  
```bash
# 切换到前端目录
cd D:\Work\Project\temp-frontend

# 启动前端开发服务器
npm run dev
```
- **端口**：5173
- **功能**：Vite 开发服务器 + React 热重载
- **代理**：自动代理 `/api` 请求到后端

## 📱 访问地址

### 🎨 前端开发环境（推荐）
```
主要访问：http://localhost:5173/
- Vite 开发服务器
- 热重载支持
- 更快的开发体验
```

### 🔧 后端开发环境（备用）
```
备用访问：http://localhost:3000/
- Express 静态文件服务
- 生产环境模拟
```

## 🎯 开发工作流

### 💻 日常开发
1. **打开两个终端**
2. **终端1启动后端**：`cd D:\Work\Project && npm run dev`
3. **终端2启动前端**：`cd D:\Work\Project\temp-frontend && npm run dev`
4. **访问**：http://localhost:5173/
5. **开始开发**：享受热重载！

### 🔄 文件修改
- **前端文件**：在 `temp-frontend/` 中修改，Vite 自动重载
- **后端文件**：在 `src/` 中修改，nodemon 自动重启
- **API接口**：前端通过代理自动连接后端

## 📁 项目结构

### 🗂️ 开发文件分布
```
D:\Work\Project\
├── 📂 src/                    # 后端代码 (终端1)
│   ├── app.js                  # 主服务器
│   ├── config/                 # 配置
│   ├── middleware/             # 中间件  
│   ├── routes/                 # API路由
│   └── utils/                  # 工具函数
│
├── 📂 temp-frontend/          # 前端代码 (终端2)
│   ├── 📝 login.html           # 登录页面
│   ├── 📱 login.js             # 登录逻辑
│   ├── 🎨 teacher.html         # 教师系统界面
│   ├── 📜 teacher.js           # 教师系统功能
│   ├── 🧪 test_teacher_simple.html # 测试页面
│   ├── 🔧 debug_teacher_system.html # 调试页面
│   ├── 📦 package.json         # 前端依赖
│   └── ⚙️ vite.config.js       # Vite配置
│
├── 📋 package.json             # 后端依赖
└── 📝 DEVELOPMENT_GUIDE.md     # 本指南
```

## 🚀 技术栈说明

### 🔧 后端技术栈 (终端1)
- **Node.js** + **Express.js** 
- **nodemon** (开发热重载)
- **Supabase** (数据库)
- **JWT** (认证)

### 🌐 前端技术栈 (终端2)  
- **Vite** (开发服务器)
- **React** (框架)
- **ES6+ JavaScript** (主要语言)
- **热重载** (开发体验)

### 🔄 代理配置
Vite 自动代理 `/api/*` 请求到 `http://localhost:3000`，实现前后端无缝对接。

## 💡 开发提示

### 🎯 最佳实践
1. **优先使用**：http://localhost:5173/ (Vite开发服务器)
2. **前端修改**：保存后立即生效，无需刷新
3. **后端修改**：保存后nodemon自动重启
4. **API调用**：前端自动代理到后端

### 🐛 常见问题解决

**端口冲突**
```bash
# 如果3000端口被占用
netstat -ano | findstr :3000
taskkill /PID <进程ID> /F
```

**依赖安装**
```bash
# 后端依赖
cd D:\Work\Project
npm install

# 前端依赖  
cd D:\Work\Project\temp-frontend
npm install
```

**缓存清理**
```bash
# 清除Vite缓存
cd D:\Work\Project\temp-frontend
npm run dev -- --force

# 清除node_modules
rm -rf node_modules package-lock.json
npm install
```

### 🎊 开发优势

⚡ **热重载**：前端修改立即生效  
🔄 **自动重启**：后端修改nodemon自动处理  
🔗 **无缝对接**：API代理自动转发请求  
📱 **分离开发**：前后端完全独立开发  

## 🎉 开始开发

现在您可以：

1. **打开两个终端**
2. **分别启动后端和前端**
3. **访问 http://localhost:5173/**  
4. **享受现代化的开发体验！**

**您的理解完全正确，这就是现代化的前后端分离开发模式！** 🚀✨