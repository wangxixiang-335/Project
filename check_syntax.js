import fs from 'fs';

function checkFileSyntax(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    console.log(`\n检查文件: ${filePath}`);
    console.log(`总行数: ${lines.length}`);
    
    // 检查问题行
    if (lines.length >= 702) {
      console.log(`第702行: "${lines[701]}"`);
    }
    if (lines.length >= 489) {
      console.log(`第489行: "${lines[488]}"`);
    }
    
    // 检查可能的语法问题
    let braceCount = 0;
    let parenCount = 0;
    let issues = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // 计算大括号
      for (let char of line) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '(') parenCount++;
        if (char === ')') parenCount--;
      }
      
      // 检查问题
      if (line.trim() === '};' && i > 0) {
        const prevLine = lines[i - 1].trim();
        if (!prevLine.includes('return') && !prevLine.includes('}') && !prevLine.includes('function') && !prevLine.includes('const') && !prevLine.includes('class')) {
          issues.push(`第${lineNum}行: 可能有悬空的};`);
        }
      }
    }
    
    console.log(`大括号平衡: ${braceCount === 0 ? '✅' : '❌ 不平衡 (' + braceCount + ')'}`);
    console.log(`圆括号平衡: ${parenCount === 0 ? '✅' : '❌ 不平衡 (' + parenCount + ')'}`);
    
    if (issues.length > 0) {
      console.log('发现的问题:');
      issues.forEach(issue => console.log('  ❌ ' + issue));
    }
    
    return { braceCount, parenCount, issues };
  } catch (error) {
    console.error(`读取文件失败: ${error.message}`);
    return null;
  }
}

// 检查两个文件
checkFileSyntax('src/pages/p-achievement_approval/index.tsx');
checkFileSyntax('src/pages/p-achievement_management/index.tsx');