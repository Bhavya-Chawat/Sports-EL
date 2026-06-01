"""
Cosine Similarity Engine
Finds the most similar players based on normalized stat vectors.
"""

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from db.schema import get_connection

FEATURE_STATS = [
    "Player Raid Points",
    "Player Tackle Points",
    "Player Successful Raid Percent",
    "Player Successful Tackle Percent",
    "Player Super Raids",
    "Player Super Tackles",
    "Player Avg Raid Points",
    "Player Avg Tackle Points",
]


def _career_avg(conn, player_id: int, stat: str) -> float:
    row = conn.execute(
        "SELECT AVG(stat_value) FROM historical_player_stats WHERE player_id=? AND stat_name=?",
        (player_id, stat)
    ).fetchone()
    return float(row[0]) if row and row[0] else 0.0


def _build_feature_matrix():
    """Build normalized feature matrix for all players."""
    conn = get_connection()
    try:
        players = conn.execute(
            "SELECT player_id, player_name, team, position FROM players ORDER BY player_id"
        ).fetchall()

        player_list = [dict(p) for p in players]
        matrix = []
        for p in player_list:
            vec = [_career_avg(conn, p["player_id"], stat) for stat in FEATURE_STATS]
            matrix.append(vec)

        mat = np.array(matrix, dtype=float)
        # Normalize columns
        col_max = mat.max(axis=0)
        col_max[col_max == 0] = 1
        mat = mat / col_max

        return player_list, mat
    finally:
        conn.close()


def get_similar_players(player_id: int, top_n: int = 8):
    """Return top-N most similar players to the given player."""
    player_list, mat = _build_feature_matrix()

    # Find index of the target player
    idx = next((i for i, p in enumerate(player_list) if p["player_id"] == player_id), None)
    if idx is None:
        return []

    vec = mat[idx].reshape(1, -1)
    sims = cosine_similarity(vec, mat)[0]

    # Sort by similarity, exclude self
    ranked = sorted(
        [(i, float(sims[i])) for i in range(len(player_list)) if i != idx],
        key=lambda x: -x[1]
    )[:top_n]

    results = []
    for i, sim in ranked:
        p = player_list[i]
        results.append({
            "player_id": p["player_id"],
            "player_name": p["player_name"],
            "team": p["team"],
            "position": p["position"],
            "similarity_pct": round(sim * 100, 1),
        })
    return results


def get_pairwise_similarity(player_id_a: int, player_id_b: int) -> dict:
    """Compute detailed similarity between two specific players."""
    conn = get_connection()
    try:
        def get_vec(pid):
            return [_career_avg(conn, pid, stat) for stat in FEATURE_STATS]

        vec_a = np.array(get_vec(player_id_a), dtype=float)
        vec_b = np.array(get_vec(player_id_b), dtype=float)

        # Normalize
        max_ab = np.maximum(vec_a, vec_b)
        max_ab[max_ab == 0] = 1
        norm_a = vec_a / max_ab
        norm_b = vec_b / max_ab

        similarity = float(cosine_similarity(
            norm_a.reshape(1, -1), norm_b.reshape(1, -1)
        )[0][0])

        return {
            "similarity_pct": round(similarity * 100, 1),
            "feature_comparison": [
                {
                    "stat": stat,
                    "player_a": round(float(vec_a[i]), 2),
                    "player_b": round(float(vec_b[i]), 2),
                }
                for i, stat in enumerate(FEATURE_STATS)
            ]
        }
    finally:
        conn.close()


def get_similarity_matrix(limit: int = 20):
    """Return a partial similarity matrix for the heatmap visualizer."""
    conn = get_connection()
    try:
        players = conn.execute(
            "SELECT player_id, player_name FROM players ORDER BY impact_score DESC LIMIT ?",
            (limit,)
        ).fetchall()
        player_list = [dict(p) for p in players]

        matrix = []
        for p in player_list:
            vec = [_career_avg(conn, p["player_id"], stat) for stat in FEATURE_STATS]
            matrix.append(vec)

        mat = np.array(matrix, dtype=float)
        col_max = mat.max(axis=0)
        col_max[col_max == 0] = 1
        mat = mat / col_max

        sim_mat = cosine_similarity(mat)
        names = [p["player_name"] for p in player_list]

        return {
            "players": names,
            "matrix": sim_mat.tolist(),
        }
    finally:
        conn.close()
