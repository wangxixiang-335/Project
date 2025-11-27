# 手动创建Supabase存储桶指南

## 问题说明

由于数据库权限限制，无法通过SQL直接创建存储桶。需要手动在Supabase控制台中创建。

## 手动创建步骤

### 步骤1：登录Supabase控制台
1. 打开 [https://app.supabase.com](https://app.supabase.com)
2. 登录您的账户
3. 选择对应的项目

### 步骤2：创建project-images存储桶
1. 在左侧菜单中点击 **"Storage"**
2. 点击 **"Create bucket"** 按钮
3. 填写以下信息：
   - **Name**: `project-images`
   - **Public bucket**: ✅ 勾选
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: 
     ```
     image/png
     image/jpg
     image/jpeg
     image/gif
     image/webp
     ```
4. 点击 **"Create bucket"**

### 步骤3：创建project-videos存储桶
1. 再次点击 **"Create bucket"** 按钮
2. 填写以下信息：
   - **Name**: `project-videos`
   - **Public bucket**: ✅ 勾选
   - **File size limit**: `50 MB`
   - **Allowed MIME types**:
     ```
     video/mp4
     video/avi
     video/mov
     video/wmv
     ```
3. 点击 **"Create bucket"**

### 步骤4：验证存储桶创建
1. 在Storage页面应该能看到两个新创建的存储桶
2. 点击每个存储桶，确认设置正确

## 设置存储桶权限

### 步骤5：配置Policies（重要）

对于每个存储桶，需要设置适当的访问权限：

#### project-images存储桶Policies：

1. 点击 `project-images` 存储桶
2. 点击 **"Policies"** 标签
3. 点击 **"New policy"**
4. 选择 **"Custom"** 并添加以下策略：

**允许认证用户上传**：
```sql
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'project-images');
```

**允许所有用户读取**：
```sql
CREATE POLICY "Allow all users to read files" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'project-images');
```

**允许用户删除自己的文件**：
```sql
CREATE POLICY "Allow users to delete own files" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'project-images' AND (storage.foldername(name))[1] = auth.uid()::text);
```

#### project-videos存储桶Policies：

重复上述步骤，将 `project-images` 替换为 `project-videos`。

## 验证设置

### 步骤6：测试上传功能

执行以下命令测试上传功能：

```bash
# 测试Base64上传
node test_base64_upload.js

# 检查存储桶状态
node check_supabase_buckets.js

# 检查数据库表
node check_user_images_table.js
```

## 故障排除

### 常见问题

1. **"Bucket not found" 错误**
   - 确认存储桶名称正确（project-images, project-videos）
   - 检查存储桶是否设置为Public

2. **"权限不足" 错误**
   - 确认已正确设置Policies
   - 检查用户是否已登录（需要认证）

3. **上传仍然失败**
   - 检查文件大小是否在限制范围内
   - 确认文件类型在允许的MIME类型列表中
   - 查看控制台详细错误信息

### 备用方案

如果存储桶创建仍然有问题，系统会自动使用Base64数据URL方案：
- 图片会直接以Base64格式存储在数据库中
- 可以正常显示，但性能可能略低于Storage存储
- 这是100%可靠的备用方案

## 联系支持

如果仍然遇到问题：
1. 检查Supabase项目设置
2. 确认账户有足够的权限
3. 查看Supabase控制台中的错误日志
4. 考虑联系Supabase技术支持