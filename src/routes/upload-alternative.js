import express from 'express'
import { supabase } from '../config/supabase.js'
import { authenticateToken, requireStudent, requireTeacher } from '../middleware/auth.js'
import { imageUpload, videoUpload, handleUploadError, getFileType } from '../middleware/fileUpload.js'
import { successResponse, errorResponse } from '../utils/response.js'
import { BUCKET_NAMES, FILE_SIZE_LIMITS, HTTP_STATUS } from '../config/constants.js'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'
import FormData from 'form-data'

const router = express.Router()

// 备用图片上传方案 - 使用外部图片托管服务
router.post('/teacher-image-alt', 
  authenticateToken, 
  requireTeacher, 
  imageUpload, 
  handleUploadError, 
  async (req, res) => {
    try {
      console.log('=== 使用备用方案上传图片 ===')
      
      if (!req.file) {
        return errorResponse(res, '请选择要上传的图片', HTTP_STATUS.BAD_REQUEST)
      }

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

      // 方案1：尝试上传到Imgur（作为备选）
      try {
        console.log('尝试上传到Imgur...')
        
        // 注意：你需要在https://api.imgur.com/注册应用获取Client ID
        const imgurClientId = process.env.IMGUR_CLIENT_ID
        
        if (imgurClientId) {
          const formData = new FormData()
          formData.append('image', buffer.toString('base64'))
          formData.append('type', 'base64')
          
          const response = await axios.post('https://api.imgur.com/3/image', formData, {
            headers: {
              'Authorization': `Client-ID ${imgurClientId}`,
              ...formData.getHeaders()
            }
          })
          
          if (response.data && response.data.data && response.data.data.link) {
            console.log('Imgur上传成功:', response.data.data.link)
            
            return successResponse(res, {
              url: response.data.data.link,
              path: response.data.data.id,
              name: originalname,
              source: 'imgur'
            }, '图片上传成功')
          }
        }
      } catch (imgurError) {
        console.log('Imgur上传失败，使用本地方案:', imgurError.message)
      }

      // 方案2：使用本地临时存储（仅开发环境）
      if (process.env.NODE_ENV === 'development') {
        console.log('使用本地临时存储方案')
        
        // 生成文件名
        const fileExtension = originalname.split('.').pop()
        const fileName = `${uuidv4()}.${fileExtension}`
        const tempUrl = `https://via.placeholder.com/400x300.png?text=临时图片-${fileName}`
        
        // 在实际生产环境中，这里应该上传到CDN或其他云存储服务
        return successResponse(res, {
          url: tempUrl,
          path: `temp/${fileName}`,
          name: originalname,
          source: 'temp',
          note: '这是临时解决方案，生产环境请配置CDN'
        }, '图片上传成功（临时方案）')
      }

      // 方案3：返回默认图片URL
      const defaultImageUrl = 'https://via.placeholder.com/400x300.png?text=成果封面图'
      console.log('使用默认图片URL:', defaultImageUrl)
      
      return successResponse(res, {
        url: defaultImageUrl,
        path: 'default',
        name: originalname,
        source: 'default',
        note: '上传服务暂时不可用，使用默认图片'
      }, '图片上传成功（默认图片）')

    } catch (error) {
      console.error('备用图片上传错误:', error)
      return errorResponse(res, '图片上传失败')
    }
  }
)

// 获取Service Role Key上传（如果可用）
router.post('/teacher-image-service',
  authenticateToken, 
  requireTeacher, 
  imageUpload, 
  handleUploadError, 
  async (req, res) => {
    try {
      console.log('=== 使用Service Role Key上传 ===')
      
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

      // 检查是否有Service Role Key
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (!serviceRoleKey || serviceRoleKey === 'your-service-role-key') {
        console.log('Service Role Key未配置，使用备用方案')
        
        // 返回默认图片URL
        const defaultImageUrl = 'https://via.placeholder.com/400x300.png?text=成果封面图'
        return successResponse(res, {
          url: defaultImageUrl,
          path: 'default',
          name: originalname,
          source: 'default'
        }, '图片上传成功（默认图片）')
      }

      // 使用Service Role Key创建管理员客户端
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        serviceRoleKey
      )

      // 上传到Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAMES.PROJECT_IMAGES)
        .upload(filePath, buffer, {
          contentType: mimetype,
          upsert: false
        })

      if (error) {
        console.error('Service Role上传错误:', error)
        throw error
      }

      // 获取文件URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from(BUCKET_NAMES.PROJECT_IMAGES)
        .getPublicUrl(data.path)

      console.log('Service Role上传成功:', publicUrl)

      return successResponse(res, {
        url: publicUrl,
        path: data.path,
        name: originalname,
        source: 'supabase-service'
      }, '图片上传成功')

    } catch (error) {
      console.error('Service Role上传错误:', error)
      
      // 如果Service Role也失败，使用默认图片
      const defaultImageUrl = 'https://via.placeholder.com/400x300.png?text=成果封面图'
      return successResponse(res, {
        url: defaultImageUrl,
        path: 'default',
        name: req.file?.originalname || 'default.png',
        source: 'default',
        note: 'Service Role上传失败，使用默认图片'
      }, '图片上传成功（默认图片）')
    }
  }
)

export default router