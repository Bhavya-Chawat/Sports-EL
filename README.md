# KabaddiIQ — AI-Powered Pro Kabaddi Analytics System

> *"This could realistically be used by a professional kabaddi coaching staff."*

## Quick Start

### 1. Start the Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python main.py
# → http://localhost:8000
# → API docs: http://localhost:8000/docs
```

### 2. Start the Frontend (React)
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

Or use the convenience scripts from the project root:
- Double-click **`start_backend.bat`**
- Double-click **`start_frontend.bat`**

---

## Data Source

The system **auto-detects** whether your real Excel file is present:

| Condition | Behavior |
|-----------|----------|
| `backend/data/PKL_Organized_Dataset.xlsx` exists | ✅ Loads real PKL data |
| File missing | ⚠️ Generates synthetic data (65 players, 11 seasons) |

**To switch to real data:** Drop your `PKL_Organized_Dataset.xlsx` into `backend/data/` and restart the backend. The data source badge in the top-right corner will update to **🟢 Real Data**.

---

## Features

| Page | Description |
|------|-------------|
| 📊 Executive Dashboard | League-wide KPIs, top performers, season trends |
| 🏃 Player Analytics | Search, radar charts, season trends, similar players |
| 🛡️ Team Analytics | Head-to-head comparison, roster viewer |
| ⚡ Live Match Assistant | Real-time stat entry, degradation alerts, demo mode |
| 🔄 Substitution Center | AI recommendations with confidence meters |
| 🔬 Similarity Analysis | Cosine similarity comparison + heatmap |
| 📋 Recommendation History | Past decisions, acceptance rate, learning curve |
| 🤖 AI Intelligence Center | Engine explainers, formulas, ingestion log |

---

## AI Engines

1. **Impact Score Engine** — Position-weighted composite score (Attack + Defense)
2. **Performance Degradation Detector** — Live vs historical baseline comparison
3. **Substitution Recommendation Engine** — Mode-aware (Attack/Defense/Balanced/Clutch)
4. **Cosine Similarity Engine** — 8-dimensional player archetype matching
5. **Continuous Learning System** — Outcome tracking improves confidence over time

---

## Demo Mode

On the **Live Match Assistant** page, click **⚡ Load Demo Match** to instantly simulate:
- **Patna Pirates vs Dabang Delhi K.C.** at the 28-minute mark (score 28–22)
- **Pardeep Narwal** showing SEVERE degradation (62% → 30% raid success)
- Auto-generated substitution recommendation with confidence score
