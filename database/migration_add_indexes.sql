-- Migration: Add Database Indexes for Performance Optimization
-- This migration adds indexes to frequently queried columns to improve query performance

-- Indexes for competitions table
-- Note: competitions table only has: id, name, status, total_boulders, created_at, updated_at
CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);
CREATE INDEX IF NOT EXISTS idx_competitions_created_at ON competitions(created_at DESC);

-- Indexes for climbers table (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_climbers_competition_id ON climbers(competition_id);
CREATE INDEX IF NOT EXISTS idx_climbers_bib_number ON climbers(bib_number);
CREATE INDEX IF NOT EXISTS idx_climbers_competition_bib ON climbers(competition_id, bib_number);

-- Indexes for scores table (critical for leaderboard queries)
CREATE INDEX IF NOT EXISTS idx_scores_competition_id ON scores(competition_id);
CREATE INDEX IF NOT EXISTS idx_scores_climber_id ON scores(climber_id);
CREATE INDEX IF NOT EXISTS idx_scores_boulder_number ON scores(boulder_number);
CREATE INDEX IF NOT EXISTS idx_scores_competition_climber ON scores(competition_id, climber_id);
CREATE INDEX IF NOT EXISTS idx_scores_competition_boulder ON scores(competition_id, boulder_number);
CREATE INDEX IF NOT EXISTS idx_scores_finalized ON scores(is_finalized);
-- Note: is_disqualified column may not exist in all databases (added via migration)
-- This index will be created only if the column exists

-- Indexes for speed_climbers table
CREATE INDEX IF NOT EXISTS idx_speed_climbers_competition_id ON speed_climbers(speed_competition_id);
CREATE INDEX IF NOT EXISTS idx_speed_climbers_bib_number ON speed_climbers(bib_number);

-- Indexes for speed_qualification_scores table
CREATE INDEX IF NOT EXISTS idx_speed_qual_competition_id ON speed_qualification_scores(speed_competition_id);
CREATE INDEX IF NOT EXISTS idx_speed_qual_climber_id ON speed_qualification_scores(climber_id);
CREATE INDEX IF NOT EXISTS idx_speed_qual_competition_climber ON speed_qualification_scores(speed_competition_id, climber_id);

-- Indexes for speed_finals_matches table
-- Note: speed_finals_matches uses 'stage' not 'round', and 'speed_competition_id' not 'competition_id'
CREATE INDEX IF NOT EXISTS idx_speed_finals_competition_id ON speed_finals_matches(speed_competition_id);
CREATE INDEX IF NOT EXISTS idx_speed_finals_stage ON speed_finals_matches(stage);
CREATE INDEX IF NOT EXISTS idx_speed_finals_climber_a ON speed_finals_matches(climber_a_id);
CREATE INDEX IF NOT EXISTS idx_speed_finals_climber_b ON speed_finals_matches(climber_b_id);
CREATE INDEX IF NOT EXISTS idx_speed_finals_competition_stage ON speed_finals_matches(speed_competition_id, stage);

-- Indexes for news table
-- Note: news table doesn't have 'published' column, using 'created_at' for sorting
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);

-- Indexes for schedules table
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_schedules_created_at ON schedules(created_at DESC);

-- Indexes for athletes table
CREATE INDEX IF NOT EXISTS idx_athletes_category ON athletes(category);

-- Indexes for audit_logs table (for querying audit trails)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Composite indexes for common query patterns
-- Leaderboard query optimization
-- Note: is_disqualified may not exist, so we'll create index without it first
CREATE INDEX IF NOT EXISTS idx_scores_leaderboard ON scores(competition_id, is_finalized, climber_id);

-- Speed qualification leaderboard
CREATE INDEX IF NOT EXISTS idx_speed_qual_leaderboard ON speed_qualification_scores(speed_competition_id, best_time);

-- Note: These indexes will improve query performance significantly, especially for:
-- - Leaderboard calculations
-- - Score lookups by competition/climber
-- - Filtering and sorting operations
-- 
-- Trade-off: Slightly slower INSERT/UPDATE operations, but much faster SELECT queries
-- This is acceptable for a read-heavy application like a competition scoring system

