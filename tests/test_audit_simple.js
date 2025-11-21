// 简单测试审核API问题

// 模拟前端发送的请求
const testAuditRequest = {
  audit_result: 1,
  reject_reason: null
}

console.log('测试请求体:', testAuditRequest)
console.log('audit_result 类型:', typeof testAuditRequest.audit_result)
console.log('reject_reason 类型:', typeof testAuditRequest.reject_reason)

// 验证是否符合验证规则
const Joi = require('joi')

const auditSchema = Joi.object({
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
    otherwise: Joi.string().max(500).optional()
  })
})

const { error, value } = auditSchema.validate(testAuditRequest)

if (error) {
  console.log('❌ 验证失败:', error.details)
} else {
  console.log('✅ 验证通过:', value)
}