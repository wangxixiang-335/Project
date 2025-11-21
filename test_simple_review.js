import express from 'express';
import { supabase } from './src/config/supabase.js';
import { successResponse, errorResponse } from './src/utils/response.js';
import { AUDIT_RESULTS } from './src/config/constants.js';
import axios from 'axios';

const app = express();
app.use(express.json());

// 添加认证中间件（简化版）
const simpleAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return errorResponse(res, '缺少认证令牌', 401);
    }
    
    // 这里简化处理，直接使用固定用户
    req.user = { id: '4706dd11-ba90-45ec-a4be-c3bb6d19b637' };
    next();
  } catch (error) {
    return errorResponse(res, '认证失败', 401);
  }
};

// 简化的评审接口
app.post('/simple-review/:id/audit', simpleAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { audit_result, reject_reason } = req.body;

    console.log('🔍 简化评审操作开始...');
    console.log('📋 参数:', { id, audit_result, reject_reason });

    // 1. 检查项目
    const { data: achievement, error: checkError } = await supabase
      .from('achievements')
      .select('*')
      .eq('id', id)
      .eq('status', 1)
      .single();

    if (checkError || !achievement) {
      console.log('❌ 项目不存在或不是待审核状态');
      return errorResponse(res, '项目不存在或不是待审核状态', 404);
    }

    console.log('✅ 找到项目:', achievement.title);

    // 2. 执行更新
    const updateData = {
      status: audit_result === 1 ? 2 : 3
    };

    if (audit_result === 2) {
      updateData.description = (achievement.description || '') + 
        `\n\n--- 审核打回原因 ---\n${reject_reason}`;
    }

    console.log('📝 更新数据:', updateData);

    const { data: updated, error: updateError } = await supabase
      .from('achievements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ 更新失败:', updateError);
      throw updateError;
    }

    console.log('✅ 更新成功:', updated.status);

    // 3. 返回结果
    const message = audit_result === 1 ? '项目审核通过' : '项目审核不通过';
    
    return successResponse(res, {
      project_id: updated.id,
      status: updated.status,
      audit_result,
      reject_reason: audit_result === 2 ? reject_reason : null
    }, message);

  } catch (error) {
    console.error('❌ 评审操作失败:', error);
    return errorResponse(res, '审核成果失败');
  }
});

// 测试函数
async function testSimpleReview() {
  console.log('🧪 测试简化评审接口...');
  
  const projectId = 'bc14260d-0281-4fdc-aa7e-46fbdf2be198';
  const baseUrl = 'http://localhost:3001';
  
  // 启动简化服务器
  const server = app.listen(3001, () => {
    console.log('🚀 简化测试服务器启动在端口 3001');
  });
  
  try {
    // 测试通过操作
    console.log('\n🟢 测试通过操作...');
    const approveResponse = await axios.post(`${baseUrl}/simple-review/${projectId}/audit`, {
      audit_result: 1
    }, {
      headers: { Authorization: 'Bearer test-token' }
    });
    
    console.log('✅ 通过操作成功:', approveResponse.data);
    
    // 重置状态
    await supabase
      .from('achievements')
      .update({ status: 1 })
      .eq('id', projectId);
    
    // 测试打回操作
    console.log('\n🔴 测试打回操作...');
    const rejectResponse = await axios.post(`${baseUrl}/simple-review/${projectId}/audit`, {
      audit_result: 2,
      reject_reason: '项目内容需要进一步完善'
    }, {
      headers: { Authorization: 'Bearer test-token' }
    });
    
    console.log('✅ 打回操作成功:', rejectResponse.data);
    
    console.log('\n🎉 简化评审接口测试成功！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  } finally {
    server.close();
    console.log('🛑 简化测试服务器已关闭');
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  testSimpleReview();
}

export default app;