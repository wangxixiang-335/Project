
// 本地图片服务器配置
export const LOCAL_STORAGE_CONFIG = {
  enabled: true,
  basePath: 'D:\Work\Project\uploads\images',
  publicUrl: 'http://localhost:3000/uploads/images/',
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
}

// 检查本地存储是否可用
export function isLocalStorageEnabled() {
  return process.env.USE_LOCAL_STORAGE === 'true' || LOCAL_STORAGE_CONFIG.enabled
}

// 生成本地图片URL
export function generateLocalImageUrl(filename) {
  return LOCAL_STORAGE_CONFIG.publicUrl + filename
}

// 保存图片到本地
export function saveImageLocally(buffer, filename) {
  const filePath = path.join(LOCAL_STORAGE_CONFIG.basePath, filename)
  fs.writeFileSync(filePath, buffer)
  return generateLocalImageUrl(filename)
}
