# 数据库迁移指南

## 概述
基于PDF设计文档，我们创建了一个完整的教育成果管理系统数据库结构。这个指南将帮助您从现有的项目结构迁移到新的设计。

## 主要变化对比

### 原有结构 vs 新结构

| 原有表名 | 新表名 | 主要变化 |
|---------|--------|----------|
| profiles | users | 表名变更，结构优化 |
| projects | achievements | 概念从"项目"改为"成果"，功能增强 |
| audit_records | approval_records | 表名变更，结构优化 |
| - | classes | 新增班级管理 |
| - | grades | 新增年级管理 |
| - | achievement_types | 新增成果类型 |
| - | achievement_attachments | 新增附件管理 |
| - | notifications | 新增通知系统 |
| - | news | 新增新闻系统 |
| - | banners | 新增轮播图管理 |
| - | knowledge_files | 新增知识库 |

## 详细映射关系

### 用户系统映射
```sql
-- 原有 profiles 表 → 新的 users 表
-- profiles.id → users.id
-- profiles.username → users.username  
-- profiles.email → 需要添加到 users 表
-- profiles.role → users.role (1学生/2教师/3管理员)
-- profiles.created_at → users.created_at
-- 新增: users.class_id (关联班级)
```

### 项目系统映射
```sql
-- 原有 projects 表 → 新的 achievements 表
-- projects.id → achievements.id
-- projects.user_id → achievements.publisher_id
-- projects.title → achievements.title
-- projects.content_html → achievements.description
-- projects.images_array → achievements_attachments.file_url
-- projects.video_url → achievements.video_url
-- projects.category → achievements.type_id (外键关联)
-- projects.status → achievements.status (0草稿/1待审批/2已发布/3未通过)
-- projects.reject_reason → approval_records.feedback
-- projects.auditor_id → approval_records.reviewer_id
-- projects.created_at → achievements.created_at
-- projects.audited_at → approval_records.reviewed_at
```

## 迁移步骤

### 第一步：备份现有数据

由于 `audit_records` 表可能不存在，我们使用更安全的备份方法：

**方法1：在Supabase SQL编辑器中运行备份脚本**
1. 打开Supabase Dashboard
2. 进入SQL编辑器
3. 运行 `backup_existing_data.sql` 文件中的内容

**方法2：手动备份（如果方法1失败）**
```sql
-- 1. 备份 profiles 表
DROP TABLE IF EXISTS backup_profiles;
CREATE TABLE backup_profiles AS SELECT * FROM profiles;

-- 2. 备份 projects 表  
DROP TABLE IF EXISTS backup_projects;
CREATE TABLE backup_projects AS SELECT * FROM projects;

-- 3. 检查并备份 audit_records 表（仅当存在时）
DO $
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_records') THEN
        DROP TABLE IF EXISTS backup_audit_records;
        CREATE TABLE backup_audit_records AS SELECT * FROM audit_records;
        RAISE NOTICE 'audit_records 表备份完成';
    ELSE
        RAISE NOTICE 'audit_records 表不存在，跳过备份';
    END IF;
END $;
```

**验证备份结果：**
```sql
SELECT 'profiles 备份记录数:' as info, COUNT(*) as count FROM backup_profiles;
SELECT 'projects 备份记录数:' as info, COUNT(*) as count FROM backup_projects;
```

**注意：** `audit_records` 表不存在，所以不需要备份

### 使用修正的备份脚本
根据实际数据库结构，请使用 `correct_backup_existing_data.sql` 文件，它包含了：
- ✅ 正确的字段列表（基于实际表结构）
- ✅ 智能的表存在检查
- ✅ 详细的备份验证

### 第二步：创建新表结构
运行 `create_achievement_system_tables.sql` 文件中的所有SQL语句

