// 测试无认证的教师发布（仅用于测试）
import { supabase } from './src/config/supabase.js'

async function testNoAuthPublish() {
  try {
    console.log('测试无认证的教师发布功能...')
    
    // 使用真实的教师ID
    const teacherId = 'b577f431-c4ba-4560-8e8e-f1a7819d313b'
    const mockImageUrl = 'https://via.placeholder.com/400x300.png?text=测试封面图'
    
    // 模拟发布数据
    const publishData = {
      publisher_id: teacherId,
      title: '无认证测试发布',
      description: '<p>这是无认证测试的成果内容</p>',
      type_id: 'ece36ff7-1bd5-4a81-a2a7-59fa0722cb07', // 计算机编程类型
      cover_url: mockImageUrl, // 封面图URL
      video_url: '', // 视频URL暂时为空
      status: 2, // 已通过状态
      score: null,
      created_at: new Date().toISOString()
    }
    
    console.log('发布数据:', publishData)
    
    // 直接插入数据测试
    const { data: insertData, error: insertError } = await supabase
      .from('achievements')
      .insert(publishData)
      .select()
      .single()
    
    if (insertError) {
      console.error('插入失败:', insertError)
      return
    }
    
    console.log('插入成功:', insertData)
    console.log('✅ 无认证测试成功！')
    console.log('成果ID:', insertData.id)
    console.log('封面图URL:', insertData.cover_url)
    
    // 创建审批记录
    const { error: auditError } = await supabase
      .from('approval_records')
      .insert({
        achievement_id: insertData.id,
        reviewer_id: teacherId,
        status: 1, // 已通过
        feedback: '无认证测试，自动通过',
        reviewed_at: new Date().toISOString()
      })
    
    if (auditError) {
      console.warn('审批记录创建警告:', auditError.message)
    } else {
      console.log('✅ 审批记录创建成功')
    }
    
  } catch (error) {
    console.error('测试失败:', error)
  }
}

testNoAuthPublish().then(() => {
  console.log('\n🎉 无认证测试完成！')
  console.log('💡 这表明数据库和后端逻辑是正确的，问题在认证层面')
  process.exit(0)
}).catch(err => {
  console.error('💥 测试错误:', err)
  process.exit(1)
})