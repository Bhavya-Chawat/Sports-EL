from fastapi import APIRouter
from pydantic import BaseModel
from db.schema import get_connection
from engines.recommendation import record_outcome

router = APIRouter()


class OutcomeBody(BaseModel):
    accepted: bool
    points_scored_after: int = 0
    points_conceded_after: int = 0


@router.get("/history")
def recommendation_history(limit: int = 100):
    conn = get_connection()
    try:
        rows = conn.execute(
            """SELECT r.*, o.accepted, o.points_scored_after,
                      o.points_conceded_after, o.successful, o.recorded_at as outcome_at
               FROM recommendations r
               LEFT JOIN recommendation_outcomes o ON o.recommendation_id = r.recommendation_id
               ORDER BY r.created_at DESC
               LIMIT ?""",
            (limit,)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


@router.get("/stats")
def recommendation_stats():
    conn = get_connection()
    try:
        total = conn.execute("SELECT COUNT(*) FROM recommendations").fetchone()[0]
        accepted = conn.execute(
            "SELECT COUNT(*) FROM recommendation_outcomes WHERE accepted = 1"
        ).fetchone()[0]
        successful = conn.execute(
            "SELECT COUNT(*) FROM recommendation_outcomes WHERE successful = 1"
        ).fetchone()[0]
        acceptance_rate = round(accepted / total * 100, 1) if total else 0
        success_rate = round(successful / accepted * 100, 1) if accepted else 0

        # Learning curve: cumulative success rate over time
        outcomes = conn.execute(
            """SELECT o.recorded_at, o.successful
               FROM recommendation_outcomes o
               WHERE o.accepted = 1
               ORDER BY o.recorded_at"""
        ).fetchall()

        curve = []
        running_success = 0
        for i, o in enumerate(outcomes, 1):
            running_success += o["successful"]
            curve.append({
                "index": i,
                "cumulative_success_rate": round(running_success / i * 100, 1),
                "recorded_at": o["recorded_at"],
            })

        return {
            "total_recommendations": total,
            "accepted": accepted,
            "successful": successful,
            "acceptance_rate": acceptance_rate,
            "success_rate": success_rate,
            "learning_curve": curve,
        }
    finally:
        conn.close()


@router.post("/{rec_id}/outcome")
def submit_outcome(rec_id: str, body: OutcomeBody):
    record_outcome(
        rec_id, body.accepted,
        body.points_scored_after, body.points_conceded_after
    )
    return {"status": "ok"}