### 第三步：数据迁移
```sql
-- 迁移用户数据
INSERT INTO users (id, username, email, role, created_at)
SELECT 
    p.id,
    p.username,
    p.email,
    CASE p.role 
        WHEN 'student' THEN 1
        WHEN 'teacher' THEN 2  
        WHEN 'admin' THEN 3
        ELSE 1
    END,
    p.created_at
FROM profiles p;

-- 迁移项目数据到成果表
INSERT INTO achievements (id, title, description, video_url, status, publisher_id, instructor_id, created_at)
SELECT 
    p.id,
    p.title,
    p.content_html,
    p.video_url,
    CASE p.status
        WHEN 'pending' THEN 1
        WHEN 'approved' THEN 2
        WHEN 'rejected' THEN 3
        ELSE 0
    END,
    p.user_id,
    p.auditor_id,
    p.created_at
FROM projects p;

-- 迁移审核记录
INSERT INTO approval_records (achievement_id, reviewer_id, status, feedback, reviewed_at)
SELECT 
    ar.project_id,
    ar.auditor_id,
    CASE ar.audit_result
        WHEN 'approve' THEN 1
        WHEN 'reject' THEN 0
        ELSE 0
    END,
    ar.reject_reason,
    p.audited_at
FROM audit_records ar
JOIN projects p ON p.id = ar.project_id;

-- 迁移项目图片到附件表
INSERT INTO achievement_attachments (achievement_id, file_url, file_name, file_size)
SELECT 
    p.id,
    unnest(p.images_array),
    'image_' || generate_series(1, array_length(p.images_array, 1)) || '.jpg',
    1024 -- 默认大小，实际需要获取真实文件大小
FROM projects p 
WHERE p.images_array IS NOT NULL 
AND array_length(p.images_array, 1) > 0;
```

### 第四步：更新项目代码

#### 后端API更新
1. **用户认证** - 更新用户角色检查逻辑
2. **项目提交** - 改为成果提交，适配新表结构
3. **审核流程** - 更新审核状态处理
4. **文件上传** - 使用新的附件表结构

#### 数据库查询更新
```javascript
// 原有查询
const { data: projects } = await supabase
  .from('projects')
  .select('*')
  .eq('user_id', userId);

// 新查询
const { data: achievements } = await supabase
  .from('achievements')
  .select('*')
  .eq('publisher_id', userId);
```

### 第五步：功能增强

#### 新增功能
1. **班级管理** - 支持按班级组织用户
2. **年级管理** - 支持年级层次结构
3. **成果分类** - 更细致的成果类型管理
4. **通知系统** - 自动通知用户审核结果
5. **新闻系统** - 发布学院新闻和动态
6. **轮播图管理** - 首页展示管理
7. **知识库** - 文件资源管理

#### 改进功能
1. **更丰富的附件管理** - 支持多种文件类型
2. **完善的审批流程** - 多级审批支持
3. **评分系统** - 教师可以给成果评分
4. **协作者功能** - 支持团队成果

## 代码适配建议

### 1. 角色权限更新
```javascript
// 原有角色检查
const isTeacher = user.role === 'teacher';

// 新角色检查  
const isTeacher = user.role === 2; // 2表示教师
const isAdmin = user.role === 3;   // 3表示管理员
const isStudent = user.role === 1; // 1表示学生
```

### 2. 状态管理更新
```javascript
// 原有状态
const PROJECT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved', 
  REJECTED: 'rejected'
};

// 新状态
const ACHIEVEMENT_STATUS = {
  DRAFT: 0,     // 草稿
  PENDING: 1,   // 待审批
  PUBLISHED: 2, // 已发布
  REJECTED: 3   // 未通过
};
```

### 3. 文件上传更新
使用专门的 `achievement_attachments` 表管理附件，支持更好的文件元数据管理。

## 回滚方案
如果迁移出现问题，可以通过备份表恢复数据：
```sql
-- 恢复数据
INSERT INTO profiles SELECT * FROM backup_profiles;
INSERT INTO projects SELECT * FROM backup_projects;
INSERT INTO audit_records SELECT * FROM backup_audit_records;

-- 删除新表（如果需要完全回滚）
DROP TABLE IF EXISTS knowledge_files CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS news_categories CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS approval_records CASCADE;
DROP TABLE IF EXISTS achievement_attachments CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS achievement_types CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

## 测试建议

1. **功能测试** - 逐一测试所有CRUD操作
2. **权限测试** - 验证不同角色的访问权限
3. **数据完整性测试** - 确保外键约束正常工作
4. **性能测试** - 验证索引优化效果
5. **集成测试** - 测试完整的业务流程

这个新的数据库结构提供了更完整的教育成果管理功能，支持更丰富的业务场景和更好的扩展性。