# Supabase存储桶创建指南

## 步骤1：登录Supabase Dashboard
1. 访问 https://app.supabase.com
2. 选择你的项目

## 步骤2：创建存储桶
1. 点击左侧菜单的 **"Storage"**
2. 点击 **"Create bucket"** 按钮
3. 创建以下存储桶：

### 存储桶1：project-images
- **Bucket ID**: `project-images`
- **Public bucket**: ✅ 开启
- **File size limit**: 5MB
- **Allowed MIME types**: `image/*`

### 存储桶2：project-videos
- **Bucket ID**: `project-images`
- **Public bucket**: ✅ 开启  
- **File size limit**: 200MB
- **Allowed MIME types**: `video/*`

## 步骤3：验证存储桶
创建完成后，在Dashboard中应该能看到这两个存储桶。

## 步骤4：测试上传
创建完成后，运行以下命令测试：
```bash
node test_upload_direct.js
```

## 注意事项
- 确保存储桶设置为Public，这样文件可以通过URL访问
- 文件大小限制要合理，避免上传过大的文件
- MIME类型限制可以防止上传不安全的文件类型