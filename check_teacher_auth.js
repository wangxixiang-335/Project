import { supabase } from './src/config/supabase.js'

async function checkTeacherAuth() {
  try {
    // 检查教师用户信息
    const { data: teacherData, error: teacherError } = await supabase
      .from('users')
      .select('id, username, role')
      .eq('role', 'teacher')
      .limit(3)
    
    if (teacherError) {
      console.error('查询教师用户错误:', teacherError)
    } else {
      console.log('教师用户信息:')
      teacherData.forEach(teacher => {
        console.log('ID:', teacher.id, 'Username:', teacher.username, 'Role:', teacher.role)
      })
    }
    
    // 检查是否有有效的token在localStorage中（模拟）
    console.log('\n注意：需要确保前端localStorage中有有效的JWT token')
    console.log('Token key: localStorage.getItem("token")')
    
  } catch (error) {
    console.error('检查错误:', error)
  }
}

checkTeacherAuth().then(() => {
  process.exit(0)
}).catch(err => {
  console.error(err)
  process.exit(1)
})