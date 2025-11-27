import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// 创建Supabase客户端实例
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// 创建服务端Supabase客户端（用于需要更高权限的操作）
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your-service-role-key' ? process.env.SUPABASE_SERVICE_ROLE_KEY : process.env.SUPABASE_ANON_KEY
)

// 验证配置
export const validateConfig = () => {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`缺少必要的环境变量: ${missing.join(', ')}`)
  }
}

// 存储桶名称配置
export const BUCKET_NAMES = {
  PROJECT_IMAGES: 'project-images',
  PROJECT_VIDEOS: 'project-videos'
}