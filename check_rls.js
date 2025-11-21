import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkRlsPolicies() {
  try {
    console.log('🔍 检查当前的RLS策略状态...')
    
    // 查询当前的RLS策略
    const { data: policies, error } = await supabase
      .rpc('get_policies', { table_name: 'profiles' })

    if (error) {
      console.log('尝试直接查询pg_policies表...')
      
      const { data: policyData, error: queryError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'profiles')

      if (queryError) {
        console.error('❌ 查询策略失败:', queryError.message)
      } else {
        console.log('📋 当前profiles表的RLS策略:')
        if (policyData && policyData.length > 0) {
          policyData.forEach(policy => {
            console.log(`- ${policy.policyname}: ${policy.cmd} - ${policy.qual || '无限制'}`)
          })
        } else {
          console.log('⚠️  profiles表没有RLS策略')
        }
      }
    }

    // 检查profiles表的RLS状态
    const { data: tableInfo, error: tableError } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('tablename', 'profiles')

    if (tableError) {
      console.error('❌ 查询表信息失败:', tableError.message)
    } else {
      console.log('\n📊 表的RLS状态:')
      if (tableInfo && tableInfo.length > 0) {
        console.log(`profiles表 RLS启用状态: ${tableInfo[0].rowsecurity}`)
      }
    }

    // 尝试手动插入一条记录测试
    console.log('\n🧪 测试插入记录到profiles表...')
    const testUserId = 'test-' + Date.now()
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: testUserId,
        username: '测试用户',
        email: 'test@example.com',
        role: 'student'
      })

    if (insertError) {
      console.error('❌ 插入测试记录失败:', insertError.message)
      console.log('错误详情:', insertError)
    } else {
      console.log('✅ 插入测试记录成功')
      // 清理测试数据
      await supabase.from('profiles').delete().eq('id', testUserId)
      console.log('🗑️  已清理测试数据')
    }

  } catch (error) {
    console.error('检查RLS策略时出错:', error.message)
  }
}

checkRlsPolicies()