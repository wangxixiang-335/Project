import { HTTP_STATUS } from '../config/constants.js'

// 成功响应格式
export const successResponse = (res, data = null, message = '操作成功', statusCode = HTTP_STATUS.OK) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  })
}

// 错误响应格式
export const errorResponse = (res, error = '操作失败', statusCode = HTTP_STATUS.BAD_REQUEST) => {
  return res.status(statusCode).json({
    success: false,
    error: typeof error === 'string' ? error : error.message || '未知错误'
  })
}

// 分页响应格式
export const paginatedResponse = (res, data, total, page, pageSize) => {
  return successResponse(res, {
    items: data,
    pagination: {
      currentPage: page,
      pageSize: pageSize,
      totalItems: total,
      totalPages: Math.ceil(total / pageSize),
      hasNext: page * pageSize < total,
      hasPrev: page > 1
    }
  })
}