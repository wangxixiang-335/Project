import express from 'express'
import { supabase, supabaseAdmin } from '../config/supabase.js'
import { authenticateToken, requireStudent, requireTeacher } from '../middleware/auth.js'
import { imageUpload, videoUpload, handleUploadError, getFileType } from '../middleware/fileUpload.js'
import { successResponse, errorResponse } from '../utils/response.js'
import { BUCKET_NAMES, FILE_SIZE_LIMITS, HTTP_STATUS } from '../config/constants.js'
import ffmpeg from 'fluent-ffmpeg'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

// 图片上传
router.post('/image', 
  authenticateToken, 
  requireStudent, 
  imageUpload, 
  handleUploadError, 
  async (req, res) => {
    try {
      if (!req.file) {
        return errorResponse(res, '请选择要上传的图片', HTTP_STATUS.BAD_REQUEST)
      }

      const { buffer, originalname, mimetype } = req.file
      
      // 验证文件类型
      const fileType = getFileType(mimetype)
      console.log('文件类型验证:', { mimetype, fileType, isImage: fileType === 'image' })
      if (fileType !== 'image') {
        console.log('❌ 不支持的文件类型:', mimetype)
        return errorResponse(res, `不支持的文件类型: ${mimetype}`, HTTP_STATUS.BAD_REQUEST)
      }
      
      // 验证文件大小
      const maxSize = FILE_SIZE_LIMITS.IMAGE
      console.log('文件大小验证:', { fileSize: req.file.size, maxSize, isValidSize: req.file.size <= maxSize })
      if (req.file.size > maxSize) {
        console.log('❌ 文件过大:', req.file.size, '>', maxSize)
        return errorResponse(res, `文件过大，最大支持 ${maxSize / (1024 * 1024)}MB`, HTTP_STATUS.BAD_REQUEST)
      }

      // 生成唯一文件名
      const fileExtension = originalname.split('.').pop()
      const fileName = `${uuidv4()}.${fileExtension}`
      const filePath = `${req.user.id}/${fileName}`

      // 上传到Supabase Storage（使用管理员权限）
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAMES.PROJECT_IMAGES)
        .upload(filePath, buffer, {
          contentType: mimetype,
          upsert: false
        })

      if (error) {
        console.error('图片上传错误:', error)
        return errorResponse(res, '图片上传失败')
      }

      // 获取文件URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from(BUCKET_NAMES.PROJECT_IMAGES)
        .getPublicUrl(filePath)

      return successResponse(res, {
        url: publicUrl,
        file_path: filePath,
        file_name: originalname,
        file_size: buffer.length
      }, '图片上传成功')

    } catch (error) {
      console.error('图片上传错误:', error)
      return errorResponse(res, '图片上传失败')
    }
  }
)

// 视频上传
router.post('/video', 
  authenticateToken, 
  requireStudent, 
  videoUpload, 
  handleUploadError, 
  async (req, res) => {
    try {
      if (!req.file) {
        return errorResponse(res, '请选择要上传的视频', HTTP_STATUS.BAD_REQUEST)
      }

      const { buffer, originalname, mimetype } = req.file
      
      // 验证文件类型
      const fileType = getFileType(mimetype)
      if (fileType !== 'video') {
        return errorResponse(res, '不支持的文件类型', HTTP_STATUS.BAD_REQUEST)
      }

      // 生成唯一文件名
      const fileExtension = originalname.split('.').pop()
      const fileName = `${uuidv4()}.${fileExtension}`
      const filePath = `${req.user.id}/${fileName}`

      // 获取视频时长
      const videoDuration = await getVideoDuration(buffer)
      
      if (videoDuration > 300) { // 5分钟限制
        return errorResponse(res, '视频时长不能超过5分钟', HTTP_STATUS.BAD_REQUEST)
      }

      // 上传到Supabase Storage
      const { data, error } = await supabase.storage
        .from(BUCKET_NAMES.PROJECT_VIDEOS)
        .upload(filePath, buffer, {
          contentType: mimetype,
          upsert: false
        })

      if (error) {
        console.error('视频上传错误:', error)
        return errorResponse(res, '视频上传失败')
      }

      // 获取文件URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAMES.PROJECT_VIDEOS)
        .getPublicUrl(filePath)

      return successResponse(res, {
        url: publicUrl,
        file_path: filePath,
        file_name: originalname,
        file_size: buffer.length,
        duration: videoDuration
      }, '视频上传成功')

    } catch (error) {
      console.error('视频上传错误:', error)
      return errorResponse(res, '视频上传失败')
    }
  }
)

