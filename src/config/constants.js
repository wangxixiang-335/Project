// 项目状态常量
export const PROJECT_STATUS = {
  PENDING: 0,      // 待审核
  APPROVED: 1,     // 已通过
  REJECTED: 2      // 已打回
}

// 用户角色常量
export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher'
}

// 审核结果常量
export const AUDIT_RESULTS = {
  APPROVE: 1,      // 通过
  REJECT: 2        // 不通过
}

// Supabase存储桶常量
export const BUCKET_NAMES = {
  PROJECT_IMAGES: 'project-images',
  PROJECT_VIDEOS: 'project-videos'
}

// 文件类型常量
export const FILE_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video'
}

// 允许的文件格式
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime']

// 文件大小限制（字节）
export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024,        // 5MB
  VIDEO: 200 * 1024 * 1024,      // 200MB
  MAX_IMAGES_PER_PROJECT: 10      // 每个项目最多10张图片
}

// 响应状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500
}

// 错误消息
export const ERROR_MESSAGES = {
  INVALID_TOKEN: '无效的认证令牌',
  UNAUTHORIZED: '未授权访问',
  FORBIDDEN: '权限不足',
  NOT_FOUND: '资源不存在',
  VALIDATION_ERROR: '参数验证失败',
  FILE_TOO_LARGE: '文件过大',
  INVALID_FILE_TYPE: '不支持的文件类型',
  PROJECT_LIMIT_EXCEEDED: '项目图片数量超过限制'
}

// 分页默认值
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50
}