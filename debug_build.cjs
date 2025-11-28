// 简单的构建调试脚本
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app_578098177538/src/pages/p-project_detail/index.tsx');

try {
  const content = fs.readFileSync(filePath, 'utf8');
  
  console.log('文件长度:', content.length);
  console.log('包含 JSX Fragment: ', content.includes('React.Fragment'));
  console.log('包含条件渲染: ', content.includes('loading ?'));
  console.log('包含 useState: ', content.includes('useState'));
  
  // 检查括号匹配
  const lines = content.split('\n');
  let openBraces = 0;
  let closeBraces = 0;
  
  lines.forEach((line, index) => {
    const openCount = (line.match(/\{/g) || []).length;
    const closeCount = (line.match(/\}/g) || []).length;
    openBraces += openCount;
    closeBraces += closeCount;
  });
  
  console.log('左括号数量:', openBraces);
  console.log('右括号数量:', closeBraces);
  console.log('括号匹配:', openBraces === closeBraces ? '✅' : '❌');
  
} catch (error) {
  console.error('读取文件失败:', error);
}