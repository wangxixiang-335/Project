# 学生项目展示与教师审核系统 - 后端API

基于 Node.js + Express + Supabase 构建的学生项目展示与教师审核系统后端服务。

## 功能特性

### 🔐 用户认证
- 基于 Supabase Auth 的用户注册/登录
- JWT Token 认证机制
- 角色权限控制（学生/教师）

### 📁 文件管理
- 图片上传（支持 JPG/PNG/WEBP，≤5MB）
- 视频上传（支持 MP4/MOV，≤200MB，≤5分钟）
- Supabase Storage 存储管理
- 文件权限控制

### 📋 项目管理
- 学生项目提交（图文+视频）
- 项目修改与重新提交
- 项目状态管理（待审核/已通过/已打回）

### 👨‍🏫 审核系统
- 教师待审核项目列表
- 项目详情查看
- 审核操作（通过/不通过）
- 审核历史记录

### 📊 数据统计
- 主页项目展示（无需登录）
- 浏览量统计（防重复计数）
- 学生个人统计
- 教师平台统计

## 技术栈

- **后端框架**: Node.js + Express
- **数据库**: Supabase PostgreSQL
- **文件存储**: Supabase Storage
- **认证**: Supabase Auth
- **验证**: Joi
- **安全**: Helmet + CORS + Rate Limiting

## 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone <repository-url>
cd student-project-review-backend

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env
```

### 2. Supabase 配置

1. 创建 [Supabase](https://supabase.com) 项目
2. 在 Supabase Dashboard 中执行 SQL 脚本：
   - `supabase/schema.sql` - 创建表结构
   - `supabase/rls_policies.sql` - 配置权限策略
3. 创建存储桶：
   - `project-images` - 存储项目图片
   - `project-videos` - 存储项目视频

### 3. 环境变量配置

编辑 `.env` 文件：

```env
# Supabase配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 服务器配置
PORT=3000
NODE_ENV=development

# 文件上传配置
MAX_FILE_SIZE=20971520
MAX_IMAGE_SIZE=5242880
MAX_VIDEO_SIZE=209715200

# JWT配置
JWT_SECRET=your-jwt-secret-key

# 速率限制
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务将在 `http://localhost:3000` 启动

## API 文档

### 认证接口

#### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "username": "用户名",
  "role": "student"
}
```

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 文件上传接口

#### 图片上传
```http
POST /api/upload/image
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
  image: <图片文件>
```

#### 视频上传
```http
POST /api/upload/video
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
  video: <视频文件>
```

### 项目管理接口

#### 提交项目
```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "项目标题",
  "content_html": "<p>项目内容HTML</p>",
  "video_url": "https://视频URL"
}
```

#### 获取项目列表
```http
GET /api/projects?page=1&pageSize=10
Authorization: Bearer <token>
```

### 审核接口

#### 获取待审核列表
```http
GET /api/review/pending?page=1&pageSize=10
Authorization: Bearer <teacher-token>
```

#### 审核项目
```http
POST /api/review/{project_id}/audit
Authorization: Bearer <teacher-token>
Content-Type: application/json

{
  "audit_result": 1, // 1=通过, 2=不通过
  "reject_reason": "打回原因" // 不通过时必填
}
```

### 统计接口

#### 主页项目列表
```http
GET /api/stats/projects/public?page=1&pageSize=10
```

#### 浏览量统计
```http
POST /api/stats/projects/{project_id}/view
```

## 数据库设计

### 主要表结构

- **profiles**: 用户扩展信息表
- **projects**: 项目信息表
- **audit_records**: 审核记录表
- **view_records**: 浏览量记录表

### RLS 权限策略

系统使用 Supabase RLS 实现细粒度权限控制：
- 学生只能访问自己的项目
- 教师可以查看所有项目
- 公开接口无需认证

## 部署指南

### Vercel 部署

1. 安装 Vercel CLI: `npm i -g vercel`
2. 配置环境变量
3. 执行: `vercel --prod`

### 传统服务器部署

1. 安装 Node.js 环境
2. 配置 PM2 进程管理
3. 配置 Nginx 反向代理
4. 配置 SSL 证书

## 开发指南

### 项目结构

```
src/
├── config/          # 配置文件
├── middleware/      # 中间件
├── routes/          # 路由文件
├── utils/           # 工具函数
└── app.js          # 应用入口
```

### 代码规范

- 使用 ES6+ 语法
- 错误处理统一使用 try-catch
- 响应格式统一标准化
- 日志记录重要操作

## 故障排除

### 常见问题

1. **Supabase 连接失败**
   - 检查环境变量配置
   - 验证网络连接

2. **文件上传失败**
   - 检查文件大小限制
   - 验证存储桶权限

3. **认证失败**
   - 检查 Token 有效性
   - 验证用户权限

### 日志查看

- 应用控制台日志
- Supabase Dashboard 日志
- 错误监控系统

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 联系方式

如有问题请联系开发团队。

---

**注意**: 生产环境部署前请确保：
- 配置正确的环境变量
- 启用 HTTPS
- 设置监控告警
- 定期备份数据