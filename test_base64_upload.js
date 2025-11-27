import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试Base64图片上传
async function testBase64Upload() {
  try {
    // 读取测试图片并转换为base64
    const imagePath = path.join(__dirname, 'test-image.txt');
    let base64Data;
    
    if (fs.existsSync(imagePath)) {
      base64Data = fs.readFileSync(imagePath, 'utf8');
    } else {
      // 创建一个小的测试base64图片（1x1像素的红色PNG）
      base64Data = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    }
    
    console.log('测试Base64上传，数据长度:', base64Data.length);
    
    // 测试简化Base64上传（直接存储到数据库）
    console.log('\n=== 测试简化Base64上传 ===');
    try {
      const simpleResponse = await axios.post(
        'http://localhost:3000/api/upload-simple/base64-simple',
        {
          imageData: base64Data,
          fileName: 'test-image.png'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZjE4YzgxMS0wYTM5LTQ2NWItYWI0Zi01ZGIxNzlkZWVlZDYiLCJlbWFpbCI6InN0dWRlbnRAZXhhbXBsZS5jb20iLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTcwMzI2NDAwMCwiZXhwIjoxNzA1ODU2MDAwfQ.yJ0iQf1p6mZaP3k7c8bVQqR4Xq9yX1t6sX6qX9yX1t6s'
          }
        }
      );
      console.log('✅ 简化Base64上传成功:', simpleResponse.data);
    } catch (simpleError) {
      console.error('❌ 简化Base64上传失败:', simpleError.response?.data || simpleError.message);
    }
    
    // 测试标准Base64上传（存储到Storage）
    console.log('\n=== 测试标准Base64上传 ===');
    try {
      const standardResponse = await axios.post(
        'http://localhost:3000/api/upload/base64-image',
        {
          imageData: base64Data,
          fileName: 'test-image.png'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZjE4YzgxMS0wYTM5LTQ2NWItYWI0Zi01ZGIxNzlkZWVlZDYiLCJlbWFpbCI6InN0dWRlbnRAZXhhbXBsZS5jb20iLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTcwMzI2NDAwMCwiZXhwIjoxNzA1ODU2MDAwfQ.yJ0iQf1p6mZaP3k7c8bVQqR4Xq9yX1t6sX6qX9yX1t6s'
          }
        }
      );
      console.log('✅ 标准Base64上传成功:', standardResponse.data);
    } catch (standardError) {
      console.error('❌ 标准Base64上传失败:', standardError.response?.data || standardError.message);
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

// 运行测试
testBase64Upload().catch(console.error);