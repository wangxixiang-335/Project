import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkStructure() {
  try {
    console.log('🔍 检查 profiles 表结构...')
    
    // 生成有效的UUID
    const testId = '550e8400-e29b-41d4-a716-446655440000'
    
    // 尝试插入只有必需字段的记录
    const { error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({ 
        id: testId,
        username: 'test_user'
      })

    if (insertError) {
      console.log('❌ 插入失败:', insertError.message)
      console.log('错误代码:', insertError.code)
      
      // 尝试插入带有所有可能需要的字段
      console.log('\n🧪 尝试插入完整字段...')
      const { error: fullError } = await supabaseAdmin
        .from('profiles')
        .insert({ 
          id: testId,
          username: 'test_user',
          email: 'test@example.com',
          role: 'student'
        })
      
      if (fullError) {
        console.log('❌ 完整字段插入也失败:', fullError.message)
        
        // 尝试最少的字段
        console.log('\n🧪 尝试只插入id和username...')
        const { error: minimalError } = await supabaseAdmin
          .from('profiles')
          .insert({ 
            id: testId,
            username: 'test_user',
            role: 'student'  // role可能是必需的
          })
        
        if (minimalError) {
          console.log('❌ 最少字段插入也失败:', minimalError.message)
        } else {
          console.log('✅ 最少字段插入成功')
          await supabaseAdmin.from('profiles').delete().eq('id', testId)
        }
      } else {
        console.log('✅ 完整字段插入成功')
        await supabaseAdmin.from('profiles').delete().eq('id', testId)
      }
    } else {
      console.log('✅ 插入成功，表结构正确')
      await supabaseAdmin.from('profiles').delete().eq('id', testId)
    }

  } catch (error) {
    console.error('❌ 出错:', error.message)
  }
}

checkStructure()