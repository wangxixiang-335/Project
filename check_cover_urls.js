import { supabase } from './src/config/supabase.js'

async function checkCoverUrls() {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('id, title, cover_url')
      .not('cover_url', 'is', null)
      .limit(5)
    
    if (error) {
      console.error('Error:', error)
    } else {
      console.log('Existing cover URLs:')
      data.forEach(item => {
        console.log('ID:', item.id, 'Title:', item.title, 'Cover URL:', item.cover_url)
      })
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

checkCoverUrls().then(() => {
  process.exit(0)
}).catch(err => {
  console.error(err)
  process.exit(1)
})