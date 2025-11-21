import fs from 'fs';
import path from 'path';

// 需要修复的文件列表（基于之前的搜索结果）
const filesToFix = [
  'd:/Work/Project/temp-frontend/src/App.jsx',
  'd:/Work/Project/temp-frontend/src/components/TeacherDashboard.jsx',
  'd:/Work/Project/temp-frontend/src/components/TeacherApproval.jsx',
  'd:/Work/Project/temp-frontend/src/components/TeacherManage.jsx',
  'd:/Work/Project/temp-frontend/src/components/TeacherPublish.jsx',
  'd:/Work/Project/temp-frontend/src/components/StudentHomepage.jsx',
  'd:/Work/Project/temp-frontend/src/components/ProjectManagement.jsx',
  'd:/Work/Project/temp-frontend/src/components/EnhancedDashboard.jsx'
];

let fixedCount = 0;
let errorCount = 0;

function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  文件不存在: ${filePath}`);
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // 修复模式：
    // 1. http://localhost:8090/api -> /api
    // 2. localhost:8090 -> 相对路径或代理
    // 3. API_BASE = 'http://localhost:8090' -> API_BASE = '/api'
    
    const replacements = [
      {
        from: /const\s+API_BASE\s*=\s*['"]http:\/\/localhost:8090['"]/g,
        to: "const API_BASE = '/api'"
      },
      {
        from: /http:\/\/localhost:8090\/api/g,
        to: '/api'
      },
      {
        from: /localhost:8090/g,
        to: 'localhost:3000' // 如果有直接引用的话
      }
    ];
    
    replacements.forEach(replacement => {
      content = content.replace(replacement.from, replacement.to);
    });
    
    // 只有内容发生变化时才写入文件
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ 修复: ${path.relative('d:/Work/Project', filePath)}`);
      return true;
    } else {
      console.log(`ℹ️  无需修复: ${path.relative('d:/Work/Project', filePath)}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ 修复失败: ${path.relative('d:/Work/Project', filePath)} - ${error.message}`);
    return false;
  }
}

console.log('=== 批量修复端口配置 ===\n');

filesToFix.forEach(filePath => {
  const fixed = fixFile(filePath);
  if (fixed) {
    fixedCount++;
  }
});

console.log(`\n=== 修复结果 ===`);
console.log(`✅ 成功修复: ${fixedCount} 个文件`);
console.log(`❌ 修复失败: ${errorCount} 个文件`);

if (fixedCount > 0) {
  console.log('\n🔄 请重启前端服务器以使修改生效:');
  console.log('1. 停止当前前端服务器 (Ctrl+C)');
  console.log('2. 重新运行: cd temp-frontend && npm run dev');
  console.log('3. 清除浏览器缓存 (Ctrl+F5)');
}