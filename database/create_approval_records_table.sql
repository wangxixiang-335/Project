
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
    