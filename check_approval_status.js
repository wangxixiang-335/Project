import { supabase } from './src/config/supabase.js'

async function checkApprovalStatus() {
  try {
    const { data, error } = await supabase
      .from('approval_records')
      .select('status')
      .limit(10)
    
    if (error) {
      console.error('Error:', error)
    } else {
      console.log('Existing approval status values:')
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

checkApprovalStatus().then(() => {
  process.exit(0)
}).catch(err => {
  console.error(err)
  process.exit(1)
})