import { supabase, supabaseAdmin } from './src/config/supabase.js';

async function addMissingAchievementsFields() {
  console.log('🔧 添加achievements表缺失的字段...');
  
  try {
    // 检查当前表结构
    console.log('\n1️⃣ 检查当前achievements表结构...');
    const { data: columns, error: checkError } = await supabase
      .from('achievements')
      .select('*')
      .limit(0);
    
    if (checkError) {
      console.error('❌ 检查表结构失败:', checkError);
      return;
    }
    
    // 尝试添加缺失的字段
    const missingFields = [
      {
        name: 'instructor_id',
        type: 'UUID',
        description: '指导教师ID'
      },
      {
        name: 'reject_reason',
        type: 'TEXT',
        description: '打回原因'
      }
    ];
    
    console.log('\n2️⃣ 尝试添加缺失字段...');
    
    for (const field of missingFields) {
      console.log(`\n🔧 添加字段: ${field.name}`);
      
      // 使用SQL添加字段
      const sql = `ALTER TABLE achievements ADD COLUMN IF NOT EXISTS ${field.name} ${field.type}${field.type === 'TEXT' ? '' : ' REFERENCES users(id)'}`;
      
      try {
        const { error: alterError } = await supabaseAdmin.rpc('exec_sql', { 
          sql: sql 
        });
        
        if (alterError) {
          console.log(`⚠️ 无法通过RPC添加字段 ${field.name}:`, alterError.message);
          
          // 尝试使用直接SQL
          console.log(`🔧 尝试使用直接SQL添加字段...`);
          const directSql = `
            -- 添加 ${field.name} 字段
            ALTER TABLE achievements 
            ADD COLUMN IF NOT EXISTS ${field.name} ${field.type};
          `;
          
          // 写入SQL文件供手动执行
          const fs = await import('fs/promises');
          await fs.writeFile(`d:/Work/Project/add_${field.name}_field.sql`, directSql);
          console.log(`✅ 生成了SQL文件: add_${field.name}_field.sql`);
          
        } else {
          console.log(`✅ 字段 ${field.name} 添加成功`);
        }
      } catch (error) {
        console.log(`❌ 添加字段 ${field.name} 失败:`, error.message);
      }
    }
    
    // 创建approval_records表（如果不存在）
    console.log('\n3️⃣ 检查approval_records表...');
    
    const approvalRecordsSql = `
      -- 创建审批记录表
      CREATE TABLE IF NOT EXISTS approval_records (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
        reviewer_id UUID REFERENCES users(id),
        status INTEGER NOT NULL DEFAULT 0, -- 0: 驳回, 1: 通过
        feedback TEXT,
        reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- 创建索引
      CREATE INDEX IF NOT EXISTS idx_approval_records_achievement_id ON approval_records(achievement_id);
      CREATE INDEX IF NOT EXISTS idx_approval_records_reviewer_id ON approval_records(reviewer_id);
      CREATE INDEX IF NOT EXISTS idx_approval_records_status ON approval_records(status);
    `;
    
    try {
      const fs = await import('fs/promises');
      await fs.writeFile('d:/Work/Project/create_approval_records_table.sql', approvalRecordsSql);
      console.log('✅ 生成了创建approval_records表的SQL文件');
    } catch (error) {
      console.error('❌ 创建SQL文件失败:', error);
    }
    
    console.log('\n🎯 修复建议:');
    console.log('1. 在Supabase Dashboard中执行生成的SQL文件');
    console.log('2. 或者使用Supabase CLI运行迁移');
    console.log('3. 确保RLS策略正确配置');
    
  } catch (error) {
    console.error('❌ 修复过程出错:', error);
  }
}

addMissingAchievementsFields();