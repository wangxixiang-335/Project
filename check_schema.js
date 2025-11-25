import { supabase } from './src/config/supabase.js'

async function checkSchema() {
  try {
    // 尝试直接查询information_schema
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'achievements')
      .order('ordinal_position')
    
    if (schemaError) {
      console.error('Schema error:', schemaError)
    } else {
      console.log('Achievements table schema:')
      schemaData.forEach(col => {
        console.log(`${col.column_name}: ${col.data_type}`)
      })
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

checkSchema().then(() => {
  process.exit(0)
}).catch(err => {
  console.error(err)
  process.exit(1)
})