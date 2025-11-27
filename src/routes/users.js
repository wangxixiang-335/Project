import express from 'express'
import { supabase, supabaseAdmin } from '../config/supabase.js'
import { validateRequest, registerSchema, loginSchema } from '../middleware/validation.js'
import { successResponse, errorResponse } from '../utils/response.js'
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js'

const router = express.Router()

// 用户注册
router.post('/register', validateRequest(registerSchema), async (req, res) => {
  try {
    const { email, password, username, role } = req.validatedData

    console.log('开始创建用户:', email)
    
    // 角色转换
    const roleNumber = role === 'student' ? 1 : role === 'teacher' ? 2 : 3;

    let authData = null;
    let authError = null;
    
    // 尝试使用管理员API创建用户（如果有服务端密钥）
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your-service-role-key') {
      console.log('使用管理员API创建用户...');
      const result = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role, username }
      });
      authData = result.data;
      authError = result.error;
    } else {
      console.log('服务端密钥未配置，使用普通注册API...');
      // 使用普通注册API
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role, username }
        }
      });
      authData = result.data;
      authError = result.error;
      
      // 如果注册成功但需要邮箱确认，尝试自动登录
      if (!authError && authData.user && !authData.session) {
        console.log('注册成功，尝试自动登录以绕过邮箱确认...');
        try {
          const loginResult = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (loginResult.data.session) {
            authData.session = loginResult.data.session;
            console.log('自动登录成功');
          }
        } catch (loginError) {
          console.log('自动登录失败，需要邮箱确认');
        }
      }
    }

    if (authError) {
      console.error('创建用户错误:', authError)
      
      // 如果是邮箱配置问题，尝试直接创建用户记录
      if (authError.code === 'email_address_invalid' || authError.code === 'not_admin') {
        console.log('Supabase Auth受限，尝试直接创建用户记录...');
        
        // 生成本地用户ID
        const localUserId = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const localUserData = {
          id: localUserId,
          username: username,
          email: email,
          password_hash: '$2a$10$tempPasswordHash', // 临时密码哈希
          role: roleNumber,
          created_at: new Date().toISOString()
        };
        
        const { data: localUser, error: localError } = await supabaseAdmin
          .from('users')
          .insert(localUserData)
          .select()
          .single();
        
        if (localError) {
          console.error('创建本地用户记录失败:', localError);
          return errorResponse(res, '注册失败: ' + (authError.message || '系统错误'));
        }
        
        console.log('✅ 本地用户创建成功:', localUser);
        
        // 返回本地用户信息（生成简单的token）
        return successResponse(res, {
          user_id: localUser.id,
          email: localUser.email,
          username: localUser.username,
          role: role,
          role_id: roleNumber,
          token: 'local_token_' + Buffer.from(email + ':' + Date.now()).toString('base64')
        }, '注册成功（本地账户）', HTTP_STATUS.CREATED);
      }
      
      return errorResponse(res, '创建用户失败: ' + (authError.message || '未知错误'))
    }

    console.log('Auth用户创建成功:', authData.user?.id)

    // 尝试创建users记录（新系统使用users表而不是profiles表）
    try {
      console.log('尝试创建users记录...')
      
      const userData = {
        id: authData.user.id,
        username: username,
        password_hash: '$2a$10$tempPasswordHash', // 临时密码，实际应该通过Supabase Auth处理
        role: roleNumber, // 使用已定义的角色数字
        created_at: new Date().toISOString()
      }

      console.log('创建users记录，数据:', userData)

      // 使用管理客户端创建users记录
      const { data: userResult, error: userError } = await supabaseAdmin
        .from('users')
        .insert(userData)
        .select()
        .single()

      if (userError) {
        if (userError.code === 'PGRST204') {
          console.log('❌ users表不存在，无法创建users记录')
          console.log('💡 提示：请先通过Supabase Dashboard创建users表')
        } else if (userError.message.includes('violates foreign key constraint')) {
          console.log('❌ 外键约束错误：确保auth.users表存在')
        } else if (userError.message.includes('permission denied')) {
          console.log('❌ 权限错误：尝试使用普通客户端')
          // 尝试使用普通客户端
          const { error: normalError } = await supabase
            .from('users')
            .insert(userData)
            .select()
            .single()
          
          if (normalError) {
            console.log('❌ 普通客户端也失败:', normalError.message)
          }
        } else {
          console.warn('创建users记录失败:', userError.message)
          console.log('错误代码:', userError.code)
        }
      } else {
        console.log('✅ Users记录创建成功:', userResult)
      }
    } catch (userError) {
      console.warn('Users创建异常:', userError.message)
    }

    // 获取登录token
    let sessionData = null;
    let sessionError = null;
    
    // 如果是本地用户，使用本地登录
    if (authData.user?.id?.startsWith('local_')) {
      sessionData = { session: { access_token: 'local_token_' + Buffer.from(email + ':' + Date.now()).toString('base64') } }
    } else {
      const result = await supabase.auth.signInWithPassword({
        email,
        password
      });
      sessionData = result.data;
      sessionError = result.error;
    }

    if (sessionError) {
      console.error('登录获取token失败:', sessionError)
      // 仍然返回成功，因为用户已创建
      return successResponse(res, {
        user_id: authData.user?.id || 'local_user',
        email: email,
        username,
        role: role, // 返回字符串格式的角色
        role_id: roleNumber, // 同时返回数字格式的角色
        token: null // 登录失败，返回null
      }, '注册成功（需要重新登录）', HTTP_STATUS.CREATED)
    }

    return successResponse(res, {
      user_id: authData.user.id,
      email: authData.user.email,
      username,
      role: role, // 返回字符串格式的角色
      role_id: roleNumber, // 同时返回数字格式的角色
      token: sessionData.session.access_token
    }, '注册成功', HTTP_STATUS.CREATED)

  } catch (error) {
    console.error('注册错误:', error)
    return errorResponse(res, '注册失败: ' + (error.message || '未知错误'))
  }
})

