import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 从.env文件加载环境变量
import dotenv from 'dotenv'
dotenv.config({ path: join(__dirname, '../.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const jwtSecret = process.env.JWT_SECRET

if (!supabaseUrl || !supabaseKey || !jwtSecret) {
  console.error('缺少必要的环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUsersAndGenerateToken() {
  try {
    console.log('🔍 检查数据库用户...')
    
    // 检查教师用户
    const { data: teachers, error: teacherError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'teacher')
      .limit(3)
    
    if (teacherError) {
      console.error('❌ 查询教师失败:', teacherError.message)
    } else {
      console.log('✅ 教师用户列表:')
      teachers.forEach(teacher => {
        console.log(`  ID: ${teacher.id}, 用户名: ${teacher.username}, 邮箱: ${teacher.email}`)
      })
      
      if (teachers.length > 0) {
        // 为第一个教师生成token
        const teacher = teachers[0]
        const token = jwt.sign(
          { 
            id: teacher.id, 
            username: teacher.username, 
            role: teacher.role 
          },
          jwtSecret,
          { expiresIn: '24h' }
        )
        
        console.log('\n🔑 生成的教师Token:')
        console.log(token)
        console.log('\n📝 测试命令:')
        console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3000/api/review/pending`)
        
        // 直接测试API
        console.log('\n🧪 直接测试API...')
        const response = await fetch(`http://localhost:3000/api/review/pending`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        const result = await response.json()
        console.log('API测试结果:', result)
      }
    }
    
    // 检查学生用户
    const { data: students, error: studentError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'student')
      .limit(3)
    
    if (studentError) {
      console.error('❌ 查询学生失败:', studentError.message)
    } else {
      console.log('\n✅ 学生用户列表:')
      students.forEach(student => {
        console.log(`  ID: ${student.id}, 用户名: ${student.username}, 邮箱: ${student.email}`)
      })
    }
    
  } catch (error) {
    console.error('❌ 检查用户失败:', error)
  }
}

checkUsersAndGenerateToken()