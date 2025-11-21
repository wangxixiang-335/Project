import multer from 'multer'
import { FILE_SIZE_LIMITS, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES } from '../config/constants.js'

// 内存存储（适合小文件）
const storage = multer.memoryStorage()

// 文件过滤器
export const fileFilter = (req, file, cb) => {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.mimetype)
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.mimetype)
  
  if (isImage || isVideo) {
    cb(null, true)
  } else {
    cb(new Error('不支持的文件类型'), false)
  }
}

// 图片上传配置
export const imageUpload = multer({
  storage: storage,
  limits: {
    fileSize: FILE_SIZE_LIMITS.IMAGE
  },
  fileFilter: fileFilter
}).single('image')

// 视频上传配置
export const videoUpload = multer({
  storage: storage,
  limits: {
    fileSize: FILE_SIZE_LIMITS.VIDEO
  },
  fileFilter: fileFilter
}).single('video')

// 文件上传错误处理中间件
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: '文件过大'
      })
    }
  } else if (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    })
  }
  next()
}

// 获取文件类型
export const getFileType = (mimetype) => {
  if (ALLOWED_IMAGE_TYPES.includes(mimetype)) {
    return 'image'
  } else if (ALLOWED_VIDEO_TYPES.includes(mimetype)) {
    return 'video'
  }
  return null
}