# Supabase 配置指南

## 1. 创建Supabase项目

1. 访问 [Supabase官网](https://supabase.com) 并创建账户
2. 创建新项目，选择合适的地理位置
3. 记录项目URL和API密钥（后续需要配置到环境变量）

## 2. 配置数据库

### 2.1 执行表结构脚本
1. 登录Supabase Dashboard
2. 进入 SQL Editor
3. 复制 `supabase/schema.sql` 文件内容并执行
4. 复制 `supabase/rls_policies.sql` 文件内容并执行

### 2.2 验证表创建
检查以下表是否创建成功：
- `profiles`
- `projects` 
- `audit_records`
- `view_records`

## 3. 配置存储桶

### 3.1 创建存储桶
在Supabase Dashboard中：
1. 进入 Storage → 创建新存储桶
2. 创建 `project-images` 存储桶
3. 创建 `project-videos` 存储桶

### 3.2 配置存储桶权限
为每个存储桶配置以下权限：

#### project-images 存储桶策略：
```sql
-- 允许认证用户上传文件
CREATE POLICY "认证用户上传图片" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'project-images' AND
    auth.role() = 'authenticated'
);

-- 允许用户读取自己的文件
CREATE POLICY "用户读取自己的图片" ON storage.objects
FOR SELECT USING (
    bucket_id = 'project-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 允许教师读取所有文件
CREATE POLICY "教师读取所有图片" ON storage.objects
FOR SELECT USING (
    bucket_id = 'project-images' AND
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'teacher'
    )
);
```

#### project-videos 存储桶策略类似配置

## 4. 配置环境变量

### 4.1 创建 `.env` 文件
复制 `.env.example` 为 `.env` 并填写实际值：

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

### 4.2 获取Supabase配置信息
1. 在Supabase Dashboard中进入 Settings → API
2. 复制以下信息：
   - Project URL → `SUPABASE_URL`
   - anon public → `SUPABASE_ANON_KEY`
   - service_role secret → `SUPABASE_SERVICE_ROLE_KEY`

## 5. 验证配置

### 5.1 启动应用
```bash
npm install
npm run dev
```

### 5.2 测试健康检查
访问 `http://localhost:3000/health` 应该返回成功响应

## 6. 测试关键功能

### 6.1 用户注册
使用Postman测试注册接口：
```
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "123456",
  "username": "testuser",
  "role": "student"
}
```

### 6.2 文件上传
测试图片上传功能

## 7. 注意事项

### 7.1 安全配置
- 确保 `SUPABASE_SERVICE_ROLE_KEY` 仅在服务器端使用
- 生产环境使用强密码和HTTPS
- 定期轮换API密钥

### 7.2 性能优化
- 为高频查询字段创建索引
- 监控存储桶使用情况
- 设置合理的文件大小限制

### 7.3 备份策略
- 定期备份数据库
- 配置自动备份（Supabase Pro版本）
- 测试恢复流程

## 8. 故障排除

### 常见问题：
1. **RLS策略不生效**：检查策略语法和用户权限
2. **文件上传失败**：验证存储桶权限和文件大小限制
3. **认证失败**：检查JWT令牌和Supabase配置

### 日志查看：
- Supabase Dashboard → Logs
- 应用控制台输出
- 错误日志文件

## 9. 生产部署

### 9.1 环境准备
- 使用生产环境Supabase项目
- 配置生产环境变量
- 启用HTTPS

### 9.2 监控配置
- 设置错误监控
- 配置性能监控
- 设置告警规则

### 9.3 安全加固
- 限制API访问频率
- 配置防火墙规则
- 启用安全扫描