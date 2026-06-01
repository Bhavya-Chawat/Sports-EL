"""
Synthetic PKL dataset generator.
Produces realistic data matching the PKL_Organized_Dataset.xlsx schema.
Used as fallback when the real Excel file is not present.
"""

import pandas as pd
import numpy as np
import random

SEASONS = [f"Season {i}" for i in range(1, 12)]

PKL_TEAMS = [
    "Patna Pirates", "Dabang Delhi K.C.", "U Mumba", "Bengaluru Bulls",
    "Jaipur Pink Panthers", "Telugu Titans", "Tamil Thalaivas",
    "Bengal Warriors", "Haryana Steelers", "UP Yoddha",
    "Gujarat Giants", "Puneri Paltan"
]

RAIDERS = [
    ("Pardeep Narwal", "Patna Pirates"), ("Arjun Deshwal", "Jaipur Pink Panthers"),
    ("Naveen Kumar", "Dabang Delhi K.C."), ("Pawan Sehrawat", "Bengaluru Bulls"),
    ("Rahul Chaudhari", "Tamil Thalaivas"), ("Maninder Singh", "Bengal Warriors"),
    ("Deepak Niwas Hooda", "Jaipur Pink Panthers"), ("Bharat", "UP Yoddha"),
    ("Vikash Kandola", "Haryana Steelers"), ("Sukesh Hegde", "Bengaluru Bulls"),
    ("Ajinkya Pawar", "U Mumba"), ("Ajay Thakur", "Tamil Thalaivas"),
    ("Anup Kumar", "U Mumba"), ("Rohit Kumar", "Patna Pirates"),
    ("Ashu Malik", "Haryana Steelers"), ("Devank Dalal", "Haryana Steelers"),
    ("Rakesh Narwal", "Bengaluru Bulls"), ("Sachin", "Patna Pirates"),
    ("Vikas Jaglan", "Haryana Steelers"), ("Aslam Inamdar", "Puneri Paltan"),
    ("Mohammad Nabibakhsh", "Bengal Warriors"), ("Reza Mirbagheri", "U Mumba"),
    ("Nitin Tomar", "UP Yoddha"), ("Rohit Baliyan", "UP Yoddha"),
    ("Siddharth Desai", "Telugu Titans"),
]

DEFENDERS = [
    ("Surjeet Singh", "U Mumba"), ("Fazel Atrachali", "U Mumba"),
    ("Vishal Bharadwaj", "U Mumba"), ("Sandeep Dhull", "Dabang Delhi K.C."),
    ("Ravinder Pahal", "Dabang Delhi K.C."), ("Girish Maruti Ernak", "Patna Pirates"),
    ("Hadi Oshtorak", "Jaipur Pink Panthers"), ("Nitesh Kumar", "Patna Pirates"),
    ("Sunil", "Bengaluru Bulls"), ("Parvesh Bhainswal", "Gujarat Giants"),
    ("Manjeet Chhillar", "Jaipur Pink Panthers"), ("Dharmaraj Cheralathan", "Tamil Thalaivas"),
    ("Ravi Kumar", "Haryana Steelers"), ("Sumit", "Haryana Steelers"),
    ("Jaideep", "UP Yoddha"), ("Baldev Singh", "UP Yoddha"),
    ("Mohit Goyat", "Bengal Warriors"), ("Vishal Mane", "Puneri Paltan"),
    ("Ashish Narwal", "Telugu Titans"), ("Rinku Narwal", "Gujarat Giants"),
    ("Sombir", "Haryana Steelers"), ("Dinesh Kumar", "Bengaluru Bulls"),
    ("Dong Geon Lee", "Jaipur Pink Panthers"), ("Surender Gill", "Gujarat Giants"),
    ("Kuldeep Singh", "Patna Pirates"),
]

ALLROUNDERS = [
    ("Deepak Kumar", "Bengal Warriors"), ("Rohit Rana", "Haryana Steelers"),
    ("Shubham Shinde", "Bengaluru Bulls"), ("Akash Pikalmunde", "U Mumba"),
    ("Vishal Bhardwaj", "UP Yoddha"), ("Ravindra Ramesh Kumawat", "Gujarat Giants"),
    ("Chandran Ranjit", "Tamil Thalaivas"), ("Darshan J", "Bengaluru Bulls"),
    ("Ajay Thakur", "Bengal Warriors"), ("Mahender Singh", "Jaipur Pink Panthers"),
    ("Pranay Vinayak Rane", "U Mumba"), ("Vinay", "Dabang Delhi K.C."),
    ("Prashant Kumar Rai", "Patna Pirates"), ("Sushant Sail", "Bengal Warriors"),
    ("Rohit Kumar Mahal", "UP Yoddha"),
]

