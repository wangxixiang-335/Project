import { supabase } from './src/config/supabase.js'

async function findTypes() {
  try {
    const { data, error } = await supabase
      .from('achievement_types')
      .select('id, name')
      .limit(5)
    
    if (error) {
      console.error('Error:', error)
    } else {
      console.log('Achievement types found:')
      data.forEach(type => {
        console.log('ID:', type.id, 'Name:', type.name)
      })
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

findTypes().then(() => {
  process.exit(0)
}).catch(err => {
  console.error(err)
  process.exit(1)
})