import { supabase } from './src/config/supabase.js'

async function testTeacherPublish() {
  try {
    // 先尝试登录获取token
    const { data: authData, error: authError } = await supabase
      .from('users')
      .select('id, username, role')
      .eq('role', 'teacher')
      .limit(1)
      .single()
    
    if (authError || !authData) {
      console.log('找到教师用户，使用真实教师ID进行测试')
      // 使用真实的教师ID - teacher1
      const teacherId = 'b577f431-c4ba-4560-8e8e-f1a7819d313b'
      
      // 模拟发布数据
      const publishData = {
        publisher_id: teacherId,
        title: '测试教师成果发布',
        description: '<p>这是一个测试成果内容</p>',
        type_id: 'ece36ff7-1bd5-4a81-a2a7-59fa0722cb07', // 计算机编程类型
        video_url: '',
        status: 2, // 已通过状态（根据数据库现有值）
        score: null,
        created_at: new Date().toISOString()
      }
      
      console.log('模拟发布数据:', publishData)
      
      // 直接插入数据测试
      const { data: insertData, error: insertError } = await supabase
        .from('achievements')
        .insert(publishData)
        .select()
        .single()
      
      if (insertError) {
        console.error('插入失败:', insertError)
      } else {
        console.log('插入成功:', insertData)
        
        // 创建审批记录
        const { error: auditError } = await supabase
          .from('approval_records')
          .insert({
            achievement_id: insertData.id,
            reviewer_id: teacherId,
            audit_result: 1,
            audit_time: new Date().toISOString(),
            reject_reason: '',
            score: null
          })
        
        if (auditError) {
          console.warn('审批记录创建警告:', auditError.message)
        } else {
          console.log('审批记录创建成功')
        }
      }
    } else {
      console.log('找到教师用户:', authData.username)
      // 这里可以添加实际的API调用测试
    }
    
  } catch (error) {
    console.error('测试失败:', error)
  }
}

testTeacherPublish().then(() => {
  console.log('测试完成')
  process.exit(0)
}).catch(err => {
  console.error('测试错误:', err)
  process.exit(1)
})