STAT_PROFILES = {
    "Raider": {
        "Player Total Points":         (180, 60),
        "Player Raid Points":           (160, 55),
        "Player Tackle Points":         (10, 8),
        "Player Successful Raids":      (95, 30),
        "Player Successful Tackles":    (6, 5),
        "Player Successful Raid Percent":   (57, 8),
        "Player Successful Tackle Percent": (38, 15),
        "Player Avg Raid Points":       (5.5, 1.5),
        "Player Avg Tackle Points":     (0.3, 0.3),
        "Player Super Raids":           (18, 8),
        "Player Super Tackles":         (1, 1),
        "Super 10s":                    (6, 4),
        "High 5s":                      (0, 1),
        "Player DOD Raid Points":       (12, 8),
    },
    "Defender": {
        "Player Total Points":          (90, 35),
        "Player Raid Points":           (8, 8),
        "Player Tackle Points":         (75, 30),
        "Player Successful Raids":      (5, 5),
        "Player Successful Tackles":    (55, 22),
        "Player Successful Raid Percent":   (40, 15),
        "Player Successful Tackle Percent": (58, 10),
        "Player Avg Raid Points":       (0.3, 0.3),
        "Player Avg Tackle Points":     (3.0, 1.2),
        "Player Super Raids":           (1, 1),
        "Player Super Tackles":         (10, 6),
        "Super 10s":                    (0, 1),
        "High 5s":                      (4, 3),
        "Player DOD Raid Points":       (2, 3),
    },
    "All-Rounder": {
        "Player Total Points":          (120, 45),
        "Player Raid Points":           (70, 30),
        "Player Tackle Points":         (45, 20),
        "Player Successful Raids":      (45, 20),
        "Player Successful Tackles":    (30, 15),
        "Player Successful Raid Percent":   (50, 10),
        "Player Successful Tackle Percent": (50, 10),
        "Player Avg Raid Points":       (2.5, 1.0),
        "Player Avg Tackle Points":     (1.8, 0.8),
        "Player Super Raids":           (6, 4),
        "Player Super Tackles":         (4, 3),
        "Super 10s":                    (2, 2),
        "High 5s":                      (2, 2),
        "Player DOD Raid Points":       (6, 5),
    },
}

TEAM_STAT_PROFILES = {
    "Team Raid Points":          (280, 60),
    "Team Tackle Points":        (180, 50),
    "Team Total Points":         (460, 90),
    "Team Successful Raids":     (220, 55),
    "Team Successful Tackles":   (160, 45),
    "Team Average Raid Points":  (6.2, 1.0),
    "Team Average Tackle Points": (4.1, 0.8),
    "Team Super Raid":           (22, 8),
    "Team Super Tackles":        (18, 7),
}


def _sample(mean, std, low=0, decimals=1):
    val = random.gauss(mean, std)
    val = max(low, val)
    return round(val, decimals)


def generate_player_stats_df():
    rows = []
    all_players = (
        [(n, t, "Raider") for n, t in RAIDERS] +
        [(n, t, "Defender") for n, t in DEFENDERS] +
        [(n, t, "All-Rounder") for n, t in ALLROUNDERS]
    )
    for player_name, team, position in all_players:
        profile = STAT_PROFILES[position]
        # star players get boosted stats
        is_star = player_name in {
            "Pardeep Narwal", "Arjun Deshwal", "Naveen Kumar",
            "Pawan Sehrawat", "Fazel Atrachali", "Surjeet Singh",
        }
        boost = 1.4 if is_star else 1.0

        # Career trajectory: improve over first 6 seasons then plateau
        base_perf = {stat: _sample(mean * boost, std) for stat, (mean, std) in profile.items()}

        # Choose which seasons this player appeared in
        num_seasons = random.randint(3, 11)
        player_seasons = sorted(random.sample(SEASONS, num_seasons))

        for i, season in enumerate(player_seasons):
            matches = random.randint(16, 24)
            season_factor = min(1.0 + i * 0.05, 1.3)  # improve over time
            for stat, base_val in base_perf.items():
                val = base_val * season_factor * random.uniform(0.85, 1.15)
                val = max(0, val)
                rows.append({
                    "Season": season,
                    "Stat": stat,
                    "Player": player_name,
                    "Team": team,
                    "Position": position,
                    "Matches": matches,
                    "Value": round(val, 2),
                })
    return pd.DataFrame(rows)


def generate_team_stats_df():
    rows = []
    for team in PKL_TEAMS:
        for season in SEASONS:
            for stat, (mean, std) in TEAM_STAT_PROFILES.items():
                rows.append({
                    "Season": season,
                    "Stat": stat,
                    "Team": team,
                    "Value": round(max(0, random.gauss(mean, std)), 2),
                })
    return pd.DataFrame(rows)


def generate_rankings_df():
    rows = []
    all_raiders = [n for n, _ in RAIDERS]
    all_defenders = [n for n, _ in DEFENDERS]
    all_allrounders = [n for n, _ in ALLROUNDERS]
    all_players_map = {
        **{n: t for n, t in RAIDERS},
        **{n: t for n, t in DEFENDERS},
        **{n: t for n, t in ALLROUNDERS},
    }

    for season in SEASONS:
        for category, pool in [
            ("Top Raider", all_raiders),
            ("Top Defender", all_defenders),
            ("Top Allrounder", all_allrounders),
        ]:
            picks = random.sample(pool, min(10, len(pool)))
            for rank, player in enumerate(picks, 1):
                rows.append({
                    "Season": season,
                    "Category": category,
                    "Rank": rank,
                    "Player": player,
                    "Team": all_players_map.get(player, "Unknown"),
                    "Value": round(random.gauss(150, 40) if "Raid" in category else random.gauss(90, 25), 1),
                })
    return pd.DataFrame(rows)


def build_synthetic_excel(path: str):
    """Write synthetic data to an Excel file matching the PKL schema."""
    player_df = generate_player_stats_df()
    team_df = generate_team_stats_df()
    rankings_df = generate_rankings_df()

    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        player_df.to_excel(writer, sheet_name="Player_Stats", index=False)
        team_df.to_excel(writer, sheet_name="Team_Stats", index=False)
        rankings_df.to_excel(writer, sheet_name="Rankings", index=False)

    return {
        "players": player_df["Player"].nunique(),
        "seasons": player_df["Season"].nunique(),
        "teams": player_df["Team"].nunique(),
        "rows": len(player_df),
    }
