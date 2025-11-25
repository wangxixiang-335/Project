# 数据库表依赖分析报告

## 📊 当前表结构情况

### 存在的表
- ✅ `achievements` - 主要成果表，包含所有新数据
- ✅ `projects_view` - 视图，基于achievements表创建，用于兼容旧代码
- ❌ `projects` - 不存在（stats.js中的引用是错误的）

### 表结构对比

#### achievements表字段
```
id, title, description, type_id, cover_url, video_url, status, score, 
publisher_id, instructor_id, created_at
```

#### projects_view视图字段
```
id, user_id, title, content_html, images_array, video_url, category, 
status, reject_reason, auditor_id, created_at, audited_at
```

## 🔍 代码依赖分析

### 1. review.js - 审核功能（主要依赖）
```javascript
// 兼容逻辑：先尝试projects_view，再尝试achievements
const { data: oldProject, error: oldError } = await supabase
  .from('projects_view')
  .select('id, status, title')
  .eq('id', id)
  .eq('status', 'pending')
  .single()

if (!oldError && oldProject) {
  project = oldProject
  isOldProject = true
} else {
  // 尝试achievements表
  const { data: achievement, error: achievementError } = await supabase
    .from('achievements')
    .select('id, status, title')
    .eq('id', id)
    .eq('status', 1)
    .single()
}
```

**分析**: 这段代码显示系统正在从旧表向新表迁移，优先使用projects_view，但achievements是主要目标。

### 2. stats.js - 统计功能（错误引用）
```javascript
const { data: currentProject } = await supabase
  .from('projects')  // ❌ 这个表不存在
  .select('view_count')
  .eq('id', id)
  .single()
```

**分析**: 这是一个代码错误，因为projects表根本不存在。

### 3. review.js - 更新逻辑（潜在问题）
```javascript
if (isOldProject) {
  // 这里有问题：试图更新不存在的projects表
  const { data: updated, error: updateError } = await supabase
    .from('projects')  // ❌ 应该更新projects_view或achievements
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
}
```

## ⚠️ 关键问题发现

### 1. 代码逻辑错误
- review.js第197行试图更新不存在的`projects`表
- stats.js第131行引用了不存在的`projects`表

### 2. 数据一致性问题
- projects_view是基于achievements的视图
- 但更新逻辑试图直接更新projects表（不存在）

## 🎯 删除可行性评估

### ✅ 可以删除的情况
1. **数据完全重合**: projects_view完全基于achievements表
2. **新系统使用achievements**: 所有新功能都基于achievements表
3. **兼容逻辑可移除**: 旧数据迁移完成后，兼容逻辑可以移除

### ❌ 删除前需要解决的问题
1. **修复代码错误**: 
   - 修复review.js中的更新逻辑错误
   - 修复stats.js中的表引用错误
2. **确认数据迁移完成**: 确保所有projects_view数据都已迁移到achievements
3. **测试所有功能**: 确保删除后所有功能正常

## 📋 删除建议步骤

### 第一步：修复代码错误
```javascript
// 修复review.js中的更新逻辑
if (isOldProject) {
  // 应该更新achievements表，而不是projects
  const { data: updated, error: updateError } = await supabase
    .from('achievements')
    .update({
      status: audit_result === AUDIT_RESULTS.APPROVE ? 2 : 3,
      // 其他字段...
    })
    .eq('id', id)
    .select()
    .single()
}
```

### 第二步：修复stats.js
```javascript
// 应该查询achievements表或移除相关功能
const { data: currentProject } = await supabase
  .from('achievements')
  .select('id')  // achievements表没有view_count字段
  .eq('id', id)
  .single()
```

### 第三步：简化review.js逻辑
```javascript
// 移除projects_view兼容逻辑，只使用achievements
const { data: achievement, error } = await supabase
  .from('achievements')
  .select('id, status, title')
  .eq('id', id)
  .eq('status', 1)
  .single()
```

### 第四步：删除视图
```sql
DROP VIEW IF EXISTS projects_view;
```

## 🚀 结论

**可以删除**，但必须先修复代码中的逻辑错误，并确保：

1. ✅ 所有功能都迁移到使用achievements表
2. ✅ 修复review.js和stats.js中的错误引用
3. ✅ 进行全面测试确保功能正常
4. ✅ 备份数据（虽然视图不存储实际数据）

删除projects_view视图将简化系统架构，消除数据冗余，并修复现有的代码逻辑错误。