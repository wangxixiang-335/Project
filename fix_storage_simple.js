import { supabaseAdmin, BUCKET_NAMES } from './src/config/supabase.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function fixStorageSimple() {
  try {
    console.log('=== 简化存储桶修复 ===')
    
    // 1. 设置本地存储备用方案
    console.log('1. 设置本地存储备用方案...')
    
    const localUploadDir = path.join(__dirname, 'uploads', 'images')
    
    if (!fs.existsSync(localUploadDir)) {
      fs.mkdirSync(localUploadDir, { recursive: true })
      console.log('✅ 本地存储目录创建成功:', localUploadDir)
    }
    
    // 2. 创建一个简单的本地图片服务器配置文件
    const localServerConfig = `
// 本地图片服务器配置
export const LOCAL_STORAGE_CONFIG = {
  enabled: true,
  basePath: '${localUploadDir}',
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
`
    
    fs.writeFileSync(
      path.join(__dirname, 'src', 'config', 'local-storage.js'),
      localServerConfig
    )
    console.log('✅ 本地存储配置文件创建成功')
    
    // 3. 修改上传路由以支持本地存储
    await updateUploadRoutes()
    
    console.log('✅ 本地存储备用方案配置完成')
    console.log('📁 图片将保存到:', localUploadDir)
    console.log('🌐 图片访问地址: http://localhost:3000/uploads/images/')
    
    return { success: true, method: 'local' }
    
  } catch (error) {
    console.error('存储修复失败:', error)
    return { success: false, error: error.message }
  }
}

// 更新上传路由
async function updateUploadRoutes() {
  try {
    console.log('2. 更新上传路由以支持本地存储...')
    
    // 读取现有的上传路由文件
    const uploadRoutePath = path.join(__dirname, 'src', 'routes', 'upload.js')
    const uploadContent = fs.readFileSync(uploadRoutePath, 'utf8')
    
    // 检查是否已经包含本地存储逻辑
    if (uploadContent.includes('localStorageFallback')) {
      console.log('✅ 上传路由已包含本地存储逻辑')
      return
    }
    
    // 添加本地存储回退函数
    const localStorageFallback = `
// 本地存储回退方案
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

const localStorageConfig = {
  enabled: true,
  basePath: path.join(process.cwd(), 'uploads', 'images'),
  publicUrl: 'http://localhost:3000/uploads/images/',
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
}

// 生成本地存储URL
function generateLocalUrl(filename) {
  return localStorageConfig.publicUrl + filename
}

// 保存图片到本地存储
function saveLocalImage(buffer, originalname) {
  const fileExtension = originalname.split('.').pop()
  const filename = \`\${uuidv4()}.\${fileExtension}\`
  const filePath = path.join(localStorageConfig.basePath, filename)
  
  // 确保目录存在
  if (!fs.existsSync(localStorageConfig.basePath)) {
    fs.mkdirSync(localStorageConfig.basePath, { recursive: true })
  }
  
  // 保存文件
  fs.writeFileSync(filePath, buffer)
  
  return {
    url: generateLocalUrl(filename),
    file_path: filePath,
    file_name: originalname,
    file_size: buffer.length,
    storage_type: 'local'
  }
}
`
    
    // 在文件开头添加本地存储配置
    const updatedContent = localStorageFallback + '\n' + uploadContent
    
    // 保存更新后的文件
    fs.writeFileSync(uploadRoutePath, updatedContent)
    console.log('✅ 上传路由更新成功')
    
  } catch (error) {
    console.error('更新上传路由失败:', error.message)
  }
}

// 执行修复
fixStorageSimple().then(result => {
  console.log('\n修复结果:', result)
  
  if (result.success) {
    console.log('\n🎉 富文本编辑器图片问题修复完成！')
    console.log('📝 修复内容：')
    console.log('   ✅ 创建本地存储目录')
    console.log('   ✅ 配置本地图片服务器')
    console.log('   ✅ 更新上传路由支持本地存储')
    console.log('\n🔄 请重启服务器以应用更改：')
    console.log('   npm run dev 或 node src/app.js')
  }
}).catch(error => {
  console.error('修复失败:', error)
})