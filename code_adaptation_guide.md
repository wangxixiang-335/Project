# 项目代码适配指南

## 📊 数据迁移完成总结

✅ **迁移成功**：
- 用户数据：`backup_profiles` → `users`（1条记录）
- 成果数据：`backup_projects` → `achievements`（1条记录）
- 状态映射：`pending→1`, `approved→2`, `rejected→3`

## 🔧 主要代码适配点

### 1. 数据库表名变更

| 旧表名 | 新表名 | 主要变化 |
|--------|--------|----------|
| `profiles` | `users` | 表名变更，角色字段类型变化 |
| `projects` | `achievements` | 概念从"项目"改为"成果" |
| `audit_records` | `approval_records` | 表名变更，字段调整 |

### 2. 角色系统变更

**旧系统**：
```javascript
const role = 'student' | 'teacher' | 'admin'
```

**新系统**：
```javascript
const role = 1 | 2 | 3  // 1学生, 2教师, 3管理员
```

### 3. 项目状态变更

**旧系统**：
```javascript
const PROJECT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved', 
  REJECTED: 'rejected'
};
```

**新系统**：
```javascript
const ACHIEVEMENT_STATUS = {
  DRAFT: 0,     // 草稿
  PENDING: 1,   // 待审批
  PUBLISHED: 2, // 已发布
  REJECTED: 3   // 未通过
};
```

## 📝 具体代码修改指南

### 后端路由适配

#### 1. 用户认证相关 (`src/routes/users.js`)

**修改角色检查**：
```javascript
// 旧代码
const isTeacher = user.role === 'teacher';
const isAdmin = user.role === 'admin';

// 新代码
const isTeacher = user.role === 2;
const isAdmin = user.role === 3;
const isStudent = user.role === 1;
```

**修改用户创建逻辑**：
```javascript
// 旧代码 - projects.js 和 users.js
const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId);

// 新代码
const { data: user, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId);
```

#### 2. 项目相关 (`src/routes/projects.js`)

**修改表名和字段映射**：
```javascript
// 旧代码
const { data: project, error } = await supabase
  .from('projects')
  .insert({
    user_id: req.user.id,
    title,
    content_html,
    images_array: imageUrls,
    video_url,
    category,
    status: PROJECT_STATUS.PENDING
  });

// 新代码
const { data: achievement, error } = await supabase
  .from('achievements')
  .insert({
    publisher_id: req.user.id,  // 字段名变更
    title,
    description: content_html,  // 字段名变更
    type_id: category || (await getDefaultTypeId()), // 需要获取默认类型
    video_url,
    status: ACHIEVEMENT_STATUS.PENDING,  // 状态值变更
    created_at: new Date().toISOString()
  });
```

**添加附件处理**：
```javascript
// 新增 - 处理图片附件
if (imageUrls.length > 0) {
  for (const url of imageUrls) {
    await supabase
      .from('achievement_attachments')
      .insert({
        achievement_id: achievement.id,
        file_name: 'image.jpg',
        file_url: url,
        file_size: 1024 // 实际应该获取真实文件大小
      });
  }
}
```

#### 3. 审核相关 (`src/routes/review.js`)

**修改审核表名和字段**：
```javascript
// 旧代码
const { error: recordError } = await supabase
  .from('audit_records')
  .insert({
    project_id: id,
    auditor_id: req.user.id,
    audit_result,
    reject_reason
  });

// 新代码
const { error: recordError } = await supabase
  .from('approval_records')
  .insert({
    achievement_id: id,  // 字段名变更
    reviewer_id: req.user.id,  // 字段名变更
    status: audit_result === 'approve' ? 1 : 0,  // 状态值转换
    feedback: reject_reason,  // 字段名变更
    reviewed_at: new Date().toISOString()
  });
```

### 前端适配（如果需要）

#### 状态显示适配
```javascript
// 旧代码
function getStatusText(status) {
  switch(status) {
    case 'pending': return '待审核';
    case 'approved': return '已通过';
    case 'rejected': return '已驳回';
  }
}

// 新代码
function getStatusText(status) {
  switch(status) {
    case 0: return '草稿';
    case 1: return '待审批';
    case 2: return '已发布';
    case 3: return '未通过';
  }
}
```

#### 角色显示适配
```javascript
// 旧代码
function getRoleText(role) {
  return role; // student, teacher, admin
}

// 新代码
function getRoleText(role) {
  switch(role) {
    case 1: return '学生';
    case 2: return '教师';
    case 3: return '管理员';
    default: return '未知';
  }
}
```

## 🔄 数据库查询适配

### 项目列表查询适配
```javascript
// 旧查询
const { data: projects } = await supabase
  .from('projects')
  .select('id, title, status, created_at, updated_at')
  .eq('user_id', req.user.id);

// 新查询
const { data: achievements } = await supabase
  .from('achievements')
  .select('id, title, status, created_at')  // updated_at 字段可能不存在
  .eq('publisher_id', req.user.id);  // 字段名变更
```

### 项目详情查询适配
```javascript
// 旧查询
const { data: project } = await supabase
  .from('projects')
  .select(`
    *,
    profiles:user_id (username)
  `)
  .eq('id', id)
  .single();

// 新查询
const { data: achievement } = await supabase
  .from('achievements')
  .select(`
    *,
    users:publisher_id (username)  -- 字段名变更
  `)
  .eq('id', id)
  .single();
```

## ⚠️ 重要注意事项

### 1. 外键约束
新系统中某些字段有外键约束，需要确保关联数据存在：
- `achievements.type_id` 必须关联到 `achievement_types` 表
- `achievements.publisher_id` 必须关联到 `users` 表

### 2. 默认值处理
- `password_hash` 字段需要默认值，实际应该通过Supabase Auth处理
- `class_id` 可以暂时设为NULL，后续完善班级系统

### 3. 数据类型转换
- 数组字段 `images_array` → 单独的 `achievement_attachments` 表
- 状态值从字符串转换为整数
- 角色值从字符串转换为整数

## 🧪 测试建议

### 1. 功能测试清单
- [ ] 用户注册/登录
- [ ] 成果提交
- [ ] 成果列表查看
- [ ] 成果详情查看
- [ ] 成果审核（教师）
- [ ] 文件上传
- [ ] 状态显示

### 2. 数据验证
- [ ] 用户数据完整性
- [ ] 成果数据关联性
- [ ] 附件数据正确性
- [ ] 审批记录完整性

## 🚀 下一步操作

1. **完成代码适配** - 根据上述指南修改相关文件
2. **测试功能** - 逐一测试所有API端点
3. **验证数据** - 确保数据迁移正确性
4. **完善功能** - 根据需要添加新功能

**您希望我协助修改具体的代码文件吗？还是需要我提供其他帮助？**