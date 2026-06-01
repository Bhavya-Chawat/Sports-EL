-- ==============================================================================
-- KABADDI_IQ DATABASE SCHEMA — POSTGRESQL / SUPABASE
-- Run this script in your Supabase SQL Editor to initialize all tables.
-- ==============================================================================

-- 1. Players Table
CREATE TABLE IF NOT EXISTS players (
    player_id     SERIAL PRIMARY KEY,
    player_name   TEXT NOT NULL UNIQUE,
    team          TEXT,
    position      TEXT,
    player_image  TEXT,
    impact_score  DOUBLE PRECISION DEFAULT 0,
    attack_score  DOUBLE PRECISION DEFAULT 0,
    defense_score DOUBLE PRECISION DEFAULT 0
);

-- 2. Teams Table
CREATE TABLE IF NOT EXISTS teams (
    team_id   SERIAL PRIMARY KEY,
    team_name TEXT NOT NULL UNIQUE,
    logo      TEXT
);

-- 3. Historical Player Stats Table
CREATE TABLE IF NOT EXISTS historical_player_stats (
    id         SERIAL PRIMARY KEY,
    player_id  INTEGER REFERENCES players(player_id) ON DELETE CASCADE,
    season     TEXT,
    stat_name  TEXT,
    stat_value DOUBLE PRECISION,
    UNIQUE(player_id, season, stat_name)
);

-- 4. Historical Team Stats Table
CREATE TABLE IF NOT EXISTS historical_team_stats (
    id         SERIAL PRIMARY KEY,
    team_id    INTEGER REFERENCES teams(team_id) ON DELETE CASCADE,
    season     TEXT,
    stat_name  TEXT,
    stat_value DOUBLE PRECISION,
    UNIQUE(team_id, season, stat_name)
);

-- 5. Live Match Sessions Table
CREATE TABLE IF NOT EXISTS live_match_sessions (
    session_id     TEXT PRIMARY KEY,
    created_at     TEXT,
    team_name      TEXT,
    opponent_name  TEXT,
    score_for      INTEGER DEFAULT 0,
    score_against  INTEGER DEFAULT 0,
    time_remaining INTEGER DEFAULT 40
);

-- 6. Playing Seven Roster Table
CREATE TABLE IF NOT EXISTS playing_seven (
    id          SERIAL PRIMARY KEY,
    session_id  TEXT REFERENCES live_match_sessions(session_id) ON DELETE CASCADE,
    player_name TEXT,
    position    TEXT
);

-- 7. Bench Players Table
CREATE TABLE IF NOT EXISTS bench_players (
    id          SERIAL PRIMARY KEY,
    session_id  TEXT REFERENCES live_match_sessions(session_id) ON DELETE CASCADE,
    player_name TEXT,
    position    TEXT
);

-- 8. Live Player Stats Table
CREATE TABLE IF NOT EXISTS live_player_stats (
    id                 SERIAL PRIMARY KEY,
    session_id         TEXT REFERENCES live_match_sessions(session_id) ON DELETE CASCADE,
    player_name        TEXT,
    raid_attempts      INTEGER DEFAULT 0,
    successful_raids   INTEGER DEFAULT 0,
    tackle_attempts    INTEGER DEFAULT 0,
    successful_tackles INTEGER DEFAULT 0,
    super_raids        INTEGER DEFAULT 0,
    super_tackles      INTEGER DEFAULT 0,
    UNIQUE(session_id, player_name)
);

-- 9. Substitution Recommendations Table
CREATE TABLE IF NOT EXISTS recommendations (
    recommendation_id TEXT PRIMARY KEY,
    session_id        TEXT REFERENCES live_match_sessions(session_id) ON DELETE CASCADE,
    out_player        TEXT,
    in_player         TEXT,
    reason            TEXT,
    confidence        DOUBLE PRECISION,
    mode              TEXT,
    impact_gain       DOUBLE PRECISION,
    created_at        TEXT
);

-- 10. Recommendation Outcomes Table
CREATE TABLE IF NOT EXISTS recommendation_outcomes (
    outcome_id            TEXT PRIMARY KEY,
    recommendation_id     TEXT REFERENCES recommendations(recommendation_id) ON DELETE CASCADE,
    accepted              INTEGER DEFAULT 0,
    points_scored_after   INTEGER DEFAULT 0,
    points_conceded_after INTEGER DEFAULT 0,
    successful            INTEGER DEFAULT 0,
    recorded_at           TEXT
);

-- 11. Database Ingestion Log Table
CREATE TABLE IF NOT EXISTS ingestion_log (
    id          SERIAL PRIMARY KEY,
    logged_at   TEXT,
    level       TEXT,
    message     TEXT,
    data_source TEXT
);

-- ==============================================================================
-- OPTIMIZATION INDEXES FOR REAL-TIME PERFORMANCE DATA
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);
CREATE INDEX IF NOT EXISTS idx_historical_player_stats_lookup ON historical_player_stats(player_id, stat_name);
CREATE INDEX IF NOT EXISTS idx_live_player_stats_lookup ON live_player_stats(session_id, player_name);
CREATE INDEX IF NOT EXISTS idx_recommendations_session ON recommendations(session_id);
