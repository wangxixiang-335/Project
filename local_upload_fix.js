import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { authenticateToken } from './src/middleware/auth.js'
import { successResponse, errorResponse } from './src/utils/response.js'
import { HTTP_STATUS } from './src/config/constants.js'

// 创建上传目录
const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(uploadDir, req.user.id)
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true })
    }
    cb(null, userDir)
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname)
    const filename = `${uuidv4()}${extension}`
    cb(null, filename)
  }
})

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('不支持的文件类型'))
    }
  }
})

// 创建本地文件上传路由
const router = express.Router()

// 本地图片上传
router.post('/local-image', 
  authenticateToken, 
  upload.single('image'), 
  async (req, res) => {
    try {
      if (!req.file) {
        return errorResponse(res, '请选择要上传的图片', HTTP_STATUS.BAD_REQUEST)
      }

      console.log('本地图片上传成功:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        path: req.file.path
      })

      // 生成访问URL
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
      const fileUrl = `${baseUrl}/uploads/${req.user.id}/${req.file.filename}`

      return successResponse(res, {
        url: fileUrl,
        file_path: req.file.path,
        file_name: req.file.originalname,
        file_size: req.file.size
      }, '图片上传成功')

    } catch (error) {
      console.error('本地图片上传错误:', error)
      return errorResponse(res, '图片上传失败')
    }
  }
)

// 提供静态文件服务
router.use('/uploads', express.static(uploadDir))

export default router

// 临时修复现有上传路由的函数
export function createLocalUploadFix() {
  console.log('🔄 创建本地文件上传修复方案...')
  
  // 创建必要的目录
  const directories = [
    'uploads',
    'uploads/images',
    'uploads/temp'
  ]
  
  directories.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir)
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true })
      console.log(`✅ 创建目录: ${fullPath}`)
    }
  })
  
  console.log('✅ 本地文件上传修复方案创建完成')
  console.log('📁 上传文件将保存在:', uploadDir)
}

// 如果直接运行此脚本，执行修复
if (import.meta.url === `file://${process.argv[1]}`) {
  createLocalUploadFix()
}