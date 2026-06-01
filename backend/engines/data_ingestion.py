"""
Data Ingestion Engine
Excel → SQLite pipeline with data source tracking.
Auto-detects real vs synthetic data and logs all activity.
"""

import os
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime

from db.schema import get_connection, init_schema, execute_many
from demo.synthetic_data import build_synthetic_excel

EXCEL_PATH = Path(__file__).parent.parent / "data" / "PKL_Organized_Dataset.xlsx"
SYNTHETIC_PATH = Path(__file__).parent.parent / "data" / "PKL_Synthetic_Dataset.xlsx"

# Global state — what data source is active
_data_source_info = {
    "source": "NONE",
    "file": None,
    "players_loaded": 0,
    "teams_loaded": 0,
    "seasons_loaded": 0,
    "records_loaded": 0,
    "last_ingested": None,
    "log": [],
}


def _log(level: str, message: str):
    ts = datetime.now().strftime("%H:%M:%S")
    entry = {"time": ts, "level": level, "message": message}
    _data_source_info["log"].append(entry)
    try:
        print(f"[{ts}] [{level}] {message}")
    except UnicodeEncodeError:
        safe_message = message.encode("ascii", errors="replace").decode("ascii")
        print(f"[{ts}] [{level}] {safe_message}")

    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO ingestion_log (logged_at, level, message, data_source) VALUES (?, ?, ?, ?)",
            (datetime.now().isoformat(), level, message, _data_source_info["source"])
        )
        conn.commit()
    finally:
        conn.close()


def get_data_source_info():
    return _data_source_info


def _detect_source():
    """Check if real Excel file exists."""
    if EXCEL_PATH.exists() and EXCEL_PATH.stat().st_size > 0:
        return "REAL", EXCEL_PATH
    return "SYNTHETIC", SYNTHETIC_PATH


def _ensure_synthetic():
    """Build synthetic dataset if it doesn't exist."""
    if not SYNTHETIC_PATH.exists():
        _log("INFO", "Generating synthetic PKL dataset (real file not found)...")
        stats = build_synthetic_excel(str(SYNTHETIC_PATH))
        _log("INFO", f"Synthetic dataset created: {stats['players']} players, "
                     f"{stats['seasons']} seasons, {stats['rows']} stat records")
    else:
        _log("INFO", "Synthetic dataset already exists — skipping generation")


def _load_excel(path: Path):
    """Load and validate the Excel file."""
    _log("INFO", f"Reading Excel: {path.name}")
    xl = pd.ExcelFile(path)
    sheets = xl.sheet_names
    _log("INFO", f"Sheets found: {sheets}")

    player_df = xl.parse("Player_Stats")
    team_df   = xl.parse("Team_Stats")
    rankings_df = xl.parse("Rankings")

    _log("INFO", f"Player_Stats: {len(player_df)} rows | "
                 f"Team_Stats: {len(team_df)} rows | "
                 f"Rankings: {len(rankings_df)} rows")

    return player_df, team_df, rankings_df


def _ingest_players(player_df: pd.DataFrame):
    """Populate players and historical_player_stats tables."""
    conn = get_connection()
    try:
        # Clear existing data
        conn.execute("DELETE FROM historical_player_stats")
        conn.execute("DELETE FROM players")
        conn.commit()

        players = player_df[["Player", "Team", "Position"]].drop_duplicates("Player")
        count = 0
        for _, row in players.iterrows():
            conn.execute(
                "INSERT OR IGNORE INTO players (player_name, team, position) VALUES (?, ?, ?)",
                (row["Player"], row["Team"], row["Position"])
            )
            count += 1
        conn.commit()
        _log("INFO", f"Inserted {count} unique players")

        # Bulk insert stats
        stat_rows = []
        for _, row in player_df.iterrows():
            player_id = conn.execute(
                "SELECT player_id FROM players WHERE player_name = ?", (row["Player"],)
            ).fetchone()
            if player_id:
                stat_rows.append((
                    player_id[0], str(row["Season"]), str(row["Stat"]),
                    float(row["Value"]) if pd.notna(row["Value"]) else 0.0
                ))

        conn.executemany(
            "INSERT OR REPLACE INTO historical_player_stats (player_id, season, stat_name, stat_value) VALUES (?, ?, ?, ?)",
            stat_rows
        )
        conn.commit()
        _log("INFO", f"Inserted {len(stat_rows)} player stat records")
        return len(players), len(stat_rows)
    finally:
        conn.close()


def _ingest_teams(team_df: pd.DataFrame):
    """Populate teams and historical_team_stats tables."""
    conn = get_connection()
    try:
        conn.execute("DELETE FROM historical_team_stats")
        conn.execute("DELETE FROM teams")
        conn.commit()

        teams = team_df["Team"].unique()
        for team in teams:
            conn.execute("INSERT OR IGNORE INTO teams (team_name) VALUES (?)", (team,))
        conn.commit()
        _log("INFO", f"Inserted {len(teams)} teams")

        stat_rows = []
        for _, row in team_df.iterrows():
            team_id = conn.execute(
                "SELECT team_id FROM teams WHERE team_name = ?", (row["Team"],)
            ).fetchone()
            if team_id:
                stat_rows.append((
                    team_id[0], str(row["Season"]), str(row["Stat"]),
                    float(row["Value"]) if pd.notna(row["Value"]) else 0.0
                ))

        conn.executemany(
            "INSERT OR REPLACE INTO historical_team_stats (team_id, season, stat_name, stat_value) VALUES (?, ?, ?, ?)",
            stat_rows
        )
        conn.commit()
        _log("INFO", f"Inserted {len(stat_rows)} team stat records")
        return len(teams), len(stat_rows)
    finally:
        conn.close()


def ingest():
    """Main ingestion entry point — called at server startup."""
    global _data_source_info
    init_schema()

    source, path = _detect_source()
    _data_source_info["source"] = source
    _data_source_info["file"] = path.name

    if source == "REAL":
        _log("INFO", f"✅ REAL DATA DETECTED: {path.name}")
    else:
        _log("WARNING", f"⚠️  REAL DATA NOT FOUND at {EXCEL_PATH}")
        _log("WARNING", "🔄 Using SYNTHETIC data. Drop PKL_Organized_Dataset.xlsx in backend/data/ to switch.")
        _ensure_synthetic()

    try:
        player_df, team_df, rankings_df = _load_excel(path)

        num_players, player_records = _ingest_players(player_df)
        num_teams, team_records     = _ingest_teams(team_df)

        seasons = player_df["Season"].nunique()
        _data_source_info.update({
            "players_loaded": num_players,
            "teams_loaded": num_teams,
            "seasons_loaded": seasons,
            "records_loaded": player_records + team_records,
            "last_ingested": datetime.now().isoformat(),
        })

        # Trigger impact score computation
        from engines.impact_score import compute_all_impact_scores
        _log("INFO", "Computing impact scores...")
        compute_all_impact_scores()
        _log("INFO", "✅ Ingestion complete")

    except Exception as e:
        _log("ERROR", f"Ingestion failed: {e}")
        raise