// 用户登录
router.post('/login', validateRequest(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.validatedData

    // 使用Supabase Auth登录
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      console.error('登录错误:', authError)
      return errorResponse(res, '邮箱或密码错误', HTTP_STATUS.UNAUTHORIZED)
    }

    console.log('登录成功，用户ID:', authData.user.id)

    // 尝试获取用户信息，新系统使用users表
    let username = authData.user.user_metadata?.username || '未知用户'
    let role = authData.user.user_metadata?.role || 'student'
    let roleNumber = role === 'student' ? 1 : role === 'teacher' ? 2 : 3;
    
    try {
      // 检查users表是否存在
      const { error: checkError } = await supabase
        .from('users')
        .select('id')
        .limit(1)

      if (!checkError || checkError.code !== 'PGRST204') {
        // 表存在，尝试获取用户信息
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('username, role')
          .eq('id', authData.user.id)
          .single()

        if (!userError && user) {
          username = user.username
          roleNumber = user.role
          role = user.role === 1 ? 'student' : user.role === 2 ? 'teacher' : 'admin'
        } else {
          console.log('使用auth metadata信息，users表查询失败或为空:', userError?.message)
        }
      } else {
        console.log('users表不存在，使用auth metadata')
      }
    } catch (error) {
      console.log('查询users表异常，使用auth metadata:', error.message)
    }

    return successResponse(res, {
      user_id: authData.user.id,
      email: authData.user.email,
      username: username,
      role: role,
      token: authData.session.access_token
    }, '登录成功')

  } catch (error) {
    console.error('登录错误:', error)
    return errorResponse(res, '登录失败: ' + (error.message || '未知错误'))
  }
})

// 获取当前用户信息
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, ERROR_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED)
    }

    const token = authHeader.substring(7)
    console.log('收到token验证请求，token前10位:', token.substring(0, 10))

    // 验证token
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      console.log('Token验证失败:', error?.message || '用户不存在')
      return errorResponse(res, ERROR_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED)
    }

    console.log('Token验证成功，用户ID:', user.id)

    // 获取用户详细信息（新系统使用users表）
      let username = user.user_metadata?.username || '未知用户'
      let role = user.user_metadata?.role || 'student'
      let roleNumber = role === 'student' ? 1 : role === 'teacher' ? 2 : 3;
      let created_at = user.created_at

      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('username, role, created_at')
          .eq('id', user.id)
          .single()

        if (!userError && userData) {
          username = userData.username
          roleNumber = userData.role
          role = userData.role === 1 ? 'student' : userData.role === 2 ? 'teacher' : 'admin'
          created_at = userData.created_at
        } else {
          console.log('使用auth metadata信息，users表查询失败或为空:', userError?.message)
        }
      } catch (error) {
        console.log('查询users表异常，使用auth metadata:', error.message)
      }

    return successResponse(res, {
      user_id: user.id,
      email: user.email,
      username: username,
      role: role,
      created_at: created_at
    })

  } catch (error) {
    console.error('获取用户信息错误:', error)
    return errorResponse(res, '获取用户信息失败')
  }
})

// 用户登出
router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('登出错误:', error)
    }

    return successResponse(res, null, '登出成功')

  } catch (error) {
    console.error('登出错误:', error)
    return errorResponse(res, '登出失败')
  }
})

// 刷新token
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body

    if (!refresh_token) {
      return errorResponse(res, '缺少刷新令牌', HTTP_STATUS.BAD_REQUEST)
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    })

    if (error) {
      return errorResponse(res, '刷新令牌失败', HTTP_STATUS.UNAUTHORIZED)
    }

    return successResponse(res, {
      token: data.session.access_token,
      refresh_token: data.session.refresh_token
    }, '令牌刷新成功')

  } catch (error) {
    console.error('刷新令牌错误:', error)
    return errorResponse(res, '刷新令牌失败')
  }
})

// 更新用户资料
router.put('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, ERROR_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED)
    }

    const token = authHeader.substring(7)
    const { avatar, signature } = req.body

    // 验证token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return errorResponse(res, ERROR_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED)
    }

    // 更新用户metadata
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          avatar: avatar || user.user_metadata?.avatar || '',
          signature: signature || user.user_metadata?.signature || ''
        }
      }
    )

    if (updateError) {
      console.error('更新用户资料失败:', updateError)
      return errorResponse(res, '更新用户资料失败')
    }

    return successResponse(res, {
      avatar: avatar || user.user_metadata?.avatar || '',
      signature: signature || user.user_metadata?.signature || ''
    }, '资料更新成功')

  } catch (error) {
    console.error('更新用户资料错误:', error)
    return errorResponse(res, '更新用户资料失败')
  }
})

export default router