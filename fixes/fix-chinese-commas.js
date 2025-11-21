import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const srcDir = join(__dirname, 'temp-frontend', 'src')

function fixChineseCommas(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    
    // 统计替换
    const originalCommas = (content.match(/，/g) || []).length
    
    // 替换中文逗号为英文逗号
    content = content.replace(/，/g, ',')
    
    fs.writeFileSync(filePath, content, 'utf8')
    
    if (originalCommas > 0) {
      console.log(`✅ ${filePath}: 替换了 ${originalCommas} 个中文逗号`)
    }
    
    return originalCommas
  } catch (error) {
    console.log(`❌ 处理文件失败: ${filePath} - ${error.message}`)
    return 0
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

console.log('🔧 开始修复所有中文逗号...')

const jsxFiles = findFilesRecursively(srcDir, ['.jsx', '.js'])
let totalReplaced = 0

for (const file of jsxFiles) {
  totalReplaced += fixChineseCommas(file)
}

console.log(`\n✅ 完成! 总共替换了 ${totalReplaced} 个中文逗号`)
console.log('📁 处理了以下目录:', srcDir)

console.log('\n🚀 现在可以重新启动前端服务器:')
console.log('cd d:/Work/Project/temp-frontend')
console.log('npm run dev')