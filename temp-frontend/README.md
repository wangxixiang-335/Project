# 学生项目展示系统 - 临时前端

这是一个用于测试后端API功能的临时前端界面。当同事的前端开发完成后，可以安全删除此文件夹。

## 🚀 快速开始

### 1. 启动后端服务
确保后端服务正在运行：
```bash
cd d:/Work/Project
npm run dev
```

### 2. 启动临时前端
```bash
cd d:/Work/Project/temp-frontend
npm install
npm run dev
```

### 3. 访问应用
打开浏览器访问：http://localhost:5173

## 📋 功能特性

- ✅ 用户注册/登录
- ✅ 项目管理（创建、查看）
- ✅ 文件上传（图片、视频）
- ✅ 响应式界面
- ✅ 错误处理和提示

## 🔧 API接口测试

临时前端完整覆盖了以下后端API：

### 认证模块
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取用户信息

### 项目管理
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目

### 文件上传
- `POST /api/upload/image` - 上传图片
- `POST /api/upload/video` - 上传视频

## 🗑️ 删除说明

当同事的前端开发完成后，可以安全删除整个 `temp-frontend` 文件夹：

```bash
rm -rf temp-frontend
```

## 📱 使用流程

1. **注册用户**
   - 邮箱：任意有效邮箱
   - 密码：至少6位
   - 角色：学生或教师

2. **登录系统**
   - 使用注册的邮箱和密码登录

3. **上传文件**
   - 选择图片或视频进行上传
   - 获取上传后的文件URL

4. **提交项目**
   - 填写项目标题和内容
   - 填入之前上传的文件URL
   - 提交项目等待审核

## 🔍 技术栈

- React 18
- Vite (构建工具)
- Axios (HTTP客户端)
- CSS (内联样式)

## 📞 调试帮助

如果遇到问题，可以：

1. 检查后端服务是否正常运行（端口3000）
2. 查看浏览器控制台错误信息
3. 验证数据库连接是否正常
4. 检查Supabase存储桶配置

---

**注意**：此临时前端仅用于功能测试，不具备生产环境的安全性和性能优化。