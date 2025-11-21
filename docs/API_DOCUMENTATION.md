# 学生项目展示与教师审核系统 - API文档

## 概述

本文档详细描述了学生项目展示与教师审核系统的所有后端API接口。所有接口均基于RESTful设计原则，使用JSON格式进行数据交互。

## 基础信息

- **基础URL**: `http://localhost:3000/api`
- **认证方式**: Bearer Token (JWT)
- **响应格式**: JSON
- **字符编码**: UTF-8

## 响应格式

### 成功响应
```json
{
  "success": true,
  "message": "操作成功",
  "data": {}
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误描述"
}
```

### 分页响应
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    "items": [],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalItems": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 500 | 服务器内部错误 |

---

## 1. 认证模块

### 1.1 用户注册

**接口**: `POST /auth/register`

**描述**: 创建新用户账号

**请求参数**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "张三",
  "role": "student"
}
```

**字段说明**:
- `email` (必填): 用户邮箱，需唯一
- `password` (必填): 密码，至少6位
- `username` (必填): 用户名，2-50位
- `role` (必填): 用户角色，student/teacher

**响应示例**:
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user_id": "12345678-1234-1234-1234-123456789012",
    "email": "user@example.com",
    "username": "张三",
    "role": "student",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.2 用户登录

**接口**: `POST /auth/login`

**描述**: 用户登录获取访问令牌

**请求参数**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user_id": "12345678-1234-1234-1234-123456789012",
    "email": "user@example.com",
    "username": "张三",
    "role": "student",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.3 获取当前用户信息

**接口**: `GET /auth/me`

**描述**: 获取当前登录用户信息

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "user_id": "12345678-1234-1234-1234-123456789012",
    "email": "user@example.com",
    "username": "张三",
    "role": "student",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 1.4 用户登出

**接口**: `POST /auth/logout`

**描述**: 用户登出

### 1.5 刷新令牌

**接口**: `POST /auth/refresh`

**描述**: 刷新访问令牌

**请求参数**:
```json
{
  "refresh_token": "refresh_token_value"
}
```

---

## 2. 文件上传模块

### 2.1 图片上传

**接口**: `POST /upload/image`

**描述**: 上传项目图片

**认证**: 需要学生角色

**请求头**:
```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**请求参数**:
- `image` (必填): 图片文件，支持格式：JPG/PNG/WEBP，最大5MB

**响应示例**:
```json
{
  "success": true,
  "message": "图片上传成功",
  "data": {
    "url": "https://xxx.supabase.co/storage/v1/object/public/project-images/...",
    "file_path": "user_id/filename.jpg",
    "file_name": "example.jpg",
    "file_size": 1024000
  }
}
```

### 2.2 视频上传

**接口**: `POST /upload/video`

**描述**: 上传项目视频

**认证**: 需要学生角色

**请求头**:
```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**请求参数**:
- `video` (必填): 视频文件，支持格式：MP4/MOV，最大200MB，最长5分钟

**响应示例**:
```json
{
  "success": true,
  "message": "视频上传成功",
  "data": {
    "url": "https://xxx.supabase.co/storage/v1/object/public/project-videos/...",
    "file_path": "user_id/filename.mp4",
    "file_name": "example.mp4",
    "file_size": 51200000,
    "duration": 180
  }
}
```

### 2.3 删除文件

**接口**: `DELETE /upload/file`

**描述**: 删除已上传的文件

**请求参数**:
```json
{
  "file_path": "user_id/filename.jpg",
  "bucket_name": "project-images"
}
```

---

## 3. 项目管理模块

### 3.1 提交项目

**接口**: `POST /projects`

**描述**: 学生提交新项目

**认证**: 需要学生角色

**请求头**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "title": "我的项目标题",
  "content_html": "<p>项目详细内容，包含图片：<img src=\"图片URL\"></p>",
  "video_url": "https://xxx.supabase.co/storage/v1/object/public/project-videos/..."
}
```

**字段说明**:
- `title` (必填): 项目标题，1-200位
- `content_html` (必填): HTML格式的项目内容，可包含图片
- `video_url` (必填): 从视频上传接口获取的视频URL

**响应示例**:
```json
{
  "success": true,
  "message": "项目提交成功",
  "data": {
    "project_id": "12345678-1234-1234-1234-123456789012",
    "status": 0
  }
}
```

### 3.2 修改项目

**接口**: `PUT /projects/{project_id}`

**描述**: 学生修改项目内容

**认证**: 需要学生角色，且只能修改自己的项目

**请求参数**:
```json
{
  "title": "更新的项目标题",
  "content_html": "<p>更新的项目内容</p>",
  "video_url": "新的视频URL"
}
```

**说明**: 所有字段均为可选，未提供的字段保持不变

### 3.3 获取项目详情

**接口**: `GET /projects/{project_id}`

**描述**: 学生获取自己的项目详情

