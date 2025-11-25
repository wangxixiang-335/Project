import { supabase } from './src/config/supabase.js'

async function checkStatus() {
  try {
    // 查看现有的状态值
    const { data, error } = await supabase
      .from('achievements')
      .select('status')
      .limit(10)
    
    if (error) {
      console.error('Error:', error)
    } else {
      console.log('Existing status values:')
      const statusSet = new Set()
      data.forEach(item => {
        statusSet.add(item.status)
      })
      console.log(Array.from(statusSet))
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

checkStatus().then(() => {
  process.exit(0)
}).catch(err => {
  console.error(err)
  process.exit(1)
})