
            -- 添加 reject_reason 字段
            ALTER TABLE achievements 
            ADD COLUMN IF NOT EXISTS reject_reason TEXT;
          