// 获取视频时长
function getVideoDuration(buffer) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(buffer)
      .ffprobe((err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(Math.floor(data.format.duration))
        }
      })
  })
}

// 删除文件
router.delete('/file', authenticateToken, async (req, res) => {
  try {
    const { file_path, bucket_name } = req.body

    if (!file_path || !bucket_name) {
      return errorResponse(res, '缺少必要参数', HTTP_STATUS.BAD_REQUEST)
    }

    // 验证用户权限（只能删除自己的文件）
    const userId = file_path.split('/')[0]
    if (userId !== req.user.id) {
      return errorResponse(res, '无权删除此文件', HTTP_STATUS.FORBIDDEN)
    }

    const { error } = await supabase.storage
      .from(bucket_name)
      .remove([file_path])

    if (error) {
      console.error('文件删除错误:', error)
      return errorResponse(res, '文件删除失败')
    }

    return successResponse(res, null, '文件删除成功')

  } catch (error) {
    console.error('文件删除错误:', error)
    return errorResponse(res, '文件删除失败')
  }
})

// 教师图片上传（专为教师成果发布设计）
router.post('/teacher-image', 
  authenticateToken, 
  requireTeacher, 
  imageUpload, 
  handleUploadError, 
  async (req, res) => {
    try {
      console.log('=== 教师图片上传开始 ===')
      console.log('用户ID:', req.user.id)
      console.log('请求头Content-Type:', req.headers['content-type'])
      
      if (!req.file) {
        console.log('❌ 未找到上传文件')
        return errorResponse(res, '请选择要上传的图片', HTTP_STATUS.BAD_REQUEST)
      }
      
      console.log('上传文件信息:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        bufferLength: req.file.buffer?.length
      })

      const { buffer, originalname, mimetype } = req.file
      
      // 验证文件类型
      const fileType = getFileType(mimetype)
      if (fileType !== 'image') {
        return errorResponse(res, '不支持的文件类型', HTTP_STATUS.BAD_REQUEST)
      }

      // 生成唯一文件名
      const fileExtension = originalname.split('.').pop()
      const fileName = `${uuidv4()}.${fileExtension}`
      const filePath = `${req.user.id}/${fileName}`

      // 上传到Supabase Storage（使用管理员权限）
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAMES.PROJECT_IMAGES)
        .upload(filePath, buffer, {
          contentType: mimetype,
          upsert: false
        })

      if (error) {
        console.error('教师图片上传错误:', error)
        return errorResponse(res, '图片上传失败')
      }

      // 获取文件URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from(BUCKET_NAMES.PROJECT_IMAGES)
        .getPublicUrl(data.path)

      console.log('教师图片上传成功:', publicUrl)

      return successResponse(res, {
        url: publicUrl,
        path: data.path,
        name: originalname
      }, '图片上传成功')

    } catch (error) {
      console.error('教师图片上传错误:', error)
      return errorResponse(res, '图片上传失败')
    }
  }
)

