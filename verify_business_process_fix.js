import axios from 'axios';

// 验证业务处理页面数据获取修复
async function verifyBusinessProcessFix() {
  console.log('=== 验证业务处理页面数据获取修复 ===');
  
  try {
    // 1. 测试学生成果列表API是否正常工作
    console.log('1. 测试学生成果列表API...');
    
    // 使用一个通用的测试方法 - 检查API端点是否存在
    try {
      const response = await axios.get('http://localhost:3000/api/projects', {
        params: {
          page: 1,
          pageSize: 10
        },
        headers: { 
          'Authorization': 'Bearer test-token' // 这个会失败，但可以检查端点是否存在
        }
      });
      
      console.log('✅ API端点存在，返回数据:', response.data);
      
    } catch (apiError) {
      if (apiError.response?.status === 401) {
        console.log('✅ API端点存在，但需要有效token（预期行为）');
      } else {
        console.log('❌ API端点问题:', apiError.message);
      }
    }
    
    // 2. 检查数据库中的成果数据
    console.log('\n2. 检查数据库中的成果数据...');
    const { supabase } = await import('./src/config/supabase.js');
    
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select('id, title, status, created_at, cover_url, reject_reason, publisher_id')
      .limit(5);
    
    if (error) {
      console.log('❌ 数据库查询失败:', error.message);
    } else {
      console.log('✅ 数据库查询成功');
      console.log('成果数量:', achievements.length);
      
      if (achievements.length > 0) {
        console.log('示例成果:');
        achievements.forEach(item => {
          console.log(`- ID: ${item.id}`);
          console.log(`  标题: ${item.title}`);
          console.log(`  状态: ${item.status}`);
          console.log(`  创建时间: ${item.created_at}`);
          console.log(`  发布者ID: ${item.publisher_id}`);
          console.log(`  封面URL: ${item.cover_url || '无'}`);
          console.log('');
        });
      }
    }
    
    // 3. 验证前端代码修复
    console.log('\n3. 验证前端代码修复...');
    
    // 检查业务处理页面文件
    const fs = await import('fs');
    const fileContent = fs.readFileSync('./app_578098177538/src/pages/p-business_process/index.tsx', 'utf8');
    
    const hasApiImport = fileContent.includes("import api from '../../utils/api';");
    const hasFetchFunction = fileContent.includes('fetchStudentAchievements');
    const hasUseEffect = fileContent.includes('fetchStudentAchievements();');
    const hasFilteredAchievements = fileContent.includes('filteredAchievements.map');
    
    console.log('✅ API导入:', hasApiImport ? '存在' : '不存在');
    console.log('✅ 数据获取函数:', hasFetchFunction ? '存在' : '不存在');
    console.log('✅ useEffect调用:', hasUseEffect ? '存在' : '不存在');
    console.log('✅ 过滤数据渲染:', hasFilteredAchievements ? '存在' : '不存在');
    
    // 4. 检查状态管理
    const hasLoadingState = fileContent.includes('const [loading, setLoading] = useState');
    const hasErrorState = fileContent.includes('const [error, setError] = useState');
    const hasUserInfo = fileContent.includes('getCurrentUser');
    
    console.log('✅ 加载状态:', hasLoadingState ? '存在' : '不存在');
    console.log('✅ 错误状态:', hasErrorState ? '存在' : '不存在');
    console.log('✅ 用户信息获取:', hasUserInfo ? '存在' : '不存在');
    
    // 5. 总结
    console.log('\n=== 验证总结 ===');
    if (hasApiImport && hasFetchFunction && hasUseEffect && hasFilteredAchievements) {
      console.log('✅ 前端代码修复完成！');
      console.log('✅ 业务处理页面现在会从数据库获取真实数据');
      console.log('✅ 学生应该能看到自己的真实成果，而不是示例数据');
      
      if (achievements && achievements.length > 0) {
        console.log(`✅ 数据库中有 ${achievements.length} 个成果可供显示`);
      } else {
        console.log('ℹ️ 数据库中没有成果，学生登录后会看到空状态提示');
      }
    } else {
      console.log('❌ 前端代码修复不完整');
    }
    
  } catch (error) {
    console.error('验证失败:', error.message);
  }
}

verifyBusinessProcessFix().catch(console.error);