import { supabase } from './src/config/supabase.js'

async function checkApprovalRecords() {
  try {
    const { data, error } = await supabase
      .from('approval_records')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Error:', error)
    } else if (data && data.length > 0) {
      console.log('Approval records fields:')
      Object.keys(data[0]).forEach(key => {
        console.log('  -', key, ':', typeof data[0][key])
      })
    } else {
      console.log('No data found in approval_records table')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

checkApprovalRecords().then(() => {
  process.exit(0)
}).catch(err => {
  console.error(err)
  process.exit(1)
})