// 通用图片上传（只需要认证，不需要特定角色权限）
router.post('/general-image', 
  authenticateToken, 
  imageUpload, 
  handleUploadError, 
  async (req, res) => {
    try {
      console.log('=== 通用图片上传开始 ===')
      console.log('用户ID:', req.user.id)
      console.log('用户角色:', req.user.role)
      console.log('请求头Content-Type:', req.headers['content-type'])
      
      if (!req.file) {
        console.log('❌ 未找到上传文件')
        return errorResponse(res, '请选择要上传的图片', HTTP_STATUS.BAD_REQUEST)
      }
      
      console.log('上传文件信息:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        bufferLength: req.file.buffer?.length
      })

      const { buffer, originalname, mimetype } = req.file
      
      // 验证文件类型
      const fileType = getFileType(mimetype)
      if (fileType !== 'image') {
        return errorResponse(res, '不支持的文件类型', HTTP_STATUS.BAD_REQUEST)
      }

      // 验证文件大小
      if (req.file.size > FILE_SIZE_LIMITS.IMAGE) {
        return errorResponse(res, `文件过大，最大支持 ${FILE_SIZE_LIMITS.IMAGE / (1024 * 1024)}MB`, HTTP_STATUS.BAD_REQUEST)
      }

      // 生成唯一文件名
      const fileExtension = originalname.split('.').pop()
      const fileName = `${uuidv4()}.${fileExtension}`
      const filePath = `${req.user.id}/${fileName}`

      // 上传到Supabase Storage（使用管理员权限）
      console.log('上传到Supabase Storage...')
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAMES.PROJECT_IMAGES)
        .upload(filePath, buffer, {
          contentType: mimetype,
          upsert: false
        })

      if (error) {
        console.error('❌ 图片上传错误:', error)
        return errorResponse(res, '图片上传失败')
      }

      console.log('✅ 图片上传成功:', data)

      // 获取文件URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from(BUCKET_NAMES.PROJECT_IMAGES)
        .getPublicUrl(filePath)

      console.log('获取到的公共URL:', publicUrl)

      return successResponse(res, {
        url: publicUrl,
        file_path: filePath,
        file_name: originalname,
        file_size: buffer.length
      }, '图片上传成功')

    } catch (error) {
      console.error('通用图片上传错误:', error)
      return errorResponse(res, '图片上传失败')
    }
  }
)

// Base64图片上传（简化版本，只需要认证）
router.post('/base64-image', 
  authenticateToken, 
  async (req, res) => {
    try {
      console.log('=== Base64图片上传开始 ===')
      console.log('用户ID:', req.user.id)
      
      const { imageData, fileName } = req.body
      
      if (!imageData) {
        return errorResponse(res, '请提供图片数据', HTTP_STATUS.BAD_REQUEST)
      }
      
      // 验证base64格式
      if (!imageData.startsWith('data:image/')) {
        return errorResponse(res, '无效的图片格式', HTTP_STATUS.BAD_REQUEST)
      }
      
      // 提取文件扩展名
      const matches = imageData.match(/^data:image\/(\w+);base64,/)
      if (!matches) {
        return errorResponse(res, '无效的图片格式', HTTP_STATUS.BAD_REQUEST)
      }
      
      const extension = matches[1]
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
      
      // 解码base64数据
      const buffer = Buffer.from(base64Data, 'base64')
      
      // 验证文件大小
      if (buffer.length > FILE_SIZE_LIMITS.IMAGE) {
        return errorResponse(res, `文件过大，最大支持 ${FILE_SIZE_LIMITS.IMAGE / (1024 * 1024)}MB`, HTTP_STATUS.BAD_REQUEST)
      }
      
      // 生成文件名
      const finalFileName = fileName || `${uuidv4()}.${extension}`
      const filePath = `${req.user.id}/${finalFileName}`
      
      console.log('上传Base64图片:', { filePath, size: buffer.length, type: extension })

      // 上传到Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAMES.PROJECT_IMAGES)
        .upload(filePath, buffer, {
          contentType: `image/${extension}`,
          upsert: false
        })

      if (error) {
        console.error('Base64图片上传错误:', error)
        return errorResponse(res, '图片上传失败')
      }

      console.log('✅ Base64图片上传成功:', data)

      // 获取文件URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from(BUCKET_NAMES.PROJECT_IMAGES)
        .getPublicUrl(filePath)

      return successResponse(res, {
        url: publicUrl,
        file_path: filePath,
        file_name: finalFileName,
        file_size: buffer.length
      }, '图片上传成功')

    } catch (error) {
      console.error('Base64图片上传错误:', error)
      return errorResponse(res, '图片上传失败')
    }
  }
)

export default router