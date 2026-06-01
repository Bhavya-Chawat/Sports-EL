"""
Demo match data generator — produces a realistic PKL match scenario
for the "Load Demo Match" feature.
"""

import uuid
from datetime import datetime


DEMO_SESSION = {
    "session_id": "DEMO-PATNA-DELHI-2024",
    "team_name": "Patna Pirates",
    "opponent_name": "Dabang Delhi K.C.",
    "score_for": 28,
    "score_against": 22,
    "time_remaining": 12,
}

DEMO_PLAYING_SEVEN = [
    {"player_name": "Pardeep Narwal",   "position": "Raider"},
    {"player_name": "Sachin",           "position": "Raider"},
    {"player_name": "Nitesh Kumar",     "position": "Defender"},
    {"player_name": "Girish Maruti Ernak", "position": "Defender"},
    {"player_name": "Kuldeep Singh",    "position": "Defender"},
    {"player_name": "Prashant Kumar Rai", "position": "All-Rounder"},
    {"player_name": "Rohit Kumar",      "position": "Raider"},
]

DEMO_BENCH = [
    {"player_name": "Neeraj Kumar",    "position": "Raider"},
    {"player_name": "Deepak Kumar",    "position": "All-Rounder"},
    {"player_name": "Baldev Singh",    "position": "Defender"},
]

# Historical baselines (from player career stats)
DEMO_HISTORICAL_BASELINES = {
    "Pardeep Narwal":      {"raid_success_pct": 62, "tackle_success_pct": 38},
    "Sachin":              {"raid_success_pct": 52, "tackle_success_pct": 41},
    "Nitesh Kumar":        {"raid_success_pct": 38, "tackle_success_pct": 60},
    "Girish Maruti Ernak": {"raid_success_pct": 32, "tackle_success_pct": 58},
    "Kuldeep Singh":       {"raid_success_pct": 35, "tackle_success_pct": 56},
    "Prashant Kumar Rai":  {"raid_success_pct": 48, "tackle_success_pct": 50},
    "Rohit Kumar":         {"raid_success_pct": 55, "tackle_success_pct": 42},
}

# Live stats — Pardeep is having a bad game (degradation scenario)
DEMO_LIVE_STATS = [
    {"player_name": "Pardeep Narwal",   "raid_attempts": 10, "successful_raids": 3,  "tackle_attempts": 2, "successful_tackles": 1, "super_raids": 0, "super_tackles": 0},
    {"player_name": "Sachin",           "raid_attempts": 8,  "successful_raids": 5,  "tackle_attempts": 1, "successful_tackles": 0, "super_raids": 1, "super_tackles": 0},
    {"player_name": "Nitesh Kumar",     "raid_attempts": 1,  "successful_raids": 0,  "tackle_attempts": 9, "successful_tackles": 5, "super_raids": 0, "super_tackles": 1},
    {"player_name": "Girish Maruti Ernak","raid_attempts": 0,"successful_raids": 0,  "tackle_attempts": 8, "successful_tackles": 4, "super_raids": 0, "super_tackles": 0},
    {"player_name": "Kuldeep Singh",    "raid_attempts": 1,  "successful_raids": 0,  "tackle_attempts": 7, "successful_tackles": 4, "super_raids": 0, "super_tackles": 0},
    {"player_name": "Prashant Kumar Rai","raid_attempts": 4, "successful_raids": 2,  "tackle_attempts": 4, "successful_tackles": 2, "super_raids": 0, "super_tackles": 0},
    {"player_name": "Rohit Kumar",      "raid_attempts": 6,  "successful_raids": 4,  "tackle_attempts": 2, "successful_tackles": 1, "super_raids": 1, "super_tackles": 0},
]


def get_demo_payload():
    """Return the full demo match payload."""
    return {
        "session": DEMO_SESSION,
        "playing_seven": DEMO_PLAYING_SEVEN,
        "bench": DEMO_BENCH,
        "live_stats": DEMO_LIVE_STATS,
        "historical_baselines": DEMO_HISTORICAL_BASELINES,
    }
