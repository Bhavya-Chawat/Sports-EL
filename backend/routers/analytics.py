from fastapi import APIRouter
from db.schema import get_connection
from engines.data_ingestion import get_data_source_info

router = APIRouter()


@router.get("/summary")
def executive_summary():
    conn = get_connection()
    try:
        total_players = conn.execute("SELECT COUNT(*) FROM players").fetchone()[0]
        total_teams   = conn.execute("SELECT COUNT(*) FROM teams").fetchone()[0]
        total_seasons = conn.execute(
            "SELECT COUNT(DISTINCT season) FROM historical_player_stats"
        ).fetchone()[0]
        total_records = conn.execute(
            "SELECT COUNT(*) FROM historical_player_stats"
        ).fetchone()[0]

        top_raiders = conn.execute(
            """SELECT player_name, team, attack_score, impact_score
               FROM players WHERE position = 'Raider'
               ORDER BY attack_score DESC LIMIT 10"""
        ).fetchall()

        top_defenders = conn.execute(
            """SELECT player_name, team, defense_score, impact_score
               FROM players WHERE position = 'Defender'
               ORDER BY defense_score DESC LIMIT 10"""
        ).fetchall()

        top_allrounders = conn.execute(
            """SELECT player_name, team, impact_score, attack_score, defense_score
               FROM players WHERE position = 'All-Rounder'
               ORDER BY impact_score DESC LIMIT 10"""
        ).fetchall()

        # Season trends (avg impact per season)
        season_trend = conn.execute(
            """SELECT season, AVG(stat_value) as avg_val
               FROM historical_player_stats
               WHERE stat_name = 'Player Total Points'
               GROUP BY season ORDER BY season"""
        ).fetchall()

        # Impact score distribution
        impact_dist = conn.execute(
            "SELECT impact_score FROM players ORDER BY impact_score"
        ).fetchall()

        return {
            "kpis": {
                "total_players": total_players,
                "total_teams":   total_teams,
                "total_seasons": total_seasons,
                "total_records": total_records,
            },
            "top_raiders":      [dict(r) for r in top_raiders],
            "top_defenders":    [dict(r) for r in top_defenders],
            "top_allrounders":  [dict(r) for r in top_allrounders],
            "season_trend":     [dict(r) for r in season_trend],
            "impact_distribution": [r[0] for r in impact_dist],
        }
    finally:
        conn.close()


@router.get("/top-performers")
def top_performers(position: str = "", season: str = "", limit: int = 20):
    conn = get_connection()
    try:
        q = "SELECT * FROM players WHERE 1=1"
        params = []
        if position:
            q += " AND position = ?"
            params.append(position)
        q += " ORDER BY impact_score DESC LIMIT ?"
        params.append(limit)
        return [dict(r) for r in conn.execute(q, params).fetchall()]
    finally:
        conn.close()


@router.get("/season-breakdown")
def season_breakdown():
    conn = get_connection()
    try:
        rows = conn.execute(
            """SELECT season, stat_name, AVG(stat_value) as avg_val, MAX(stat_value) as max_val
               FROM historical_player_stats
               GROUP BY season, stat_name
               ORDER BY season"""
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


@router.get("/ingestion-log")
def ingestion_log():
    conn = get_connection()
    try:
        logs = conn.execute(
            "SELECT * FROM ingestion_log ORDER BY id DESC LIMIT 100"
        ).fetchall()
        return {
            "data_source_info": get_data_source_info(),
            "logs": [dict(l) for l in logs],
        }
    finally:
        conn.close()
