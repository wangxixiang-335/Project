// 本地认证中间件（支持本地用户登录）
import { successResponse, errorResponse } from '../utils/response.js'
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js'
import { supabase } from '../config/supabase.js'

// 验证本地token
export const authenticateLocalToken = (req, res, next) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, ERROR_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED)
  }

  const token = authHeader.substring(7)
  
  // 检查是否是本地token
  if (token.startsWith('local_token_')) {
    try {
      // 解码token获取用户信息
      const tokenData = Buffer.from(token.substring(12), 'base64').toString()
      const [email] = tokenData.split(':')
      
      if (email) {
        // 查找本地用户
        supabase
          .from('users')
          .select('id, username, email, role')
          .eq('email', email)
          .single()
          .then(({ data: user, error }) => {
            if (error || !user) {
              return errorResponse(res, ERROR_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED)
            }
            
            // 设置用户信息
            req.user = {
              id: user.id,
              email: user.email,
              username: user.username,
              role: user.role === 1 ? 'student' : user.role === 2 ? 'teacher' : 'admin'
            }
            
            next()
          })
      } else {
        return errorResponse(res, ERROR_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED)
      }
    } catch (error) {
      return errorResponse(res, ERROR_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED)
    }
  } else {
    // 原有的Supabase token验证逻辑
    next() // 让下一个中间件处理
  }
}

// 本地用户登录
export const localLogin = async (email, password) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error || !user) {
      return { success: false, error: '用户不存在' }
    }
    
    // 简单密码验证（实际项目中应使用bcrypt）
    if (password === 'password123' || password.length >= 6) {
      const token = 'local_token_' + Buffer.from(email + ':' + Date.now()).toString('base64')
      
      return {
        success: true,
        data: {
          user_id: user.id,
          email: user.email,
          username: user.username,
          role: user.role === 1 ? 'student' : user.role === 2 ? 'teacher' : 'admin',
          token: token
        }
      }
    } else {
      return { success: false, error: '密码错误' }
    }
  } catch (error) {
    return { success: false, error: '登录失败' }
  }
}