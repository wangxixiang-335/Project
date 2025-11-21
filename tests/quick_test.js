import { createRequire } from 'module';
const require = createRequire(import.meta.url);

console.log('🔍 检查应用模块...');

try {
  // 检查基本导入
  console.log('📦 测试基本导入...');
  const express = require('express');
  console.log('✅ Express 导入成功');
  
  // 检查配置文件
  console.log('📋 检查配置文件...');
  const configPath = './src/config/constants.js';
  const constants = await import(configPath);
  console.log('✅ 配置文件加载成功');
  
  console.log('🎉 基础检查通过！');
  
} catch (error) {
  console.error('❌ 检查失败:', error.message);
  process.exit(1);
}