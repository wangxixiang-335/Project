import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🔍 调试前端问题...')

console.log('\n📋 问题诊断清单:')
console.log('1. 检查前端是否能正常启动')
console.log('2. 检查React组件是否有语法错误')
console.log('3. 检查API调用是否正确')
console.log('4. 检查依赖是否安装完整')

// 检查前端依赖
console.log('\n📦 检查依赖安装...')
import { execSync } from 'child_process'

try {
  const packageJsonPath = join(__dirname, 'temp-frontend', 'package.json')
  const nodeModulesPath = join(__dirname, 'temp-frontend', 'node_modules')
  
  console.log('Package.json路径:', packageJsonPath)
  console.log('node_modules路径:', nodeModulesPath)
  
  // 检查关键依赖
  const { default: fs } = await import('fs')
  
  if (fs.existsSync(packageJsonPath)) {
    console.log('✅ package.json 存在')
    
    const packageContent = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    console.log('主要依赖:')
    Object.keys(packageContent.dependencies || {}).forEach(dep => {
      console.log(`  - ${dep}: ${packageContent.dependencies[dep]}`)
    })
  }
  
  if (fs.existsSync(nodeModulesPath)) {
    console.log('✅ node_modules 存在')
  } else {
    console.log('❌ node_modules 不存在，需要运行 npm install')
  }
  
} catch (error) {
  console.error('❌ 检查依赖失败:', error.message)
}

console.log('\n🔧 解决方案建议:')
console.log('1. 打开 http://localhost:5176 查看具体错误')
console.log('2. 使用简化登录页面测试: file:///' + __dirname + '/simple-frontend.html')
console.log('3. 使用连接测试页面: file:///' + __dirname + '/test-connection.html')
console.log('4. 检查浏览器控制台错误信息')

console.log('\n🎯 如果React前端报错:')
console.log('- 可能是import路径问题')
console.log('- 可能是组件语法错误')
console.log('- 可能是缺少依赖包')
console.log('- 可能是API地址配置错误')

console.log('\n💡 快速修复步骤:')
console.log('1. 先使用simple-frontend.html测试登录功能')
console.log('2. 确认后端API正常工作')
console.log('3. 再调试React前端问题')