import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, 'app_578098177538/src/pages/p-business_process/index.tsx');

try {
  const content = readFileSync(filePath, 'utf8');
  
  console.log('检查JSX语法错误...');
  
  // 检查常见的JSX语法问题
  const issues = [];
  
  // 1. 检查未闭合的标签
  const openTags = content.match(/<[^\/][^>]*[^\/]>/g) || [];
  const closeTags = content.match(/<\/[^>]+>/g) || [];
  const selfClosingTags = content.match(/<[^>]*\/>/g) || [];
  
  console.log(`打开标签数量: ${openTags.length}`);
  console.log(`闭合标签数量: ${closeTags.length}`);
  console.log(`自闭合标签数量: ${selfClosingTags.length}`);
  
  // 详细分析标签匹配
  const tagStack = [];
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9-]*)[^>]*>/g;
  let match;
  
  while ((match = tagRegex.exec(content)) !== null) {
    const fullTag = match[0];
    const tagName = match[1];
    
    if (fullTag.startsWith('</')) {
      // 闭合标签
      if (tagStack.length > 0 && tagStack[tagStack.length - 1] === tagName) {
        tagStack.pop();
      } else {
        console.log(`未匹配的闭合标签: ${fullTag} (栈顶: ${tagStack[tagStack.length - 1] || 'empty'})`);
      }
    } else if (!fullTag.endsWith('/>')) {
      // 打开标签（非自闭合）
      tagStack.push(tagName);
    }
  }
  
  if (tagStack.length > 0) {
    console.log(`未闭合的标签栈: ${tagStack.join(', ')}`);
  }
  
  // 2. 检查相邻的JSX元素
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 查找可能的相邻JSX元素错误
    if (line.startsWith('</>') && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      if (nextLine.startsWith('<') && !nextLine.startsWith('</') && !nextLine.startsWith('/*')) {
        issues.push({
          line: i + 1,
          content: line,
          nextContent: nextLine,
          message: '发现相邻的JSX元素，可能需要用Fragment包装'
        });
      }
    }
  }
  
  // 3. 检查return语句的完整性
  const returnMatch = content.match(/return\s*\(([\s\S]*?)\);?\s*$/);
  if (returnMatch) {
    const returnContent = returnMatch[1];
    console.log('找到return语句，检查完整性...');
    
    // 检查是否有未配对的括号
    let openParen = 0;
    let openBrace = 0;
    let openAngle = 0;
    
    for (const char of returnContent) {
      if (char === '(') openParen++;
      else if (char === ')') openParen--;
      else if (char === '{') openBrace++;
      else if (char === '}') openBrace--;
      else if (char === '<') openAngle++;
      else if (char === '>') openAngle--;
    }
    
    console.log(`括号平衡: (${openParen}), {${openBrace}}, <${openAngle}>`);
    
    if (openParen !== 0 || openBrace !== 0 || openAngle !== 0) {
      issues.push({
        message: `括号不匹配: (${openParen}), {${openBrace}}, <${openAngle}>`
      });
    }
  }
  
  if (issues.length > 0) {
    console.log('\n发现以下问题:');
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. 行 ${issue.line}: ${issue.message}`);
      if (issue.content) console.log(`   内容: ${issue.content}`);
      if (issue.nextContent) console.log(`   下一行: ${issue.nextContent}`);
    });
  } else {
    console.log('未发现明显的JSX语法问题');
  }
  
} catch (error) {
  console.error('读取文件失败:', error.message);
}