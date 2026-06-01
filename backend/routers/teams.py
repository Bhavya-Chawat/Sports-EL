from fastapi import APIRouter
from db.schema import get_connection

router = APIRouter()

@router.get("")
def list_teams():
    conn = get_connection()
    try:
        teams = conn.execute("SELECT * FROM teams").fetchall()
        result = []
        for t in teams:
            team = dict(t)
            stats = conn.execute(
                """SELECT season, stat_name, AVG(stat_value) as avg_val
                   FROM historical_team_stats WHERE team_id = ?
                   GROUP BY season, stat_name""",
                (team["team_id"],)
            ).fetchall()
            team["season_stats"] = [dict(s) for s in stats]
            result.append(team)
        return result
    finally:
        conn.close()


@router.get("/{team_id}")
def get_team(team_id: int):
    conn = get_connection()
    try:
        team = conn.execute(
            "SELECT * FROM teams WHERE team_id = ?", (team_id,)
        ).fetchone()
        if not team:
            return {"error": "Team not found"}

        stats = conn.execute(
            """SELECT season, stat_name, stat_value
               FROM historical_team_stats WHERE team_id = ?
               ORDER BY season""",
            (team_id,)
        ).fetchall()

        players = conn.execute(
            """SELECT player_id, player_name, position, impact_score, attack_score, defense_score
               FROM players WHERE team = ?
               ORDER BY impact_score DESC""",
            (dict(team)["team_name"],)
        ).fetchall()

        return {
            **dict(team),
            "stats": [dict(s) for s in stats],
            "players": [dict(p) for p in players],
        }
    finally:
        conn.close()


@router.get("/{team_id}/compare/{team_id_b}")
def compare_teams(team_id: int, team_id_b: int):
    conn = get_connection()
    try:
        def get_career_stats(tid):
            rows = conn.execute(
                """SELECT stat_name, AVG(stat_value) as avg_val
                   FROM historical_team_stats WHERE team_id = ?
                   GROUP BY stat_name""",
                (tid,)
            ).fetchall()
            return {r["stat_name"]: round(r["avg_val"], 2) for r in rows}

        team_a = dict(conn.execute("SELECT * FROM teams WHERE team_id = ?", (team_id,)).fetchone())
        team_b = dict(conn.execute("SELECT * FROM teams WHERE team_id = ?", (team_id_b,)).fetchone())

        return {
            "team_a": {**team_a, "stats": get_career_stats(team_id)},
            "team_b": {**team_b, "stats": get_career_stats(team_id_b)},
        }
    finally:
        conn.close()
