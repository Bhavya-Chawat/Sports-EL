"""
Main FastAPI application entry point.
Kabaddi Analytics & Substitution Recommendation System — Backend
"""

import sys
import os

# Ensure the backend directory is on the path
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.schema import init_schema
from engines.data_ingestion import ingest, get_data_source_info

from routers import players, teams, live_match, recommendations, similarity, analytics

app = FastAPI(
    title="Kabaddi Analytics API",
    description="AI-Powered Pro Kabaddi Substitution Recommendation & Performance Analytics",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(players.router,         prefix="/api/players",         tags=["Players"])
app.include_router(teams.router,           prefix="/api/teams",           tags=["Teams"])
app.include_router(live_match.router,      prefix="/api/live",            tags=["Live Match"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(similarity.router,      prefix="/api/similarity",      tags=["Similarity"])
app.include_router(analytics.router,       prefix="/api/analytics",       tags=["Analytics"])


@app.get("/api/system/status")
def system_status():
    """Returns data source info — shown as badge in frontend."""
    info = get_data_source_info()
    return {
        "status":          "ok",
        "data_source":     info.get("source", "NONE"),
        "dataset_file":    info.get("file"),
        "players_loaded":  info.get("players_loaded", 0),
        "teams_loaded":    info.get("teams_loaded", 0),
        "seasons_loaded":  info.get("seasons_loaded", 0),
        "records_loaded":  info.get("records_loaded", 0),
        "last_ingested":   info.get("last_ingested"),
    }


@app.on_event("startup")
async def startup():
    print("=" * 60)
    print("  Kabaddi Analytics System - Starting Up")
    print("=" * 60)
    init_schema()
    ingest()
    info = get_data_source_info()
    print(f"\n  DATA SOURCE : {info['source']}")
    print(f"  FILE        : {info['file']}")
    print(f"  PLAYERS     : {info['players_loaded']}")
    print(f"  SEASONS     : {info['seasons_loaded']}")
    print(f"  RECORDS     : {info['records_loaded']}")
    print("=" * 60)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
