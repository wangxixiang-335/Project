# 部署指南

## 本地开发环境部署

### 1. 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0
- Supabase 项目（用于数据库和存储）

### 2. 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd student-project-review-backend

# 安装依赖
npm install
```

### 3. 配置环境变量

复制环境变量模板文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下参数：
```env
# Supabase配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 服务器配置
PORT=3000
NODE_ENV=development

# 其他配置...
```

### 4. 配置 Supabase

#### 4.1 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 获取项目 URL 和 API Keys

#### 4.2 执行数据库脚本

在 Supabase Dashboard 的 SQL Editor 中执行以下脚本：

1. 执行表结构脚本：`supabase/schema.sql`
2. 执行权限策略脚本：`supabase/rls_policies.sql`

#### 4.3 创建存储桶

在 Supabase Storage 中创建以下存储桶：

- **project-images**: 用于存储项目图片
- **project-videos**: 用于存储项目视频

为每个存储桶配置以下权限：
- **public**: 只读访问权限
- **authenticated**: 读写访问权限

### 5. 启动服务

```bash
# 开发模式（带热重载）
npm run dev

# 生产模式
npm start
```

服务将在 `http://localhost:3000` 启动

---

## 生产环境部署

### 1. Vercel 部署（推荐）

#### 1.1 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 1.2 配置环境变量

在 Vercel Dashboard 中配置以下环境变量：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=production
PORT=3000
```

#### 1.3 部署项目

```bash
# 部署到生产环境
vercel --prod
```

### 2. Docker 部署

#### 2.1 创建 Dockerfile

```dockerfile
FROM node:16-alpine

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
```

#### 2.2 构建和运行

```bash
# 构建镜像
docker build -t student-project-backend .

# 运行容器
docker run -d \
  --name student-project-backend \
  -p 3000:3000 \
  -e SUPABASE_URL=your-supabase-url \
  -e SUPABASE_ANON_KEY=your-anon-key \
  -e SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
  student-project-backend
```

### 3. 传统服务器部署

#### 3.1 服务器准备

```bash
# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
npm install -g pm2
```

#### 3.2 部署应用

```bash
# 克隆代码
git clone <repository-url>
cd student-project-review-backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 使用 PM2 启动
pm2 start src/app.js --name "student-project-backend"

# 设置开机自启
pm2 startup
pm2 save
```

#### 3.3 Nginx 配置

创建 Nginx 配置文件 `/etc/nginx/sites-available/student-project-backend`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/student-project-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 3.4 SSL 配置（可选）

使用 Let's Encrypt 配置 HTTPS：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com
```

---

## 性能优化配置

### 1. 数据库优化

```sql
-- 为常用查询字段创建索引
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_view_records_project_ip ON view_records(project_id, ip_address);
```

### 2. 缓存配置

建议使用 Redis 缓存频繁查询的数据：

```javascript
// 示例：使用 Redis 缓存公开项目列表
const redis = require('redis');
const client = redis.createClient();

// 缓存公开项目列表，有效期5分钟
app.get('/api/stats/projects/public', async (req, res) => {
    const cacheKey = 'public_projects:' + req.query.page;
    const cached = await client.get(cacheKey);
    
    if (cached) {
        return res.json(JSON.parse(cached));
    }
    
    // 查询数据库并缓存
    const result = await getPublicProjects(req.query);
    await client.setex(cacheKey, 300, JSON.stringify(result));
    
    return res.json(result);
});
```

### 3. CDN 配置

为静态文件（图片、视频）配置 CDN：

- 在 Supabase Storage 中启用 CDN
- 配置自定义域名
- 设置缓存策略

---

## 监控和日志

### 1. 日志配置

```javascript
// 使用 winston 进行日志管理
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// 生产环境下也输出到控制台
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}
```

### 2. 健康检查

应用已内置健康检查端点：

```bash
# 检查服务状态
curl http://localhost:3000/health
```

### 3. 性能监控

建议集成以下监控工具：
- **New Relic**: 应用性能监控
- **Sentry**: 错误追踪
- **Prometheus + Grafana**: 指标监控

---

## 安全配置

### 1. 环境安全

- 定期更新依赖包
- 使用安全扫描工具
- 配置防火墙规则

### 2. API 安全

- 启用 HTTPS
- 配置 CORS 白名单
- 实施速率限制
- 验证输入参数

### 3. 数据安全

- 定期备份数据库
- 加密敏感数据
- 实施访问控制策略

---

## 故障排除

### 常见问题

1. **Supabase 连接失败**
   ```bash
   # 检查网络连接
   ping your-project.supabase.co
   
   # 验证 API Keys
   curl -H "Authorization: Bearer YOUR_ANON_KEY" \
        https://your-project.supabase.co/rest/v1/
   ```

2. **文件上传失败**
   - 检查存储桶权限
   - 验证文件大小限制
   - 检查网络连接

3. **认证失败**
   - 验证 JWT Token
   - 检查用户权限
   - 确认 Supabase Auth 配置

### 日志分析

查看应用日志：
```bash
# PM2 日志
pm2 logs student-project-backend

# 系统日志
journalctl -u nginx
```

---

## 更新和维护

### 1. 代码更新

```bash
# 拉取最新代码
git pull origin main

# 安装新依赖
npm install

# 重启应用
pm2 restart student-project-backend
```

### 2. 数据库迁移

如需修改数据库结构：

1. 创建迁移脚本
2. 在 Supabase SQL Editor 中执行
3. 测试数据完整性

### 3. 备份策略

- **数据库备份**: 使用 Supabase 自动备份
- **文件备份**: 定期备份存储桶数据
- **配置备份**: 备份环境变量和配置文件

---

## 支持信息

如有问题，请联系：
- **文档**: 查看 API 文档和 README
- **Issues**: 在 GitHub 提交问题
- **邮件**: 联系开发团队