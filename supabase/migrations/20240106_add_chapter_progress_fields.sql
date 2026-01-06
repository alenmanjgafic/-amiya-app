-- Migration: Add chapter-based progress fields to user_bite_progress
-- These support the new Content + Activity structure
-- Run this in the Supabase SQL Editor

-- Add content_completed field
ALTER TABLE user_bite_progress
ADD COLUMN IF NOT EXISTS content_completed BOOLEAN DEFAULT FALSE;

-- Add activity_completed field
ALTER TABLE user_bite_progress
ADD COLUMN IF NOT EXISTS activity_completed BOOLEAN DEFAULT FALSE;

-- Add timestamp fields for content and activity completion
ALTER TABLE user_bite_progress
ADD COLUMN IF NOT EXISTS content_completed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE user_bite_progress
ADD COLUMN IF NOT EXISTS activity_completed_at TIMESTAMP WITH TIME ZONE;

-- Add chapter_id alias column (maps to bite_id for clarity)
-- Note: We keep bite_id as the primary column for backwards compatibility
COMMENT ON COLUMN user_bite_progress.bite_id IS 'ID of the bite or chapter (used interchangeably)';

-- Create index for faster queries on completion status
CREATE INDEX IF NOT EXISTS idx_user_bite_progress_completion
ON user_bite_progress(user_id, series_id, content_completed, activity_completed);
