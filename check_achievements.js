import { supabase } from './src/config/supabase.js'

async function checkAchievementsTable() {
  try {
    // 先尝试查询一行数据来查看返回的字段
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Query error:', error)
    } else if (data && data.length > 0) {
      console.log('Available fields in achievements table:')
      Object.keys(data[0]).forEach(key => {
        console.log('  -', key, ':', typeof data[0][key])
      })
    } else {
      console.log('No data found in achievements table')
      
      // 尝试查询表结构
      const { data: tableInfo, error: tableError } = await supabase
        .rpc('describe_table', { table_name: 'achievements' })
      
      if (tableError) {
        console.error('Table info error:', tableError)
      } else {
        console.log('Table structure:', tableInfo)
      }
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

checkAchievementsTable().then(() => {
  process.exit(0)
}).catch(err => {
  console.error(err)
  process.exit(1)
})