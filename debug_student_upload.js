import { supabaseAdmin } from './src/config/supabase.js';

// 调试学生上传问题的详细分析
async function debugStudentUpload() {
  console.log('=== 调试学生上传问题 ===');
  
  try {
    // 1. 检查数据库连接
    console.log('1. 检查数据库连接...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('achievements')
      .select('count')
      .single();
    
    if (testError) {
      console.log('❌ 数据库连接失败:', testError.message);
      return;
    }
    console.log('✅ 数据库连接正常');
    
    // 2. 检查achievements表结构
    console.log('\n2. 检查achievements表结构...');
    const { data: tableData, error: tableError } = await supabaseAdmin
      .from('achievements')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ 查询achievements表失败:', tableError.message);
      return;
    }
    
    if (tableData && tableData.length > 0) {
      console.log('✅ achievements表结构正常');
      console.log('字段列表:', Object.keys(tableData[0]));
      console.log('示例数据:', tableData[0]);
    } else {
      console.log('ℹ️ achievements表为空');
    }
    
    // 3. 检查achievement_types表
    console.log('\n3. 检查achievement_types表...');
    const { data: typesData, error: typesError } = await supabaseAdmin
      .from('achievement_types')
      .select('*')
      .limit(5);
    
    if (typesError) {
      console.log('❌ 查询achievement_types表失败:', typesError.message);
    } else {
      console.log('✅ achievement_types表正常，数量:', typesData.length);
      if (typesData.length > 0) {
        console.log('示例类型:', typesData[0]);
      }
    }
    
    // 4. 检查user_images表（用于Base64上传）
    console.log('\n4. 检查user_images表...');
    const { data: userImagesData, error: userImagesError } = await supabaseAdmin
      .from('user_images')
      .select('count')
      .single();
    
    if (userImagesError) {
      console.log('❌ user_images表可能不存在:', userImagesError.message);
    } else {
      console.log('✅ user_images表存在');
    }
    
    // 5. 检查存储桶状态
    console.log('\n5. 检查存储桶状态...');
    try {
      const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
      if (bucketError) {
        console.log('❌ 存储桶列表查询失败:', bucketError.message);
      } else {
        console.log('现有存储桶:', buckets.map(b => b.id));
      }
    } catch (bucketExError) {
      console.log('❌ 存储桶查询异常:', bucketExError.message);
    }
    
    // 6. 创建一个测试学生用户
    console.log('\n6. 创建测试学生用户...');
    const testEmail = 'teststudentupload@example.com';
    const testPassword = 'test123456';
    
    try {
      // 首先检查用户是否已存在
      const { data: existingUser } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('email', testEmail)
        .single();
      
      let userId;
      if (existingUser) {
        console.log('ℹ️ 测试用户已存在:', testEmail);
        userId = existingUser.id;
      } else {
        // 创建新用户
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: testEmail,
          password: testPassword,
          email_confirm: true,
          user_metadata: {
            username: '测试上传学生',
            role: 'student'
          }
        });
        
        if (authError) {
          console.log('❌ 创建用户失败:', authError.message);
          return;
        }
        
        userId = authUser.user.id;
        console.log('✅ 创建测试用户成功:', testEmail, 'ID:', userId);
        
        // 创建profile记录
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: userId,
            username: '测试上传学生',
            email: testEmail,
            role: 'student',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (profileError) {
          console.log('❌ 创建profile失败:', profileError.message);
          return;
        }
        console.log('✅ 创建profile成功');
      }
      
      // 7. 模拟学生登录
      console.log('\n7. 模拟学生登录...');
      try {
        const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        });
        
        if (loginError) {
          console.log('❌ 登录失败:', loginError.message);
          return;
        }
        
        const token = loginData.session.access_token;
        console.log('✅ 登录成功');
        console.log('Token:', token.substring(0, 30) + '...');
        
        // 8. 测试Base64上传
        console.log('\n8. 测试Base64上传功能...');
        const testBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
        
        try {
          const { data: uploadData, error: uploadError } = await axios.post(
            'http://localhost:3000/api/upload-simple/base64-simple',
            {
              imageData: testBase64,
              fileName: 'test-image.png'
            },
            {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (uploadData && uploadData.success) {
            console.log('✅ Base64上传成功:', uploadData.data);
          } else {
            console.log('❌ Base64上传失败:', uploadData);
          }
          
        } catch (uploadExError) {
          console.log('❌ Base64上传异常:', uploadExError.response?.data || uploadExError.message);
        }
        
        // 9. 测试成果提交
        console.log('\n9. 测试成果提交...');
        
        // 获取成果类型
        const { data: typesData } = await axios.get('http://localhost:3000/api/achievement-types', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (typesData.success && typesData.data.length > 0) {
          const submitData = {
            title: '调试测试成果-' + new Date().toISOString(),
            content_html: '<p>这是一个调试测试成果的内容</p>',
            video_url: testBase64,
            category: typesData.data[0].id
          };
          
          console.log('提交数据:', {
            ...submitData,
            video_url: submitData.video_url.substring(0, 50) + '...'
          });
          
          try {
            const { data: submitDataResult, error: submitError } = await axios.post(
              'http://localhost:3000/api/projects',
              submitData,
              {
                headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            if (submitDataResult && submitDataResult.success) {
              console.log('✅ 成果提交成功:', submitDataResult.data);
              
              // 验证成果
              const projectId = submitDataResult.data.project_id;
              const { data: verifyData } = await axios.get(`http://localhost:3000/api/projects/${projectId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              if (verifyData.success) {
                console.log('✅ 成果验证成功');
                console.log('封面图URL:', verifyData.data.cover_url);
                console.log('视频图URL:', verifyData.data.video_url);
              }
            } else {
              console.log('❌ 成果提交失败:', submitDataResult);
            }
            
          } catch (submitExError) {
            console.log('❌ 成果提交异常:', submitExError.response?.data || submitExError.message);
          }
        }
        
      } catch (loginExError) {
        console.log('❌ 登录异常:', loginExError.message);
      }
      
    } catch (userExError) {
      console.log('❌ 用户创建异常:', userExError.message);
    }
    
    console.log('\n=== 调试完成 ===');
    console.log('建议：');
    console.log('1. 检查控制台日志中的具体错误信息');
    console.log('2. 确认数据库表结构和权限设置');
    console.log('3. 验证前端上传逻辑是否正确处理Base64数据');
    console.log('4. 如果Base64上传失败，前端应该直接使用Base64数据作为URL');
    
  } catch (error) {
    console.error('调试失败:', error.message);
  }
}

debugStudentUpload().catch(console.error);