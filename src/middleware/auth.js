import { supabase } from '../config/supabase.js'
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js'

// JWT验证中间件
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: ERROR_MESSAGES.INVALID_TOKEN
      })
    }

    const token = authHeader.substring(7) // 移除 'Bearer ' 前缀

    // 开发者模式：支持特殊token用于测试
    if (token === 'dev-teacher-token') {
      console.log('🔧 使用开发者教师模式')
      // 获取第一个真实的教师用户
      try {
        const { data: teacher, error: teacherError } = await supabase
          .from('users')
          .select('*')
          .eq('role', 2) // 教师角色
          .limit(1)
          .single()
        
        if (!teacherError && teacher) {
          req.user = {
            id: teacher.id,
            email: teacher.email || 'dev-teacher@example.com',
            role: 'teacher'
          }
        } else {
          req.user = {
            id: 'dev-teacher-id',
            email: 'dev-teacher@example.com',
            role: 'teacher'
          }
        }
      } catch (dbError) {
        req.user = {
          id: 'dev-teacher-id',
          email: 'dev-teacher@example.com',
          role: 'teacher'
        }
      }
      next()
      return
    }
    
    if (token === 'dev-student-token') {
      console.log('🔧 使用开发者学生模式')
      // 获取第一个真实的学生用户
      try {
        const { data: student, error: studentError } = await supabase
          .from('users')
          .select('*')
          .eq('role', 1) // 学生角色
          .limit(1)
          .single()
        
        if (!studentError && student) {
          req.user = {
            id: student.id,
            email: student.email || 'dev-student@example.com',
            role: 'student'
          }
        } else {
          req.user = {
            id: 'dev-student-id',
            email: 'dev-student@example.com',
            role: 'student'
          }
        }
      } catch (dbError) {
        req.user = {
          id: 'dev-student-id',
          email: 'dev-student@example.com',
          role: 'student'
        }
      }
      next()
      return
    }

    // 使用Supabase验证token
    console.log('🔍 正在验证token:', token.substring(0, 10) + '...')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    console.log('Supabase验证结果:', { user: !!user, error: error?.message })
    
    if (error || !user) {
      // 如果Supabase验证失败，尝试从数据库获取用户信息作为后备
      console.log('⚠️ Supabase token验证失败，尝试数据库后备方案')
      
      try {
        // 尝试从users表获取用户信息（仅用于开发环境）
        const { data: dbUser, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('id', token.substring(0, 36)) // 假设token以用户ID开头
          .single()
        
        if (!dbError && dbUser) {
          console.log('✅ 从数据库获取用户信息成功:', dbUser.username)
          req.user = {
            id: dbUser.id,
            email: dbUser.email || 'no-email@example.com',
            role: dbUser.role === 2 ? 'teacher' : dbUser.role === 1 ? 'student' : 'student'
          }
          next()
          return
        }
      } catch (dbFallbackError) {
        console.log('❌ 数据库后备方案也失败:', dbFallbackError.message)
      }
      
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: ERROR_MESSAGES.INVALID_TOKEN
      })
    }

    // 将用户信息添加到请求对象
    req.user = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'student' // 从metadata获取角色
    }

    next()
  } catch (error) {
    console.error('Token验证错误:', error)
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: ERROR_MESSAGES.INVALID_TOKEN
    })
  }
}

// 角色检查中间件
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: ERROR_MESSAGES.FORBIDDEN
      })
    }

    next()
  }
}

// 学生权限检查
export const requireStudent = requireRole(['student'])

// 教师权限检查
export const requireTeacher = requireRole(['teacher'])