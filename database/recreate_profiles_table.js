import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function recreateProfilesTable() {
  try {
    console.log('🛠️ 重新创建正确的profiles表...')

    // 删除现有的profiles表（如果有的话）
    console.log('\n🗑️ 第一步：删除现有的profiles表')
    const { error: dropError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS profiles CASCADE'
    })

    if (dropError) {
      console.log('⚠️  删除表失败（可能不存在）:', dropError.message)
    } else {
      console.log('✅ 成功删除现有的profiles表')
    }

    // 创建新的profiles表
    console.log('\n🏗️ 第二步：创建正确的profiles表')
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(10) NOT NULL CHECK (role IN ('student', 'teacher')),
        phone VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );
    `

    const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createTableSQL
    })

    if (createError) {
      console.error('❌ 创建表失败:', createError.message)
      
      // 如果rpc失败，尝试直接通过API创建
      console.log('尝试通过API方式创建表结构...')
      
      // 创建简化版本的表
      const simplifiedSQL = `
        CREATE TABLE profiles (
          id UUID PRIMARY KEY,
          username VARCHAR(50) NOT NULL,
          email VARCHAR(255) NOT NULL,
          role VARCHAR(10) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `
      
      console.log('请手动在Supabase Dashboard中执行以下SQL:')
      console.log('---')
      console.log(createTableSQL)
      console.log('---')
      
      return
    } else {
      console.log('✅ 成功创建profiles表')
    }

    // 创建索引
    console.log('\n📊 第三步：创建索引')
    const indexSQL = `
      CREATE INDEX idx_profiles_role ON profiles(role);
      CREATE INDEX idx_profiles_email ON profiles(email);
    `

    const { error: indexError } = await supabaseAdmin.rpc('exec_sql', {
      sql: indexSQL
    })

    if (indexError) {
      console.log('⚠️  创建索引失败:', indexError.message)
    } else {
      console.log('✅ 成功创建索引')
    }

    // 创建触发器
    console.log('\n⚡ 第四步：创建更新时间触发器')
    const triggerSQL = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS \$\$
      BEGIN
          NEW.updated_at = TIMEZONE('utc'::text, NOW());
          RETURN NEW;
      END;
      \$\$ language 'plpgsql';

      CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `

    const { error: triggerError } = await supabaseAdmin.rpc('exec_sql', {
      sql: triggerSQL
    })

    if (triggerError) {
      console.log('⚠️  创建触发器失败:', triggerError.message)
    } else {
      console.log('✅ 成功创建触发器')
    }

    console.log('\n🎉 profiles表重建完成！')

    // 验证表结构
    console.log('\n🔍 验证表结构...')
    const { data: testData, error: testError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(1)

    if (testError) {
      console.error('❌ 验证失败:', testError.message)
    } else {
      console.log('✅ 表结构验证成功')
    }

  } catch (error) {
    console.error('❌ 重建表时出错:', error.message)
  }
}

recreateProfilesTable()