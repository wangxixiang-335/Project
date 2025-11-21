# 数据库设置说明

## 概述
这个SQL文件 (`create_education_tables.sql`) 包含了完整的教育项目管理系统数据库结构，专为Supabase设计。

## 主要功能

### 表结构
1. **profiles** - 用户资料表 (与Supabase Auth集成)
2. **projects** - 项目表 (支持学生提交、教师审核)
3. **audit_records** - 审核记录表
4. **file_uploads** - 文件上传记录表
5. **system_settings** - 系统配置表
6. **system_logs** - 系统日志表

### 安全特性
- **行级安全策略 (RLS)** - 确保数据安全
- **外键约束** - 维护数据完整性
- **权限控制** - 学生、教师、管理员不同权限

### 性能优化
- **索引优化** - 针对常用查询的索引
- **全文搜索** - 支持中文内容搜索
- **自动更新时间戳**

## 在Supabase中运行的步骤

### 1. 登录Supabase Dashboard
访问 https://app.supabase.com 并选择你的项目

### 2. 打开SQL编辑器
在左侧菜单中选择 "SQL Editor"

### 3. 执行SQL文件
将 `create_education_tables.sql` 的内容复制到SQL编辑器中，然后点击 "Run" 按钮

### 4. 验证安装
执行以下查询来验证表是否创建成功：
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'projects', 'audit_records', 'file_uploads', 'system_settings', 'system_logs');
```

## 与你的项目集成

### 1. 更新环境变量
确保你的 `.env` 文件包含正确的Supabase配置：
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

### 2. 项目代码适配
你的现有代码应该可以无缝工作，因为表结构保持了向后兼容性。主要改进包括：

- 添加了 `category` 字段支持
- 增强了审核流程
- 添加了文件上传管理
- 改进了权限控制

### 3. 测试功能
测试以下核心功能：
- 用户注册/登录
- 项目提交
- 项目审核
- 文件上传

## 新功能说明

### 项目分类
现在支持项目分类功能，可以在提交项目时指定分类：
- 数学
- 物理
- 化学
- 生物
- 计算机
- 工程
- 文学
- 艺术
- 其他

### 增强的审核系统
- 完整的审核历史记录
- 审核超时管理
- 审核结果筛选

### 文件管理
- 上传文件记录
- 文件大小限制
- 文件类型验证

## 故障排除

### 常见问题

1. **表已存在错误**
   - 如果表已存在，SQL使用 `IF NOT EXISTS` 不会报错

2. **权限错误**
   - 确保在Supabase中启用了Row Level Security (RLS)

3. **外键约束错误**
   - 确保按正确顺序创建表

### 验证查询
```sql
-- 检查表是否存在
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- 检查RLS策略
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- 检查索引
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public';
```

## 后续步骤

1. **运行测试** - 使用你的测试脚本来验证所有功能
2. **数据迁移** - 如果需要，从旧表迁移数据
3. **性能监控** - 监控查询性能并根据需要调整索引
4. **备份策略** - 设置定期数据库备份

这个数据库结构为你的教育项目管理系统提供了坚实的基础，支持扩展和定制化需求。