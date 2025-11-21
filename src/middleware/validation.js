import Joi from 'joi'
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js'

// 通用验证中间件
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate({
      ...req.body,
      ...req.query
      })

    if (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        details: error.details.map(detail => detail.message)
      })
    }

    // 将验证后的值添加到请求对象
    req.validatedData = value
    next()
  }
}

// 用户注册验证
export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': '邮箱格式不正确',
    'any.required': '邮箱是必填项'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': '密码至少需要6个字符',
    'any.required': '密码是必填项'
  }),
  role: Joi.string().valid('student', 'teacher').required().messages({
    'any.only': '角色必须是student或teacher',
    'any.required': '角色是必填项'
  }),
  username: Joi.string().min(2).max(50).required().messages({
    'string.min': '用户名至少需要2个字符',
    'string.max': '用户名不能超过50个字符',
    'any.required': '用户名是必填项'
  })
})

// 用户登录验证
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
})

// 项目提交验证（支持文字+图片或任意单项提交）
export const projectCreateSchema = Joi.object({
  title: Joi.string().min(1).max(200).required().messages({
    'string.min': '标题不能为空',
    'string.max': '标题不能超过200个字符',
    'any.required': '标题是必填项'
  }),
  content_html: Joi.string().allow('').default(''),
  video_url: Joi.string().uri().allow('').default('').messages({
    'string.uri': '视频URL格式不正确'
  }),
  category: Joi.string().optional().allow('').default('')
})

// 项目修改验证
export const projectUpdateSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional(),
  content_html: Joi.string().min(1).optional(),
  video_url: Joi.string().uri().optional(),
  category: Joi.string().optional()
})

// 审核操作验证
export const auditSchema = Joi.object({
  audit_result: Joi.number().valid(1, 2).required().messages({
    'any.only': '审核结果必须是1(通过)或2(不通过)',
    'any.required': '审核结果是必填项'
  }),
  reject_reason: Joi.when('audit_result', {
    is: 2, // 当审核结果为不通过时
    then: Joi.string().min(1).max(500).required().messages({
      'string.min': '打回原因不能为空',
      'string.max': '打回原因不能超过500个字符',
      'any.required': '打回原因是必填项'
    }),
    otherwise: Joi.string().max(500).allow('').optional().messages({
      'string.base': '打回原因必须是字符串',
      'string.max': '打回原因不能超过500个字符'
    })
  })
})

// 分页参数验证
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(10)
})