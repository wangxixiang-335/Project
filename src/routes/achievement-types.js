import express from 'express'
import { supabase } from '../config/supabase.js'
import { successResponse, errorResponse } from '../utils/response.js'

const router = express.Router()

// 获取所有成果类型
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('achievement_types')
      .select('id, name')
      .order('name')

    if (error) {
      throw error
    }

    return successResponse(res, data, '获取成果类型成功')
  } catch (error) {
    console.error('获取成果类型错误:', error)
    return errorResponse(res, '获取成果类型失败')
  }
})

export default router