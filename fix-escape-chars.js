import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const filePath = join(__dirname, 'temp-frontend', 'src', 'components', 'EnhancedDashboard.jsx')

console.log('🔧 修复转义字符问题...')

try {
  let content = fs.readFileSync(filePath, 'utf8')
  
  console.log('📝 查找并修复转义字符问题...')
  
  // 修复错误的转义序列
  content = content.replace(/\\\\n`/g, '\n`')
  content = content.replace(/\\\\n';/g, '\n';')
  content = content.replace(/\\\\n";/g, '\n";')
  content = content.replace(/\\\\n\);/g, '\n);')
  
  // 修复可能的字符编码问题
  content = content.replace(/[\uFF0C]/g, ',') // 全角逗号
  content = content.replace(/[\u3002]/g, '.') // 全角句号
  
  fs.writeFileSync(filePath, content, 'utf8')
  
  console.log('✅ 修复完成!')
  console.log('📁 文件:', filePath)
  console.log('🚀 现在可以重新启动前端服务器')
  
} catch (error) {
  console.error('❌ 修复失败:', error.message)
}