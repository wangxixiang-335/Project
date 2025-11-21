
            -- 添加 instructor_id 字段
            ALTER TABLE achievements 
            ADD COLUMN IF NOT EXISTS instructor_id UUID;
          