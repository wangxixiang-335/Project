import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, 'app_578098177538/src/pages/p-business_process/index.tsx');

try {
  let content = readFileSync(filePath, 'utf8');
  
  console.log('修复JSX语法错误...');
  
  // 1. 查找并修复常见的JSX问题
  
  // 修复1: 确保所有自闭合标签都正确格式化
  content = content.replace(/<input([^>]*)>/g, '<input$1 />');
  content = content.replace(/<br([^>]*)>/g, '<br$1 />');
  content = content.replace(/<img([^>]*)>/g, '<img$1 />');
  content = content.replace(/<hr([^>]*)>/g, '<hr$1 />');
  content = content.replace(/<meta([^>]*)>/g, '<meta$1 />');
  content = content.replace(/<link([^>]*)>/g, '<link$1 />');
  
  // 修复2: 确保JSX表达式中的字符串正确转义
  content = content.replace(/alt="([^"]*)成果封面"/g, (match, alt) => {
    return `alt="${alt}成果封面"`;
  });
  
  // 修复3: 查找可能的相邻JSX元素问题
  const lines = content.split('\n');
  let fixedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const prevLine = i > 0 ? lines[i - 1].trim() : '';
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
    
    // 检查是否在</>后直接开始新的JSX元素
    if (line === '</>' && nextLine.startsWith('<') && !nextLine.startsWith('</') && !nextLine.startsWith('/*')) {
      // 在</>和下一个元素之间添加注释或空行
      fixedLines.push(lines[i]);
      fixedLines.push(''); // 添加空行
      continue;
    }
    
    fixedLines.push(lines[i]);
  }
  
  content = fixedLines.join('\n');
  
  // 修复4: 确保所有的模态框都有正确的结构
  // 检查并修复模态框的缺失div
  const modalRegex = /\{showApprovalHistoryModal && \(\s*\n(<div[^>]*className="[^"]*bg-white[^"]*"[^>]*>)/g;
  let modalMatch;
  
  while ((modalMatch = modalRegex.exec(content)) !== null) {
    const modalContent = modalMatch[1];
    if (!modalContent.includes('fixed inset-0')) {
      console.log('发现审批历史模态框缺少背景容器，正在修复...');
      const fixedModal = `<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">\n            ${modalContent}`;
      content = content.replace(modalMatch[0], `{showApprovalHistoryModal && (\n          ${fixedModal}`);
    }
  }
  
  // 修复5: 确保返回语句的正确性
  const returnMatch = content.match(/return\s*\(([\s\S]*?)\);?\s*$/);
  if (returnMatch) {
    let returnContent = returnMatch[1];
    
    // 确保return内容被Fragment包装
    if (!returnContent.trim().startsWith('<>')) {
      returnContent = '<>\n' + returnContent + '\n    </>';
      content = content.replace(returnMatch[0], `return (\n    ${returnContent}\n  );`);
    }
  }
  
  // 写回文件
  writeFileSync(filePath, content, 'utf8');
  
  console.log('JSX修复完成！');
  
  // 验证修复结果
  const openTags = (content.match(/<[^\/][^>]*[^\/]>/g) || []).length;
  const closeTags = (content.match(/<\/[^>]+>/g) || []).length;
  const selfClosingTags = (content.match(/<[^>]*\/>/g) || []).length;
  
  console.log(`修复后 - 打开标签: ${openTags}, 闭合标签: ${closeTags}, 自闭合标签: ${selfClosingTags}`);
  
  if (openTags + selfClosingTags === closeTags + selfClosingTags) {
    console.log('✅ 标签数量匹配！');
  } else {
    console.log('⚠️ 标签数量仍不匹配，可能需要进一步检查');
  }
  
} catch (error) {
  console.error('修复过程中出错:', error.message);
}