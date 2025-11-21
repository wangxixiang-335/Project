import express from 'express'
import { supabase } from '../config/supabase.js'
import { authenticateToken, requireStudent } from '../middleware/auth.js'
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
      if (fileType !== 'image') {
        return errorResponse(res, '不支持的文件类型', HTTP_STATUS.BAD_REQUEST)
      }

      // 生成唯一文件名
      const fileExtension = originalname.split('.').pop()
      const fileName = `${uuidv4()}.${fileExtension}`
      const filePath = `${req.user.id}/${fileName}`

      // 上传到Supabase Storage
      const { data, error } = await supabase.storage
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
      const { data: { publicUrl } } = supabase.storage
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

export default router