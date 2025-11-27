import express from 'express'
import { supabase } from '../config/supabase.js'
import { authenticateToken } from '../middleware/auth.js'
import { successResponse, errorResponse } from '../utils/response.js'
import { HTTP_STATUS } from '../config/constants.js'

const router = express.Router()

// Base64图片上传（直接存储到数据库）
router.post('/base64-simple', 
  authenticateToken, 
  async (req, res) => {
    try {
      console.log('=== 简化Base64图片上传开始 ===')
      console.log('用户ID:', req.user.id)
      
      const { imageData, fileName } = req.body
      
      if (!imageData) {
        return errorResponse(res, '请提供图片数据', HTTP_STATUS.BAD_REQUEST)
      }
      
      // 验证base64格式
      if (!imageData.startsWith('data:image/')) {
        return errorResponse(res, '无效的图片格式', HTTP_STATUS.BAD_REQUEST)
      }
      
      // 提取文件扩展名和大小信息
      const matches = imageData.match(/^data:image\/(\w+);base64,/)
      if (!matches) {
        return errorResponse(res, '无效的图片格式', HTTP_STATUS.BAD_REQUEST)
      }
      
      const extension = matches[1]
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
      
      // 检查数据大小（限制为2MB）
      if (base64Data.length > 2 * 1024 * 1024 * 1.37) { // base64编码增加约37%大小
        return errorResponse(res, '图片过大，最大支持2MB', HTTP_STATUS.BAD_REQUEST)
      }
      
      // 将base64数据存储到用户资料表中
      const finalFileName = fileName || `image_${Date.now()}.${extension}`
      
      // 检查是否已存在用户图片记录
      const { data: existingImages, error: checkError } = await supabase
        .from('user_images')
        .select('id')
        .eq('user_id', req.user.id)
        .limit(1)
      
      if (checkError) {
        console.error('检查现有图片失败:', checkError)
      }
      
      let result
      if (existingImages && existingImages.length > 0) {
        // 更新现有记录
        const { data, error } = await supabase
          .from('user_images')
          .update({
            image_data: base64Data,
            file_name: finalFileName,
            file_type: `image/${extension}`,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', req.user.id)
          .select()
        
        result = { data, error }
      } else {
        // 创建新记录
        const { data, error } = await supabase
          .from('user_images')
          .insert([{
            user_id: req.user.id,
            image_data: base64Data,
            file_name: finalFileName,
            file_type: `image/${extension}`,
            created_at: new Date().toISOString()
          }])
          .select()
        
        result = { data, error }
      }
      
      if (result.error) {
        console.error('数据库操作失败:', result.error)
        // 如果数据库操作失败，但仍然返回base64数据作为URL
        console.log('数据库操作失败，但仍然返回base64数据作为URL')
        const imageUrl = imageData
        return successResponse(res, {
          url: imageUrl,
          file_name: finalFileName,
          file_size: base64Data.length,
          storage_type: 'base64_data_url',
          warning: '数据库保存失败，使用base64数据URL'
        }, '图片处理成功')
      }
      
      console.log('✅ 图片数据保存成功')
      
      // 返回base64数据作为URL（可以直接在img标签中使用）
      const imageUrl = imageData
      
      return successResponse(res, {
        url: imageUrl,
        file_name: finalFileName,
        file_size: base64Data.length,
        storage_type: 'base64_database'
      }, '图片上传成功')
      
    } catch (error) {
      console.error('简化Base64图片上传错误:', error)
      return errorResponse(res, '图片上传失败')
    }
  }
)

export default router