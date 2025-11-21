import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function findCorrectStructure() {
  try {
    console.log('🔍 使用正确UUID格式查找profiles表结构...')
    
    // 生成有效的UUID
    const testId = '12345678-1234-1234-1234-123456789abc'
    
    // 方法1：查看是否能获取到任何数据
    console.log('📊 方法1：查看表中的所有数据')
    const { data: allData, error: allError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(10)

    if (allError) {
      console.log('查询所有数据失败:', allError.message)
    } else {
      console.log(`找到 ${allData.length} 条记录`)
      if (allData.length > 0) {
        console.log('第一条记录的结构:', Object.keys(allData[0]))
        console.log('第一条记录内容:', allData[0])
        return
      }
    }

    // 方法2：尝试不同的列名组合
    console.log('\n🔧 方法2：尝试不同的列名组合')
    
    const possibleStructures = [
      { id: testId },
      { id: testId, username: '测试用户' },
      { id: testId, name: '测试用户' },
      { id: testId, user_name: '测试用户' },
      { id: testId, display_name: '测试用户' },
      { id: testId, full_name: '测试用户' },
      { id: testId, username: '测试用户', email: 'test@example.com' },
      { id: testId, name: '测试用户', email: 'test@example.com' }
    ]
    
    for (let i = 0; i < possibleStructures.length; i++) {
      console.log(`尝试结构 ${i + 1}:`, possibleStructures[i])
      const { error } = await supabaseAdmin
        .from('profiles')
        .insert(possibleStructures[i])
      
      if (!error) {
        console.log('✅ 成功！正确的结构是:', possibleStructures[i])
        
        // 验证插入的数据
        const { data: insertedData } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', testId)
          .single()
        
        console.log('插入的数据:', insertedData)
        
        // 清理测试数据
        await supabaseAdmin.from('profiles').delete().eq('id', testId)
        return
      } else {
        console.log('❌ 失败:', error.message)
      }
    }

    // 方法3：检查是否有其他类似的表
    console.log('\n🔍 方法3：检查是否有其他用户相关的表')
    const possibleTables = ['users', 'user', 'accounts', 'account', 'user_profiles', 'user_profile']
    
    for (const tableName of possibleTables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (!error && data && data.length > 0) {
          console.log(`✅ 找到表 ${tableName}:`)
          console.log('列:', Object.keys(data[0]))
          console.log('示例数据:', data[0])
        }
      } catch (e) {
        // 忽略不存在的表
      }
    }

    console.log('\n⚠️  无法确定profiles表的正确结构')
    console.log('建议：请检查Supabase Dashboard中的表结构')

  } catch (error) {
    console.error('查找表结构时出错:', error.message)
  }
}

findCorrectStructure()