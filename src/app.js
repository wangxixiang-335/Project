import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

import { validateConfig } from './config/supabase.js'
import userRoutes from './routes/users.js'
import uploadRoutes from './routes/upload.js'
import uploadAlternativeRoutes from './routes/upload-alternative.js'
import uploadSimpleRoutes from './routes/upload-simple.js'
import projectRoutes from './routes/projects.js'
import reviewRoutes from './routes/review.js'
import statsRoutes from './routes/stats.js'
import teacherRoutes from './routes/teacher.js'
import teacherNotificationRoutes from './routes/teacher-notifications.js'
import teacherDashboardRoutes from './routes/teacher-dashboard.js'
import notificationRoutes from './routes/notifications.js'
import projectManagementRoutes from './routes/project-management.js'
import achievementTypesRoutes from './routes/achievement-types.js'
import { errorResponse } from './utils/response.js'
import { HTTP_STATUS } from './config/constants.js'
import localUploadRoutes from '../local_upload_fix.js'
import { createLocalUploadFix } from '../local_upload_fix.js'

// 加载环境变量
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// 验证配置
try {
  validateConfig()
} catch (error) {
  console.error('配置验证失败:', error.message)
  console.log('继续启动，使用备用配置...')
}

// 初始化本地文件上传修复
try {
  createLocalUploadFix()
  console.log('✅ 本地文件上传修复方案已初始化')
} catch (error) {
  console.error('本地文件上传修复初始化失败:', error)
}

// 安全中间件
app.use(helmet())

// CORS配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// 速率限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 限制每个IP 100次请求
  message: {
    success: false,
    error: '请求过于频繁，请稍后再试'
  }
})
app.use(limiter)

// 解析请求体
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }))
app.use(express.urlencoded({ extended: true }))

// 根路径重定向到登录页面
app.get('/', (req, res) => {
  res.redirect('/login')
})

// 处理前端路由 - 提供React应用的主页面
app.get('/login', (req, res) => {
  res.sendFile('index.html', { root: 'app_578098177538' })
})

app.get('/home', (req, res) => {
  res.sendFile('index.html', { root: 'app_578098177538' })
})

app.get('/register', (req, res) => {
  res.sendFile('index.html', { root: 'app_578098177538' })
})

// 教师相关路由
app.get('/teacher-home', (req, res) => {
  res.sendFile('index.html', { root: 'app_578098177538' })
})

app.get('/achievement-approval', (req, res) => {
  res.sendFile('index.html', { root: 'app_578098177538' })
})

app.get('/achievement-publish', (req, res) => {
  res.sendFile('index.html', { root: 'app_578098177538' })
})

app.get('/achievement-management', (req, res) => {
  res.sendFile('index.html', { root: 'app_578098177538' })
})

app.get('/achievement-view', (req, res) => {
  res.sendFile('index.html', { root: 'app_578098177538' })
})

// 管理员相关路由
app.get('/admin-home', (req, res) => {
  res.sendFile('index.html', { root: 'app_578098177538' })
})

app.get('/news-management', (req, res) => {
  res.sendFile('index.html', { root: 'app_578098177538' })
})

app.get('/achievement-library-management', (req, res) => {
  res.sendFile('index.html', { root: 'app_578098177538' })
})

app.get('/knowledge-base-management', (req, res) => {
  res.sendFile('index.html', { root: 'app_578098177538' })
})

app.get('/carousel-management', (req, res) => {
  res.sendFile('index.html', { root: 'app_578098177538' })
})

app.get('/user-management', (req, res) => {
  res.sendFile('index.html', { root: 'app_578098177538' })
})

// 其他前端路由
app.get('/project-intro', (req, res) => {
  res.sendFile('index.html', { root: 'app_578098177538' })
})

app.get('/project-detail', (req, res) => {
  res.sendFile('index.html', { root: 'app_578098177538' })
})

app.get('/business-process', (req, res) => {
  res.sendFile('index.html', { root: 'app_578098177538' })
})

app.get('/student-info', (req, res) => {
  res.sendFile('index.html', { root: 'app_578098177538' })
})

app.get('/personal-center', (req, res) => {
  res.sendFile('index.html', { root: 'app_578098177538' })
})

app.get('/image-viewer', (req, res) => {
  res.sendFile('index.html', { root: 'app_578098177538' })
})

app.get('/change-password', (req, res) => {
  res.sendFile('index.html', { root: 'app_578098177538' })
})

app.get('/forgot-password', (req, res) => {
  res.sendFile('index.html', { root: 'app_578098177538' })
})

// 静态文件服务 - 从 app_578098177538 文件夹提供React构建文件
app.use(express.static('app_578098177538/dist', {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
    }
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
    }
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8')
    }
  }
}))

// 开发环境下的静态文件服务（如果没有构建文件）
app.use('/src', express.static('app_578098177538/src'))
app.use('/node_modules', express.static('app_578098177538/node_modules'))

// 路由配置
app.use('/api/auth', userRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/upload-alt', uploadAlternativeRoutes)
app.use('/api/upload-simple', uploadSimpleRoutes)
app.use('/api', localUploadRoutes) // 本地文件上传路由
app.use('/api/projects', projectRoutes)
app.use('/api/review', reviewRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/teacher', teacherRoutes)
app.use('/api/teacher/notifications', teacherNotificationRoutes)
app.use('/api/teacher/dashboard', teacherDashboardRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/project-management', projectManagementRoutes)
app.use('/api/achievement-types', achievementTypesRoutes)

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  })
})

// 404处理
app.use('*', (req, res) => {
  errorResponse(res, '接口不存在', HTTP_STATUS.NOT_FOUND)
})

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('全局错误:', err)
  
  if (err.type === 'entity.parse.failed') {
    return errorResponse(res, '请求体格式错误', HTTP_STATUS.BAD_REQUEST)
  }
  
  errorResponse(res, '服务器内部错误', HTTP_STATUS.INTERNAL_ERROR)
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`)
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`)
})

export default app