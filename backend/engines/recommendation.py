"""
Substitution Recommendation Engine
Generates optimal substitution recommendations based on:
- Current performance degradation
- Bench player impact scores
- Match situation (mode)
- Historical success rates
"""

import uuid
from datetime import datetime

from db.schema import get_connection
from engines.degradation import detect_degradation

# Match situation thresholds
MODE_RULES = {
    "CLUTCH":   lambda diff, time: time <= 5,
    "ATTACK":   lambda diff, time: diff < -5,
    "DEFENSE":  lambda diff, time: diff > 5,
    "BALANCED": lambda diff, time: True,
}

CONFIDENCE_WEIGHTS = {
    "impact_diff":    0.40,
    "degradation":    0.30,
    "history":        0.20,
    "position_match": 0.10,
}


def _determine_mode(score_for: int, score_against: int, time_remaining: int) -> str:
    diff = score_for - score_against
    for mode, rule in MODE_RULES.items():
        if rule(diff, time_remaining):
            return mode
    return "BALANCED"


def _get_player_impact(conn, player_name: str) -> float:
    row = conn.execute(
        "SELECT impact_score FROM players WHERE player_name = ?", (player_name,)
    ).fetchone()
    return float(row[0]) if row and row[0] else 0.0


def _get_historical_success_rate(conn) -> float:
    """Get overall recommendation success rate from history."""
    row = conn.execute(
        """SELECT AVG(successful) FROM recommendation_outcomes WHERE accepted = 1"""
    ).fetchone()
    return float(row[0]) if row and row[0] else 0.5


def _score_bench_player(conn, bench_player: str, degraded_player: str,
                         mode: str, degradation_severity: str) -> dict:
    """Score a bench player as replacement for a degraded player."""
    bench_impact    = _get_player_impact(conn, bench_player)
    current_impact  = _get_player_impact(conn, degraded_player)
    impact_diff     = bench_impact - current_impact

    # Impact diff score (0-100): higher bench impact relative to current = better
    max_possible_diff = 100.0
    impact_diff_score = min(max(impact_diff / max_possible_diff, 0), 1)

    # Degradation score
    deg_scores = {"SEVERE": 1.0, "MODERATE": 0.65, "MILD": 0.35, "NONE": 0.0}
    deg_score = deg_scores.get(degradation_severity, 0.0)

    # History
    hist_rate = _get_historical_success_rate(conn)

    # Position match bonus (simplified)
    bench_pos = conn.execute(
        "SELECT position FROM players WHERE player_name = ?", (bench_player,)
    ).fetchone()
    current_pos = conn.execute(
        "SELECT position FROM players WHERE player_name = ?", (degraded_player,)
    ).fetchone()
    pos_bonus = 1.0 if (bench_pos and current_pos and bench_pos[0] == current_pos[0]) else 0.5

    confidence = (
        impact_diff_score  * CONFIDENCE_WEIGHTS["impact_diff"] +
        deg_score          * CONFIDENCE_WEIGHTS["degradation"] +
        hist_rate          * CONFIDENCE_WEIGHTS["history"] +
        pos_bonus          * CONFIDENCE_WEIGHTS["position_match"]
    ) * 100

    return {
        "bench_player":    bench_player,
        "bench_impact":    round(bench_impact, 1),
        "current_impact":  round(current_impact, 1),
        "impact_gain":     round(impact_diff, 1),
        "confidence":      round(min(confidence, 97.0), 1),
        "position_match":  bool(bench_pos and current_pos and bench_pos[0] == current_pos[0]),
    }


def generate_recommendations(session_id: str, overrides: dict = None) -> list:
    """
    Generate substitution recommendations for a live match session.
    Returns sorted list of recommendations (highest confidence first).
    """
    conn = get_connection()
    try:
        session = conn.execute(
            "SELECT * FROM live_match_sessions WHERE session_id = ?", (session_id,)
        ).fetchone()
        if not session:
            return []
        s = dict(session)

        mode = _determine_mode(s["score_for"], s["score_against"], s["time_remaining"])

        # Get degradation alerts
        alerts = detect_degradation(session_id, overrides=overrides)
        if not alerts:
            return []

        bench = conn.execute(
            "SELECT player_name FROM bench_players WHERE session_id = ?", (session_id,)
        ).fetchall()
        bench_names = [b[0] for b in bench]

        if not bench_names:
            return []

        recommendations = []
        seen_out = set()
        seen_in  = set()

        for alert in alerts:
            if alert["player_name"] in seen_out:
                continue

            # Score each bench player
            candidates = []
            for bench_player in bench_names:
                if bench_player in seen_in:
                    continue
                score = _score_bench_player(
                    conn, bench_player, alert["player_name"],
                    mode, alert["severity"]
                )
                candidates.append(score)

            if not candidates:
                continue

            best = max(candidates, key=lambda x: x["confidence"])

            reason = (
                f"{alert['metric_label']} dropped {alert['drop_pct']}% "
                f"(historical: {alert['historical']}{alert['unit']} → "
                f"current: {alert['current']}{alert['unit']}). "
                f"Bench player impact score is {best['impact_gain']:+.1f} higher."
            )

            rec_id = str(uuid.uuid4())
            conn.execute(
                """INSERT INTO recommendations
                   (recommendation_id, session_id, out_player, in_player, reason,
                    confidence, mode, impact_gain, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (rec_id, session_id, alert["player_name"], best["bench_player"],
                 reason, best["confidence"], mode, best["impact_gain"],
                 datetime.now().isoformat())
            )
            conn.commit()

            recommendations.append({
                "recommendation_id": rec_id,
                "out_player":        alert["player_name"],
                "in_player":         best["bench_player"],
                "out_impact":        best["current_impact"],
                "in_impact":         best["bench_impact"],
                "impact_gain":       best["impact_gain"],
                "confidence":        best["confidence"],
                "mode":              mode,
                "reason":            reason,
                "alert":             alert,
            })

            seen_out.add(alert["player_name"])
            seen_in.add(best["bench_player"])

        return sorted(recommendations, key=lambda r: -r["confidence"])

    finally:
        conn.close()


def record_outcome(recommendation_id: str, accepted: bool,
                   points_scored: int, points_conceded: int):
    """Store the outcome of a recommendation decision."""
    conn = get_connection()
    try:
        successful = 1 if accepted and points_scored > points_conceded else 0
        outcome_id = str(uuid.uuid4())
        conn.execute(
            """INSERT INTO recommendation_outcomes
               (outcome_id, recommendation_id, accepted, points_scored_after,
                points_conceded_after, successful, recorded_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (outcome_id, recommendation_id, int(accepted),
             points_scored, points_conceded, successful, datetime.now().isoformat())
        )
        conn.commit()
    finally:
        conn.close()
