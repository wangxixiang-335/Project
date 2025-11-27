// API配置
export const API_CONFIG = {
  // 基础URL - 根据环境变量或默认值
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  
  // 超时时间
  TIMEOUT: 30000,
  
  // 请求头配置
  HEADERS: {
    'Content-Type': 'application/json',
  }
}

// API端点配置
export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    CHANGE_PASSWORD: '/auth/change-password',
    PROFILE: '/auth/profile',
    UPDATE_PROFILE: '/auth/update-profile',
  },
  
  // 项目相关
  PROJECTS: {
    LIST: '/projects',
    DETAIL: '/projects/:id',
    CREATE: '/projects',
    UPDATE: '/projects/:id',
    DELETE: '/projects/:id',
    SUBMIT: '/projects/submit',
    TEACHER_PUBLISH: '/projects/teacher-publish',
  },
  
  // 审核相关
  REVIEW: {
    LIST: '/review',
    DETAIL: '/review/:id',
    APPROVE: '/review/:id/approve',
    REJECT: '/review/:id/reject',
    SUBMIT_REVIEW: '/review/submit',
  },
  
  // 教师相关
  TEACHER: {
    DASHBOARD: '/teacher/dashboard',
    NOTIFICATIONS: '/teacher/notifications',
    PROJECTS: '/teacher/projects',
    STUDENTS: '/teacher/students',
  },
  
  // 上传相关
  UPLOAD: {
    FILE: '/upload',
    IMAGE: '/upload/image',
    VIDEO: '/upload/video',
    TEACHER_IMAGE: '/upload/teacher-image',
    TEACHER_IMAGE_ALT: '/upload-alt/teacher-image-alt',
    TEACHER_IMAGE_SERVICE: '/upload-alt/teacher-image-service',
    GENERAL_IMAGE: '/upload/general-image',
    BASE64_IMAGE: '/upload/base64-image',
    BASE64_SIMPLE: '/upload-simple/base64-simple',
  },
  
  // 统计相关
  STATS: {
    OVERVIEW: '/stats/overview',
    PROJECTS: '/stats/projects',
    USERS: '/stats/users',
  },
  
  // 通知相关
  NOTIFICATIONS: {
    LIST: '/notifications',
    READ: '/notifications/:id/read',
    DELETE: '/notifications/:id',
  },
  
  // 项目管理
  PROJECT_MANAGEMENT: {
    LIST: '/project-management',
    UPDATE_STATUS: '/project-management/:id/status',
    ASSIGN_REVIEWER: '/project-management/:id/assign',
  }
}