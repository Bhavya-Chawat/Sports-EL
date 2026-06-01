from fastapi import APIRouter
from db.schema import get_connection
from engines.similarity import get_pairwise_similarity, get_similarity_matrix

router = APIRouter()


@router.get("/compare")
def compare_players(player_a: int, player_b: int):
    conn = get_connection()
    try:
        pa = conn.execute("SELECT player_name, team, position, impact_score FROM players WHERE player_id=?", (player_a,)).fetchone()
        pb = conn.execute("SELECT player_name, team, position, impact_score FROM players WHERE player_id=?", (player_b,)).fetchone()
        if not pa or not pb:
            return {"error": "Player not found"}
        result = get_pairwise_similarity(player_a, player_b)
        result["player_a"] = dict(pa)
        result["player_b"] = dict(pb)
        return result
    finally:
        conn.close()


@router.get("/matrix")
def similarity_matrix(limit: int = 20):
    return get_similarity_matrix(limit)
