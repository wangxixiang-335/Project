import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const srcDir = join(__dirname, 'temp-frontend', 'src')

function fixApiBase(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    
    // 替换错误的API_BASE
    const original = content
    content = content.replace(/const API_BASE = '\/api'/g, "const API_BASE = 'http://localhost:3000/api'")
    content = content.replace(/const API_BASE = "\/api"/g, 'const API_BASE = "http://localhost:3000/api"')
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ ${filePath}: 修复API_BASE`)
      return true
    }
    
    return false
  } catch (error) {
    console.log(`❌ 处理文件失败: ${filePath} - ${error.message}`)
    return false
  }
}

function findFilesRecursively(dir, extensions) {
  const files = []
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir)
    
    for (const item of items) {
      const fullPath = join(currentDir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        traverse(fullPath)
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath)
      }
    }
  }
  
  traverse(dir)
  return files
}

console.log('🔧 开始修复所有组件的API_BASE...')

const jsxFiles = findFilesRecursively(srcDir, ['.jsx', '.js'])
let totalFixed = 0

for (const file of jsxFiles) {
  if (fixApiBase(file)) {
    totalFixed++
  }
}

console.log(`\n✅ 完成! 总共修复了 ${totalFixed} 个文件的API_BASE`)
console.log('📁 处理了以下目录:', srcDir)

console.log('\n🚀 现在可以重新启动前端服务器:')
console.log('cd d:/Work/Project/temp-frontend')
console.log('npm run dev')

console.log('\n🎯 修复内容:')
console.log('- 所有组件的API_BASE从/api改为http://localhost:3000/api')
console.log('- 确保前端能正确连接后端API')