**认证**: 需要学生角色

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "12345678-1234-1234-1234-123456789012",
    "title": "项目标题",
    "content_html": "<p>项目内容</p>",
    "images_array": ["图片URL1", "图片URL2"],
    "video_url": "视频URL",
    "status": 0,
    "view_count": 100,
    "created_at": "2024-01-01T00:00:00.000Z",
    "student_name": "张三"
  }
}
```

### 3.4 获取项目列表

**接口**: `GET /projects?page=1&pageSize=10`

**描述**: 学生获取自己的项目列表

**查询参数**:
- `page` (可选): 页码，默认1
- `pageSize` (可选): 每页数量，默认10，最大50

**响应示例**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "12345678-1234-1234-1234-123456789012",
        "title": "项目标题",
        "status": 1,
        "view_count": 100,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-02T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalItems": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## 4. 审核模块

### 4.1 获取待审核项目列表

**接口**: `GET /review/pending?page=1&pageSize=10`

**描述**: 教师获取待审核项目列表

**认证**: 需要教师角色

**响应示例**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "project_id": "12345678-1234-1234-1234-123456789012",
        "title": "项目标题",
        "student_name": "张三",
        "submitted_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalItems": 50,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 4.2 获取审核详情

**接口**: `GET /review/{project_id}`

**描述**: 教师查看待审核项目详情

**认证**: 需要教师角色

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "12345678-1234-1234-1234-123456789012",
    "title": "项目标题",
    "content_html": "<p>项目内容</p>",
    "images_array": ["图片URL1", "图片URL2"],
    "video_url": "视频URL",
    "student_name": "张三",
    "student_email": "zhangsan@example.com",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4.3 审核项目

**接口**: `POST /review/{project_id}/audit`

**描述**: 教师审核项目

**认证**: 需要教师角色

**请求参数**:
```json
{
  "audit_result": 1,
  "reject_reason": "审核不通过原因"
}
```

**字段说明**:
- `audit_result` (必填): 审核结果，1=通过，2=不通过
- `reject_reason` (当审核结果为2时必填): 打回原因，1-500位

**响应示例**:
```json
{
  "success": true,
  "message": "项目审核通过",
  "data": {
    "project_id": "12345678-1234-1234-1234-123456789012",
    "status": 1,
    "audit_result": 1,
    "reject_reason": null
  }
}
```

### 4.4 获取审核历史

**接口**: `GET /review/history/list?page=1&pageSize=10`

**描述**: 教师获取所有审核历史记录

**认证**: 需要教师角色

**响应示例**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "project_id": "12345678-1234-1234-1234-123456789012",
        "title": "项目标题",
        "student_name": "张三",
        "status": 1,
        "reject_reason": null,
        "submitted_at": "2024-01-01T00:00:00.000Z",
        "audited_at": "2024-01-02T00:00:00.000Z",
        "auditor_name": "李老师"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalItems": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 4.5 筛选审核历史

**接口**: `GET /review/history/filter?audit_result=1&page=1&pageSize=10`

**描述**: 教师按审核结果筛选历史记录

**查询参数**:
- `audit_result` (可选): 审核结果，1=通过，2=不通过

---

## 5. 统计模块

### 5.1 主页项目列表

**接口**: `GET /stats/projects/public?page=1&pageSize=10`

**描述**: 获取已发布的公开项目列表（无需登录）

**响应示例**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "project_id": "12345678-1234-1234-1234-123456789012",
        "title": "项目标题",
        "content_summary": "项目内容摘要...",
        "cover_image": "封面图片URL",
        "images": ["图片URL1", "图片URL2"],
        "video_url": "视频URL",
        "student_name": "张三",
        "published_at": "2024-01-02T00:00:00.000Z",
        "view_count": 150
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 10,
      "totalItems": 50,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 5.2 浏览量统计

**接口**: `POST /stats/projects/{project_id}/view`

**描述**: 记录项目浏览量（1小时内同一IP只统计一次）

**响应示例**:
```json
{
  "success": true,
  "message": "浏览量统计成功",
  "data": {
    "project_id": "12345678-1234-1234-1234-123456789012",
    "current_view_count": 151
  }
}
```

### 5.3 学生统计数据

**接口**: `GET /stats/student`

**描述**: 学生获取个人统计数据

**认证**: 需要学生角色

**响应示例**:
```json
{
  "success": true,
  "data": {
    "total_projects": 5,
    "pending_count": 1,
    "approved_count": 3,
    "rejected_count": 1,
    "total_views": 500,
    "project_views": [
      {
        "project_id": "12345678-1234-1234-1234-123456789012",
        "view_count": 200
      }
    ]
  }
}
```

### 5.4 教师统计数据

**接口**: `GET /stats/teacher`

**描述**: 教师获取平台统计数据

**认证**: 需要教师角色

**响应示例**:
```json
{
  "success": true,
  "data": {
    "total_projects": 100,
    "pending_count": 10,
    "approved_count": 80,
    "rejected_count": 10,
    "total_views": 5000,
    "approval_rate": 88.89,
    "student_count": 50,
    "teacher_count": 5
  }
}
```

---

## 错误处理

### 常见错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 1001 | 无效的认证令牌 | 重新登录获取新token |
| 1002 | 权限不足 | 检查用户角色权限 |
| 1003 | 参数验证失败 | 检查请求参数格式 |
| 1004 | 文件过大 | 检查文件大小限制 |
| 1005 | 不支持的文件类型 | 检查文件格式 |
| 1006 | 资源不存在 | 检查资源ID是否正确 |
| 1007 | 资源冲突 | 检查资源是否已存在 |

### 错误响应示例
```json
{
  "success": false,
  "error": "参数验证失败",
  "details": [
    "邮箱格式不正确",
    "密码至少需要6个字符"
  ]
}
```

---

## 注意事项

1. **文件上传**: 图片和视频文件需先通过上传接口获取URL，再提交项目
2. **权限控制**: 不同角色只能访问对应权限的接口
3. **分页查询**: 所有列表查询均支持分页，请合理设置pageSize
4. **错误处理**: 所有接口均会返回标准错误响应，请根据错误码进行处理
5. **性能优化**: 建议对频繁查询的接口添加缓存机制

---

## 更新日志

- **v1.0.0** (2024-01-01): 初始版本发布
- 包含完整的用户认证、文件上传、项目管理、审核统计功能