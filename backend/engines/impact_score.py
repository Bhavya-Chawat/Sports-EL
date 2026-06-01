"""
Impact Score Engine
Computes Attack Score, Defense Score, and Overall Impact Score
for every player using normalized historical stats.
"""

import numpy as np
from db.schema import get_connection

# Stat weights per dimension
ATTACK_WEIGHTS = {
    "Player Raid Points":            0.30,
    "Player Successful Raid Percent": 0.25,
    "Player Super Raids":            0.20,
    "Super 10s":                     0.15,
    "Player Avg Raid Points":        0.10,
}

DEFENSE_WEIGHTS = {
    "Player Tackle Points":           0.30,
    "Player Successful Tackle Percent": 0.25,
    "Player Super Tackles":           0.20,
    "High 5s":                        0.15,
    "Player Avg Tackle Points":       0.10,
}

# Position-based weighting of attack vs defense contribution
POSITION_WEIGHTS = {
    "Raider":      (0.80, 0.20),
    "Defender":    (0.20, 0.80),
    "All-Rounder": (0.55, 0.45),
}


def _normalize(values: list) -> list:
    """Min-max normalize a list of floats to [0, 100]."""
    arr = np.array(values, dtype=float)
    mn, mx = arr.min(), arr.max()
    if mx == mn:
        return [50.0] * len(arr)
    return ((arr - mn) / (mx - mn) * 100).tolist()


def _get_player_career_avg(conn, player_id: int, stat_name: str) -> float:
    """Return career average for a given stat."""
    row = conn.execute(
        "SELECT AVG(stat_value) FROM historical_player_stats WHERE player_id=? AND stat_name=?",
        (player_id, stat_name)
    ).fetchone()
    return float(row[0]) if row and row[0] is not None else 0.0


def compute_all_impact_scores():
    """Compute and store impact scores for all players."""
    conn = get_connection()
    try:
        players = conn.execute(
            "SELECT player_id, player_name, position FROM players"
        ).fetchall()

        if not players:
            return

        # Collect raw stats for all players first (for normalization)
        raw_attack  = {stat: [] for stat in ATTACK_WEIGHTS}
        raw_defense = {stat: [] for stat in DEFENSE_WEIGHTS}
        player_ids  = []

        for p in players:
            pid = p[0]
            player_ids.append(pid)
            for stat in ATTACK_WEIGHTS:
                raw_attack[stat].append(_get_player_career_avg(conn, pid, stat))
            for stat in DEFENSE_WEIGHTS:
                raw_defense[stat].append(_get_player_career_avg(conn, pid, stat))

        # Normalize each stat dimension across all players
        norm_attack  = {stat: _normalize(vals) for stat, vals in raw_attack.items()}
        norm_defense = {stat: _normalize(vals) for stat, vals in raw_defense.items()}

        # Compute scores per player
        for i, p in enumerate(players):
            pid, _, position = p[0], p[1], p[2]
            pos = position if position in POSITION_WEIGHTS else "All-Rounder"

            attack_score = sum(
                norm_attack[stat][i] * w for stat, w in ATTACK_WEIGHTS.items()
            )
            defense_score = sum(
                norm_defense[stat][i] * w for stat, w in DEFENSE_WEIGHTS.items()
            )

            atk_w, def_w = POSITION_WEIGHTS[pos]
            impact_score = attack_score * atk_w + defense_score * def_w

            conn.execute(
                """UPDATE players
                   SET attack_score=?, defense_score=?, impact_score=?
                   WHERE player_id=?""",
                (round(attack_score, 2), round(defense_score, 2),
                 round(impact_score, 2), pid)
            )

        conn.commit()
    finally:
        conn.close()


def get_player_impact_breakdown(player_id: int) -> dict:
    """Return detailed impact score breakdown for a single player."""
    conn = get_connection()
    try:
        player = conn.execute(
            "SELECT player_name, position, impact_score, attack_score, defense_score FROM players WHERE player_id=?",
            (player_id,)
        ).fetchone()
        if not player:
            return {}

        breakdown = {
            "player_name": player[0],
            "position": player[1],
            "impact_score": player[2],
            "attack_score": player[3],
            "defense_score": player[4],
            "attack_components": {},
            "defense_components": {},
        }

        for stat, weight in ATTACK_WEIGHTS.items():
            val = _get_player_career_avg(conn, player_id, stat)
            breakdown["attack_components"][stat] = {"raw": round(val, 2), "weight": weight}

        for stat, weight in DEFENSE_WEIGHTS.items():
            val = _get_player_career_avg(conn, player_id, stat)
            breakdown["defense_components"][stat] = {"raw": round(val, 2), "weight": weight}

        return breakdown
    finally:
        conn.close()
