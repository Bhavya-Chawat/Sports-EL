import uuid
from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

from db.schema import get_connection
from engines.degradation import detect_degradation
from engines.recommendation import generate_recommendations, record_outcome
from demo.demo_match import get_demo_payload

router = APIRouter()


class SessionCreate(BaseModel):
    team_name: str
    opponent_name: str
    score_for: int = 0
    score_against: int = 0
    time_remaining: int = 40


class PlayerEntry(BaseModel):
    player_name: str
    position: str


class LiveStatUpdate(BaseModel):
    player_name: str
    raid_attempts: int = 0
    successful_raids: int = 0
    tackle_attempts: int = 0
    successful_tackles: int = 0
    super_raids: int = 0
    super_tackles: int = 0


class ScoreUpdate(BaseModel):
    score_for: int
    score_against: int
    time_remaining: int


@router.post("/session")
def create_session(body: SessionCreate):
    session_id = str(uuid.uuid4())[:8].upper()
    conn = get_connection()
    try:
        conn.execute(
            """INSERT INTO live_match_sessions
               (session_id, created_at, team_name, opponent_name, score_for, score_against, time_remaining)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (session_id, datetime.now().isoformat(),
             body.team_name, body.opponent_name,
             body.score_for, body.score_against, body.time_remaining)
        )
        conn.commit()
        return {"session_id": session_id}
    finally:
        conn.close()


@router.get("/session/{session_id}")
def get_session(session_id: str):
    conn = get_connection()
    try:
        session = conn.execute(
            "SELECT * FROM live_match_sessions WHERE session_id = ?", (session_id,)
        ).fetchone()
        if not session:
            return {"error": "Session not found"}

        playing = conn.execute(
            "SELECT player_name, position FROM playing_seven WHERE session_id = ?", (session_id,)
        ).fetchall()
        bench = conn.execute(
            "SELECT player_name, position FROM bench_players WHERE session_id = ?", (session_id,)
        ).fetchall()
        stats = conn.execute(
            "SELECT * FROM live_player_stats WHERE session_id = ?", (session_id,)
        ).fetchall()

        return {
            **dict(session),
            "playing_seven": [dict(p) for p in playing],
            "bench": [dict(b) for b in bench],
            "live_stats": [dict(s) for s in stats],
        }
    finally:
        conn.close()


@router.post("/session/{session_id}/roster")
def set_roster(session_id: str, playing: List[PlayerEntry], bench: List[PlayerEntry]):
    conn = get_connection()
    try:
        conn.execute("DELETE FROM playing_seven WHERE session_id = ?", (session_id,))
        conn.execute("DELETE FROM bench_players WHERE session_id = ?", (session_id,))
        for p in playing:
            conn.execute(
                "INSERT INTO playing_seven (session_id, player_name, position) VALUES (?, ?, ?)",
                (session_id, p.player_name, p.position)
            )
        for b in bench:
            conn.execute(
                "INSERT INTO bench_players (session_id, player_name, position) VALUES (?, ?, ?)",
                (session_id, b.player_name, b.position)
            )
        conn.commit()
        return {"status": "ok"}
    finally:
        conn.close()


@router.put("/session/{session_id}/score")
def update_score(session_id: str, body: ScoreUpdate):
    conn = get_connection()
    try:
        conn.execute(
            """UPDATE live_match_sessions
               SET score_for=?, score_against=?, time_remaining=?
               WHERE session_id=?""",
            (body.score_for, body.score_against, body.time_remaining, session_id)
        )
        conn.commit()
        return {"status": "ok"}
    finally:
        conn.close()


@router.put("/session/{session_id}/stats")
def update_live_stats(session_id: str, stats: List[LiveStatUpdate]):
    conn = get_connection()
    try:
        for s in stats:
            conn.execute(
                """INSERT INTO live_player_stats
                   (session_id, player_name, raid_attempts, successful_raids,
                    tackle_attempts, successful_tackles, super_raids, super_tackles)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(session_id, player_name) DO UPDATE SET
                   raid_attempts=excluded.raid_attempts,
                   successful_raids=excluded.successful_raids,
                   tackle_attempts=excluded.tackle_attempts,
                   successful_tackles=excluded.successful_tackles,
                   super_raids=excluded.super_raids,
                   super_tackles=excluded.super_tackles""",
                (session_id, s.player_name, s.raid_attempts, s.successful_raids,
                 s.tackle_attempts, s.successful_tackles, s.super_raids, s.super_tackles)
            )
        conn.commit()
        return {"status": "ok"}
    finally:
        conn.close()


@router.get("/session/{session_id}/alerts")
def get_alerts(session_id: str):
    return detect_degradation(session_id)


@router.get("/session/{session_id}/recommendations")
def get_recommendations(session_id: str):
    return generate_recommendations(session_id)


@router.post("/demo/load")
def load_demo():
    """Load the pre-built demo match scenario."""
    payload = get_demo_payload()
    conn = get_connection()
    try:
        sid = payload["session"]["session_id"]

        # Upsert session
        conn.execute("DELETE FROM live_match_sessions WHERE session_id = ?", (sid,))
        conn.execute("DELETE FROM playing_seven WHERE session_id = ?", (sid,))
        conn.execute("DELETE FROM bench_players WHERE session_id = ?", (sid,))
        conn.execute("DELETE FROM live_player_stats WHERE session_id = ?", (sid,))

        s = payload["session"]
        conn.execute(
            """INSERT INTO live_match_sessions
               (session_id, created_at, team_name, opponent_name, score_for, score_against, time_remaining)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (sid, datetime.now().isoformat(), s["team_name"], s["opponent_name"],
             s["score_for"], s["score_against"], s["time_remaining"])
        )

        for p in payload["playing_seven"]:
            conn.execute(
                "INSERT INTO playing_seven (session_id, player_name, position) VALUES (?, ?, ?)",
                (sid, p["player_name"], p["position"])
            )
        for b in payload["bench"]:
            conn.execute(
                "INSERT INTO bench_players (session_id, player_name, position) VALUES (?, ?, ?)",
                (sid, b["player_name"], b["position"])
            )
        for ls in payload["live_stats"]:
            conn.execute(
                """INSERT INTO live_player_stats
                   (session_id, player_name, raid_attempts, successful_raids,
                    tackle_attempts, successful_tackles, super_raids, super_tackles)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (sid, ls["player_name"], ls["raid_attempts"], ls["successful_raids"],
                 ls["tackle_attempts"], ls["successful_tackles"],
                 ls["super_raids"], ls["super_tackles"])
            )
        conn.commit()

        alerts = detect_degradation(sid, overrides={
            p: {"Player Successful Raid Percent": v["raid_success_pct"],
                "Player Successful Tackle Percent": v["tackle_success_pct"]}
            for p, v in payload["historical_baselines"].items()
        })
        recs = generate_recommendations(sid, overrides={
            p: {"Player Successful Raid Percent": v["raid_success_pct"],
                "Player Successful Tackle Percent": v["tackle_success_pct"]}
            for p, v in payload["historical_baselines"].items()
        })

        return {
            "session_id": sid,
            "session": s,
            "playing_seven": payload["playing_seven"],
            "bench": payload["bench"],
            "live_stats": payload["live_stats"],
            "alerts": alerts,
            "recommendations": recs,
        }
    finally:
        conn.close()
