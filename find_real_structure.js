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
    
    // 直接查询 profiles 表
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(1)

    if (error) {
      console.log('❌ 查询失败:', error.message)
      
      // 尝试插入一个测试记录来查看错误信息
      console.log('🧪 尝试插入测试记录...')
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({ id: 'test-id', username: 'test' })
      
      if (insertError) {
        console.log('❌ 插入失败:', insertError.message)
        console.log('错误代码:', insertError.code)
      }
    } else {
      console.log('✅ 查询成功')
      if (data && data.length > 0) {
        console.log('📋 数据结构:', Object.keys(data[0]))
      } else {
        console.log('📋 表存在但没有数据')
      }
    }
  } catch (error) {
    console.error('❌ 出错:', error.message)
  }
}

checkStructure()