import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// 使用服务端密钥
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixRegistrationIssue() {
  try {
    console.log('🛠️ 开始修复注册问题...')

    // 第一步：检查当前profiles表的列结构
    console.log('\n📋 第一步：检查profiles表结构')
    const { data: tableData, error: tableError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(1)

    if (tableError) {
      console.error('❌ 查询profiles表失败:', tableError.message)
      return
    }

    console.log('✅ profiles表存在')
    if (tableData && tableData.length > 0) {
      console.log('列结构:', Object.keys(tableData[0]))
    }

    // 第二步：检查RLS策略
    console.log('\n🔒 第二步：检查RLS策略')
    
    // 由于无法直接查询系统表，我们尝试插入测试
    const testUserId = 'test-fix-' + Date.now()
    const { error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: testUserId,
        username: '修复测试',
        email: 'fixtest@example.com',
        role: 'student'
      })

    if (insertError) {
      console.log('❌ 插入失败，说明RLS策略有问题:', insertError.message)
      
      // 第三步：使用服务端权限直接插入缺失的profile记录
      console.log('\n🚀 第三步：修复缺失的profile记录')
      
      // 获取刚注册的用户信息
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (listError) {
        console.error('❌ 获取用户列表失败:', listError.message)
        return
      }

      console.log(`找到 ${users.length} 个auth用户`)
      
      let fixedCount = 0
      for (const user of users) {
        // 检查是否已有对应的profile
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!existingProfile) {
          // 创建缺失的profile记录
          const { error: createError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: user.id,
              username: user.user_metadata?.username || '未知用户',
              email: user.email,
              role: user.user_metadata?.role || 'student'
            })

          if (createError) {
            console.error(`❌ 为用户 ${user.email} 创建profile失败:`, createError.message)
          } else {
            console.log(`✅ 为用户 ${user.email} 创建profile成功`)
            fixedCount++
          }
        }
      }

      console.log(`\n🎉 修复完成！共修复 ${fixedCount} 个用户的profile记录`)
      
    } else {
      console.log('✅ 插入测试成功，RLS策略正常')
      // 清理测试数据
      await supabaseAdmin.from('profiles').delete().eq('id', testUserId)
    }

    // 第四步：验证修复结果
    console.log('\n✅ 第四步：验证修复结果')
    const { data: finalProfiles, error: finalError } = await supabaseAdmin
      .from('profiles')
      .select('*')

    if (finalError) {
      console.error('❌ 验证失败:', finalError.message)
    } else {
      console.log(`✅ profiles表现在有 ${finalProfiles.length} 条记录`)
      if (finalProfiles.length > 0) {
        console.log('最新的profile:', finalProfiles[finalProfiles.length - 1])
      }
    }

  } catch (error) {
    console.error('❌ 修复过程出错:', error.message)
  }
}

fixRegistrationIssue()