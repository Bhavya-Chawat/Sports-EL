"""
Database schema initialization and connection factory.
"""

import sqlite3
import os
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "database" / "kabaddi.db"


def get_connection():
    DB_PATH.parent.mkdir(exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_schema():
    conn = get_connection()
    cur = conn.cursor()
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS players (
            player_id     INTEGER PRIMARY KEY AUTOINCREMENT,
            player_name   TEXT NOT NULL UNIQUE,
            team          TEXT,
            position      TEXT,
            player_image  TEXT,
            impact_score  REAL DEFAULT 0,
            attack_score  REAL DEFAULT 0,
            defense_score REAL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS teams (
            team_id   INTEGER PRIMARY KEY AUTOINCREMENT,
            team_name TEXT NOT NULL UNIQUE,
            logo      TEXT
        );

        CREATE TABLE IF NOT EXISTS historical_player_stats (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id  INTEGER REFERENCES players(player_id),
            season     TEXT,
            stat_name  TEXT,
            stat_value REAL,
            UNIQUE(player_id, season, stat_name)
        );

        CREATE TABLE IF NOT EXISTS historical_team_stats (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            team_id    INTEGER REFERENCES teams(team_id),
            season     TEXT,
            stat_name  TEXT,
            stat_value REAL,
            UNIQUE(team_id, season, stat_name)
        );

        CREATE TABLE IF NOT EXISTS live_match_sessions (
            session_id     TEXT PRIMARY KEY,
            created_at     TEXT,
            team_name      TEXT,
            opponent_name  TEXT,
            score_for      INTEGER DEFAULT 0,
            score_against  INTEGER DEFAULT 0,
            time_remaining INTEGER DEFAULT 40
        );

        CREATE TABLE IF NOT EXISTS playing_seven (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id  TEXT REFERENCES live_match_sessions(session_id),
            player_name TEXT,
            position    TEXT
        );

        CREATE TABLE IF NOT EXISTS bench_players (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id  TEXT REFERENCES live_match_sessions(session_id),
            player_name TEXT,
            position    TEXT
        );

        CREATE TABLE IF NOT EXISTS live_player_stats (
            id                 INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id         TEXT REFERENCES live_match_sessions(session_id),
            player_name        TEXT,
            raid_attempts      INTEGER DEFAULT 0,
            successful_raids   INTEGER DEFAULT 0,
            tackle_attempts    INTEGER DEFAULT 0,
            successful_tackles INTEGER DEFAULT 0,
            super_raids        INTEGER DEFAULT 0,
            super_tackles      INTEGER DEFAULT 0,
            UNIQUE(session_id, player_name)
        );

        CREATE TABLE IF NOT EXISTS recommendations (
            recommendation_id TEXT PRIMARY KEY,
            session_id        TEXT REFERENCES live_match_sessions(session_id),
            out_player        TEXT,
            in_player         TEXT,
            reason            TEXT,
            confidence        REAL,
            mode              TEXT,
            impact_gain       REAL,
            created_at        TEXT
        );

        CREATE TABLE IF NOT EXISTS recommendation_outcomes (
            outcome_id            TEXT PRIMARY KEY,
            recommendation_id     TEXT REFERENCES recommendations(recommendation_id),
            accepted              INTEGER DEFAULT 0,
            points_scored_after   INTEGER DEFAULT 0,
            points_conceded_after INTEGER DEFAULT 0,
            successful            INTEGER DEFAULT 0,
            recorded_at           TEXT
        );

        CREATE TABLE IF NOT EXISTS ingestion_log (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            logged_at   TEXT,
            level       TEXT,
            message     TEXT,
            data_source TEXT
        );
    """)
    conn.commit()
    conn.close()


def execute_query(sql, params=(), fetch=None):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(sql, params)
        conn.commit()
        if fetch == "all":
            return [dict(r) for r in cur.fetchall()]
        elif fetch == "one":
            row = cur.fetchone()
            return dict(row) if row else None
        return cur.lastrowid
    finally:
        conn.close()


def execute_many(sql, params_list):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.executemany(sql, params_list)
        conn.commit()
    finally:
        conn.close()
