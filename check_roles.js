import { supabase } from './src/config/supabase.js'

async function checkRoles() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, role')
      .limit(5)
    
    if (error) {
      console.error('Error:', error)
    } else {
      console.log('Users and roles:')
      data.forEach(user => {
        console.log('ID:', user.id, 'Username:', user.username, 'Role:', user.role, 'RoleType:', typeof user.role)
      })
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

checkRoles().then(() => {
  process.exit(0)
}).catch(err => {
  console.error(err)
  process.exit(1)
})