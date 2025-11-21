import fs from 'fs';
import path from 'path';

// 需要检查的目录
const searchDirs = [
  'd:/Work/Project/temp-frontend',
  'd:/Work/Project/src'
];

// 要搜索的端口模式
const portPatterns = [
  /8090/g,
  /localhost:8090/g,
  /http.*8090/g,
  /API_BASE.*8090/g
];

let totalFiles = 0;
let filesWith8090 = [];

function searchInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = [];
    
    portPatterns.forEach((pattern, index) => {
      const found = content.match(pattern);
      if (found) {
        matches.push(...found);
      }
    });
    
    if (matches.length > 0) {
      return {
        file: filePath,
        matches: [...new Set(matches)] // 去重
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

function searchInDirectory(dir, extensions = ['.js', '.jsx', '.html', '.ts', '.tsx']) {
  const results = [];
  
  function walk(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walk(filePath);
      } else if (extensions.some(ext => file.endsWith(ext))) {
        totalFiles++;
        const result = searchInFile(filePath);
        if (result) {
          results.push(result);
        }
      }
    }
  }
  
  walk(dir);
  return results;
}

console.log('=== 查找端口配置不一致问题 ===\n');

searchDirs.forEach(dir => {
  console.log(`🔍 搜索目录: ${dir}`);
  
  if (!fs.existsSync(dir)) {
    console.log(`❌ 目录不存在: ${dir}\n`);
    return;
  }
  
  const results = searchInDirectory(dir);
  
  if (results.length === 0) {
    console.log('✅ 未找到8090端口配置\n');
  } else {
    console.log(`❌ 发现 ${results.length} 个文件包含8090端口:`);
    results.forEach(result => {
      console.log(`\n  📁 ${path.relative('d:/Work/Project', result.file)}`);
      result.matches.forEach(match => {
        console.log(`     - ${match}`);
      });
      filesWith8090.push(result);
    });
    console.log();
  }
});

console.log('=== 搜索结果汇总 ===');
console.log(`📊 总文件数: ${totalFiles}`);
console.log(`❌ 包含8090端口的文件: ${filesWith8090.length}`);

if (filesWith8090.length > 0) {
  console.log('\n🔧 需要修复的文件:');
  filesWith8090.forEach(result => {
    const relativePath = path.relative('d:/Work/Project', result.file);
    console.log(`  - ${relativePath}`);
    console.log(`    匹配: ${result.matches.join(', ')}`);
  });
  
  console.log('\n💡 修复建议:');
  console.log('1. 将所有 8090 改为相对路径 /api');
  console.log('2. 或者改为 http://localhost:3000');
  console.log('3. 确保与 vite.config.js 中的代理配置一致');
} else {
  console.log('\n✅ 所有端口配置一致！');
}