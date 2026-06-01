from fastapi import APIRouter
from db.schema import get_connection
from engines.impact_score import get_player_impact_breakdown
from engines.similarity import get_similar_players

router = APIRouter()

@router.get("")
def list_players(search: str = "", position: str = "", limit: int = 100):
    conn = get_connection()
    try:
        q = "SELECT * FROM players WHERE 1=1"
        params = []
        if search:
            q += " AND LOWER(player_name) LIKE ?"
            params.append(f"%{search.lower()}%")
        if position:
            q += " AND position = ?"
            params.append(position)
        q += " ORDER BY impact_score DESC LIMIT ?"
        params.append(limit)
        rows = conn.execute(q, params).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


@router.get("/{player_id}")
def get_player(player_id: int):
    conn = get_connection()
    try:
        player = conn.execute(
            "SELECT * FROM players WHERE player_id = ?", (player_id,)
        ).fetchone()
        if not player:
            return {"error": "Player not found"}

        stats = conn.execute(
            """SELECT season, stat_name, stat_value
               FROM historical_player_stats WHERE player_id = ?
               ORDER BY season""",
            (player_id,)
        ).fetchall()

        breakdown = get_player_impact_breakdown(player_id)

        return {
            **dict(player),
            "stats": [dict(s) for s in stats],
            "impact_breakdown": breakdown,
        }
    finally:
        conn.close()


@router.get("/{player_id}/similar")
def similar_players(player_id: int, top_n: int = 8):
    return get_similar_players(player_id, top_n)


@router.get("/{player_id}/trend")
def player_trend(player_id: int):
    conn = get_connection()
    try:
        rows = conn.execute(
            """SELECT season, stat_name, stat_value
               FROM historical_player_stats WHERE player_id = ?
               ORDER BY season""",
            (player_id,)
        ).fetchall()
        data = {}
        for r in rows:
            s = r["season"]
            if s not in data:
                data[s] = {}
            data[s][r["stat_name"]] = r["stat_value"]
        return [{"season": k, **v} for k, v in sorted(data.items())]
    finally:
        conn.close()
