"""
Performance Degradation Detector
Compares live match stats against historical baseline to detect
significant performance drops requiring coaching intervention.
"""

from db.schema import get_connection

SEVERITY_THRESHOLDS = {
    "MILD":     (0.05, 0.15),   # 5–15% drop
    "MODERATE": (0.15, 0.30),   # 15–30% drop
    "SEVERE":   (0.30, 1.00),   # >30% drop
}

MONITORED_METRICS = [
    {
        "key":         "raid_success_pct",
        "label":       "Raid Success Rate",
        "unit":        "%",
        "live_formula": lambda s: (s["successful_raids"] / s["raid_attempts"] * 100)
                                  if s["raid_attempts"] > 0 else None,
        "hist_stat":   "Player Successful Raid Percent",
        "min_attempts": 4,
    },
    {
        "key":         "tackle_success_pct",
        "label":       "Tackle Success Rate",
        "unit":        "%",
        "live_formula": lambda s: (s["successful_tackles"] / s["tackle_attempts"] * 100)
                                  if s["tackle_attempts"] > 0 else None,
        "hist_stat":   "Player Successful Tackle Percent",
        "min_attempts": 3,
    },
]


def _get_historical_baseline(conn, player_name: str, stat_name: str) -> float | None:
    """Get career average for a given stat."""
    row = conn.execute(
        """SELECT AVG(hps.stat_value)
           FROM historical_player_stats hps
           JOIN players p ON p.player_id = hps.player_id
           WHERE p.player_name = ? AND hps.stat_name = ?""",
        (player_name, stat_name)
    ).fetchone()
    return float(row[0]) if row and row[0] else None


def _classify_severity(drop_pct: float) -> str:
    for severity, (low, high) in SEVERITY_THRESHOLDS.items():
        if low <= drop_pct < high:
            return severity
    return "NONE"


def detect_degradation(session_id: str, overrides: dict = None) -> list:
    """
    Analyze all players in a session for performance degradation.
    overrides: dict of {player_name: {hist_stat: value}} for demo/manual baseline override.
    Returns list of alert objects sorted by severity.
    """
    conn = get_connection()
    alerts = []
    try:
        live_stats = conn.execute(
            "SELECT * FROM live_player_stats WHERE session_id = ?",
            (session_id,)
        ).fetchall()

        for row in live_stats:
            s = dict(row)
            player_name = s["player_name"]

            for metric in MONITORED_METRICS:
                # Check minimum attempts
                attempt_key = "raid_attempts" if "raid" in metric["key"] else "tackle_attempts"
                if s.get(attempt_key, 0) < metric["min_attempts"]:
                    continue

                # Compute live value
                live_val = metric["live_formula"](s)
                if live_val is None:
                    continue

                # Get historical baseline
                if overrides and player_name in overrides and metric["hist_stat"] in overrides[player_name]:
                    hist_val = overrides[player_name][metric["hist_stat"]]
                else:
                    hist_val = _get_historical_baseline(conn, player_name, metric["hist_stat"])

                if hist_val is None or hist_val == 0:
                    continue

                drop = (hist_val - live_val) / hist_val
                if drop <= 0.05:
                    continue  # Not degrading

                severity = _classify_severity(drop)
                if severity == "NONE":
                    continue

                alerts.append({
                    "player_name":  player_name,
                    "metric_key":   metric["key"],
                    "metric_label": metric["label"],
                    "historical":   round(hist_val, 1),
                    "current":      round(live_val, 1),
                    "drop_pct":     round(drop * 100, 1),
                    "severity":     severity,
                    "unit":         metric["unit"],
                    "attempts":     s.get(attempt_key, 0),
                })

    finally:
        conn.close()

    # Sort: SEVERE → MODERATE → MILD
    severity_order = {"SEVERE": 0, "MODERATE": 1, "MILD": 2}
    return sorted(alerts, key=lambda a: severity_order.get(a["severity"], 3))
