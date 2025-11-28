import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('检查页面导入和基本语法...\n');

const pagesDir = path.join(__dirname, 'app_578098177538/src/pages');
const hooksDir = path.join(__dirname, 'app_578098177538/src/hooks');

// 检查 useUserInfo hook 是否存在
const hookPath = path.join(hooksDir, 'useUserInfo.ts');
if (fs.existsSync(hookPath)) {
  console.log('✓ useUserInfo hook 存在');
} else {
  console.log('✗ useUserInfo hook 不存在');
  process.exit(1);
}

// 读取所有页面文件
const pageFiles = [];
function findPages(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findPages(fullPath);
    } else if (file.endsWith('.tsx')) {
      pageFiles.push(fullPath);
    }
  });
}

findPages(pagesDir);

console.log(`\n检查 ${pageFiles.length} 个页面文件:\n`);

let errorCount = 0;
let successCount = 0;

pageFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative('app_578098177538/src', filePath);
    
    // 检查是否有 useUserInfo 导入
    const hasUseUserInfoImport = content.includes('import { useUserInfo }');
    const hasUseUserInfoUsage = content.includes('useUserInfo(');
    
    if (hasUseUserInfoImport && hasUseUserInfoUsage) {
      console.log(`✓ ${relativePath}: useUserInfo 导入和使用正常`);
      successCount++;
    } else if (hasUseUserInfoImport && !hasUseUserInfoUsage) {
      console.log(`⚠ ${relativePath}: useUserInfo 已导入但未使用`);
    } else if (!hasUseUserInfoImport && hasUseUserInfoUsage) {
      console.log(`✗ ${relativePath}: 使用了 useUserInfo 但未导入`);
      errorCount++;
    } else {
      console.log(`ℹ ${relativePath}: 未使用 useUserInfo`);
    }
    
    // 检查基本的语法错误
    if (content.includes('import { useUserInfo }') && !content.includes("from '../../hooks/useUserInfo'") && !content.includes("from '../../../hooks/useUserInfo'")) {
      console.log(`  ✗ 导入路径可能不正确`);
      errorCount++;
    }
    
  } catch (error) {
    console.log(`✗ ${filePath}: 读取失败 - ${error.message}`);
    errorCount++;
  }
});

console.log(`\n总结:`);
console.log(`成功: ${successCount} 个文件`);
console.log(`错误: ${errorCount} 个文件`);

if (errorCount > 0) {
  console.log('\n发现问题，需要修复...');
  process.exit(1);
} else {
  console.log('\n所有检查通过!');
}