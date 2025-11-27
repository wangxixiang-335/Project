// 验证标题修改是否成功
import fs from 'fs';

console.log('🔍 验证教师成果管理页面标题修改...\n');

const filePath = 'd:/Work/Project/app_578098177538/src/pages/p-achievement_management/index.tsx';

try {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 检查是否包含修改后的标题
  if (content.includes('教师成果列表')) {
    console.log('✅ 成功：已找到 "教师成果列表"');
  } else {
    console.log('❌ 失败：未找到 "教师成果列表"');
  }
  
  // 检查是否还有旧标题
  if (content.includes('学生成果列表')) {
    console.log('⚠️  警告：仍然存在 "学生成果列表"（可能还有其他地方需要修改）');
  } else {
    console.log('✅ 成功：已清理所有 "学生成果列表"');
  }
  
  // 显示相关代码片段
  const lines = content.split('\n');
  const relevantLines = lines.filter((line, index) => {
    return line.includes('成果列表') || 
           (index > 330 && index < 340); // 相关代码区域
  });
  
  console.log('\n📋 相关代码片段：');
  relevantLines.forEach((line, index) => {
    const lineNumber = lines.indexOf(line) + 1;
    console.log(`${lineNumber}: ${line.trim()}`);
  });
  
} catch (error) {
  console.error('❌ 读取文件失败:', error.message);
}

console.log('\n🎉 验证完成！');