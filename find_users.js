import { supabase } from './src/config/supabase.js'

async function findUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, role')
      .limit(5)
    
    if (error) {
      console.error('Error:', error)
    } else {
      console.log('Users found:')
      data.forEach(user => {
        console.log('ID:', user.id, 'Username:', user.username, 'Role:', user.role)
      })
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

findUsers().then(() => {
  process.exit(0)
}).catch(err => {
  console.error(err)
  process.exit(1)
})