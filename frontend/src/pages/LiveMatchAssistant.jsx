import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { 
  Swords, 
  Play, 
  ChevronRight, 
  ChevronLeft, 
  AlertTriangle, 
  Check, 
  X, 
  Info,
  Brain,
  Activity,
  Plus,
  ArrowRight,
  RefreshCw,
  Clock
} from 'lucide-react';

const POSITIONS = ['Raider', 'Defender', 'All-Rounder'];
const SEV_CLASS = { SEVERE: 'alert-severe', MODERATE: 'alert-moderate', MILD: 'alert-mild' };

// Step-by-step Simulation Timeline Matrix
const SIMULATION_STEPS = [
  {
    step: 0,
    time: 20,
    scoreFor: 20,
    scoreAgainst: 18,
    eventText: "Match Commenced (Minute 20) — Patna Pirates vs Dabang Delhi. score is 20-18 (Patna leads). Active playing roster is fully stable.",
    alerts: [],
    recs: [],
    playing: [
      { player_name: "Pardeep Narwal", position: "Raider" },
      { player_name: "Sachin Tanwar", position: "Raider" },
      { player_name: "Manjeet", position: "Raider" },
      { player_name: "Sajin C", position: "Defender" },
      { player_name: "Neeraj Kumar", position: "Defender" },
      { player_name: "Mohammadreza Shadloui", position: "Defender" },
      { player_name: "Sunil Kumar", position: "Defender" }
    ],
    bench: [
      { player_name: "Ashu Malik", position: "Raider" },
      { player_name: "Rohit Gulia", position: "All-Rounder" },
      { player_name: "Monu", position: "Defender" }
    ],
    stats: {
      "Pardeep Narwal": { raid_attempts: 0, successful_raids: 0, tackle_attempts: 0, successful_tackles: 0 }
    }
  },
  {
    step: 1,
    time: 24,
    scoreFor: 21,
    scoreAgainst: 18,
    eventText: "Pardeep Narwal initiates first raid. Outcome: Successful Raid! Patna scores +1 point. Live success rating: 100%.",
    alerts: [],
    recs: [],
    stats: {
      "Pardeep Narwal": { raid_attempts: 1, successful_raids: 1, tackle_attempts: 0, successful_tackles: 0 }
    }
  },
  {
    step: 2,
    time: 28,
    scoreFor: 21,
    scoreAgainst: 19,
    eventText: "Pardeep Narwal goes for second raid. Outcome: Tackled by Delhi defense. Dabang scores +1 tackle point. Success rate drops to 50%.",
    alerts: [],
    recs: [],
    stats: {
      "Pardeep Narwal": { raid_attempts: 2, successful_raids: 1, tackle_attempts: 0, successful_tackles: 0 }
    }
  },
  {
    step: 3,
    time: 30,
    scoreFor: 21,
    scoreAgainst: 20,
    eventText: "Pardeep Narwal initiates third raid. Outcome: Unsuccessful. Pushed out of court. Delhi scores +1 point. Success rate drops to 33%.",
    alerts: [],
    recs: [],
    stats: {
      "Pardeep Narwal": { raid_attempts: 3, successful_raids: 1, tackle_attempts: 0, successful_tackles: 0 }
    }
  },
  {
    step: 4,
    time: 32,
    scoreFor: 21,
    scoreAgainst: 21,
    eventText: "Pardeep Narwal goes for fourth raid. Outcome: Blocked and tackled. Rolling raid success drops to 25%. Roster telemetry registers extreme decay.",
    alerts: [],
    recs: [],
    stats: {
      "Pardeep Narwal": { raid_attempts: 4, successful_raids: 1, tackle_attempts: 0, successful_tackles: 0 }
    }
  },
  {
    step: 5,
    time: 33,
    scoreFor: 21,
    scoreAgainst: 22,
    eventText: "Performance degradation threshold reached. SEVERE alert logged in real time. AI Recommendation Engine triggers immediate substitution logic.",
    alerts: [
      {
        player_name: "Pardeep Narwal",
        severity: "SEVERE",
        metric_label: "Raid Success Percent",
        current: 25,
        historical: 62,
        drop_pct: 59,
        attempts: 4,
        unit: "%"
      }
    ],
    recs: [
      {
        recommendation_id: "DEMO-REC-001",
        mode: "ATTACK",
        out_player: "Pardeep Narwal",
        out_impact: 68.4,
        in_player: "Ashu Malik",
        in_impact: 82.6,
        confidence: 87.2,
        impact_gain: 14.2,
        reason: "Raid success dropped 59% in last 4 raids. Bench substitute Ashu Malik shows higher historical impact rating (82.6 vs 68.4)."
      }
    ],
    stats: {
      "Pardeep Narwal": { raid_attempts: 4, successful_raids: 1, tackle_attempts: 0, successful_tackles: 0 }
    }
  },
  {
    step: 6,
    time: 34,
    scoreFor: 21,
    scoreAgainst: 22,
    eventText: "Coaching staff accepts recommendation. Pardeep Narwal is substituted out. Ashu Malik is active on the Playing 7 grid.",
    executeSub: true, // indicates swap should execute
    alerts: [
      {
        player_name: "Pardeep Narwal",
        severity: "SEVERE",
        metric_label: "Raid Success Percent",
        current: 25,
        historical: 62,
        drop_pct: 59,
        attempts: 4,
        unit: "%"
      }
    ],
    recs: [],
    stats: {
      "Pardeep Narwal": { raid_attempts: 4, successful_raids: 1, tackle_attempts: 0, successful_tackles: 0 },
      "Ashu Malik": { raid_attempts: 0, successful_raids: 0, tackle_attempts: 0, successful_tackles: 0 }
    }
  },
  {
    step: 7,
    time: 36,
    scoreFor: 24,
    scoreAgainst: 22,
    eventText: "Clutch Play: Ashu Malik goes for first raid → Successful Super Raid! Patna scores +3 points to lead the match.",
    alerts: [],
    recs: [],
    stats: {
      "Pardeep Narwal": { raid_attempts: 4, successful_raids: 1, tackle_attempts: 0, successful_tackles: 0 },
      "Ashu Malik": { raid_attempts: 1, successful_raids: 1, tackle_attempts: 0, successful_tackles: 0, super_raids: 1 }
    }
  },
  {
    step: 8,
    time: 40,
    scoreFor: 28,
    scoreAgainst: 25,
    eventText: "Match Concluded. Patna Pirates wins 28-25. Continuous Learning registers substitution as 100% efficacious.",
    alerts: [],
    recs: [],
    stats: {
      "Pardeep Narwal": { raid_attempts: 4, successful_raids: 1, tackle_attempts: 0, successful_tackles: 0 },
      "Ashu Malik": { raid_attempts: 3, successful_raids: 2, tackle_attempts: 0, successful_tackles: 0, super_raids: 1 }
    }
  }
];

export default function LiveMatchAssistant({ onSessionStart }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=setup 2=roster 3=live
  const [sessionId, setSessionId] = useState(null);

  // Setup form
  const [form, setForm] = useState({ team_name: '', opponent_name: '', score_for: 0, score_against: 0, time_remaining: 40 });
  const [playing, setPlaying] = useState(Array.from({length:7}, (_, i) => ({ player_name: '', position: i < 3 ? 'Raider' : 'Defender' })));
  const [bench,   setBench]   = useState(Array.from({length:3}, (_, i) => ({ player_name: '', position: i === 0 ? 'Raider' : 'Defender' })));

  // Live state
  const [liveStats, setLiveStats] = useState({});
  const [alerts, setAlerts]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [recs, setRecs]           = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [eventLogs, setEventLogs] = useState([]);

  const fetchRecommendations = async (sid) => {
    if (!sid) return;
    try {
      const r = await api.getRecommendations(sid);
      setRecs(r.data);
    } catch (e) {
      console.error(e);
    }
  };

  const createSession = async () => {
    if (!form.team_name || !form.opponent_name) return;
    const r = await api.createSession(form);
    const sid = r.data.session_id;
    setSessionId(sid);
    const validP = playing.filter(p => p.player_name.trim());
    const validB = bench.filter(b => b.player_name.trim());
    await api.setRoster(sid, validP, validB);
    
    // Init live stats
    const init = validP.map(p => ({ player_name: p.player_name, raid_attempts: 0, successful_raids: 0, tackle_attempts: 0, successful_tackles: 0, super_raids: 0, super_tackles: 0 }));
    await api.updateStats(sid, init);
    const statsMap = {};
    validP.forEach(p => { statsMap[p.player_name] = { raid_attempts: 0, successful_raids: 0, tackle_attempts: 0, successful_tackles: 0, super_raids: 0, super_tackles: 0 }; });
    setLiveStats(statsMap);
    onSessionStart && onSessionStart(sid);
    setStep(3);
  };

  // Start step-by-step simulator
  const startSimulator = () => {
    setIsSimulating(true);
    setSimStep(0);
    const initialLog = { time: 20, desc: SIMULATION_STEPS[0].eventText };
    setEventLogs([initialLog]);
    setAlerts([]);
    setRecs([]);
    setLiveStats(SIMULATION_STEPS[0].stats);
    setSessionId("DEMO-SESSION-001");
    onSessionStart && onSessionStart("DEMO-SESSION-001");
    setStep(3);
  };

  // Step through simulation
  const handleNextSimStep = () => {
    if (simStep >= SIMULATION_STEPS.length - 1) return;
    const nextStep = simStep + 1;
    setSimStep(nextStep);
    
    const nextData = SIMULATION_STEPS[nextStep];
    setAlerts(nextData.alerts || []);
    setRecs(nextData.recs || []);
    
    // Keep logs updated
    const logEntry = { time: nextData.time, desc: nextData.eventText };
    setEventLogs(prev => [...prev, logEntry]);
    
    // Update live stats
    if (nextData.stats) {
      setLiveStats(prev => ({
        ...prev,
        ...nextData.stats
      }));
    }
  };

  // Step backward in simulation
  const handlePrevSimStep = () => {
    if (simStep <= 0) return;
    const prevStep = simStep - 1;
    setSimStep(prevStep);
    
    const prevData = SIMULATION_STEPS[prevStep];
    setAlerts(prevData.alerts || []);
    setRecs(prevData.recs || []);
    
    // Trim logs
    setEventLogs(prev => prev.slice(0, prevStep + 1));
    
    // Restore stats
    if (prevData.stats) {
      setLiveStats(prevData.stats);
    }
  };

  // Interactive Recommendation Accept inside simulation
  const handleSimDecision = (rec, accepted) => {
    if (accepted && rec.recommendation_id === "DEMO-REC-001") {
      // Manually fast-forward simulation step to Step 6 (Execute Sub)
      handleNextSimStep();
    } else {
      setRecs([]);
    }
  };

  const refreshAlerts = async () => {
    if (!sessionId || isSimulating) return;
    setLoading(true);
    // Push latest stats
    const statsArr = Object.entries(liveStats).map(([n, s]) => ({ player_name: n, ...s }));
    if (statsArr.length) await api.updateStats(sessionId, statsArr);
    const r = await api.getAlerts(sessionId);
    setAlerts(r.data);
    await fetchRecommendations(sessionId);
    setLoading(false);
  };

  const updateStat = (player, key, delta) => {
    setLiveStats(prev => ({
      ...prev,
      [player]: { ...prev[player], [key]: Math.max(0, (prev[player]?.[key] || 0) + delta) }
    }));
  };

  const handleDecision = async (rec, accepted) => {
    await api.submitOutcome(rec.recommendation_id, { accepted, points_scored_after: 0, points_conceded_after: 0 });
    setRecs(prev => prev.filter(r => r.recommendation_id !== rec.recommendation_id));
  };

  // Setup Dynamic Roster Lists based on Active Simulation Steps
  let playingList = playing.filter(p => p.player_name);
  let benchList   = bench.filter(b => b.player_name);
  let scoreFor    = form.score_for;
  let scoreAgainst= form.score_against;
  let timeLeft    = form.time_remaining;
  let teamName    = form.team_name;
  let opponentName= form.opponent_name;

  if (isSimulating) {
    const curSim = SIMULATION_STEPS[simStep];
    const initialSim = SIMULATION_STEPS[0];
    scoreFor = curSim.scoreFor;
    scoreAgainst = curSim.scoreAgainst;
    timeLeft = curSim.time;
    teamName = "Patna Pirates";
    opponentName = "Dabang Delhi";
    
    // Simulate player swap in Playing 7 roster list at step 6 and higher
    if (simStep >= 6) {
      playingList = [
        { player_name: "Ashu Malik", position: "Raider" }, // Swapped IN!
        { player_name: "Sachin Tanwar", position: "Raider" },
        { player_name: "Manjeet", position: "Raider" },
        { player_name: "Sajin C", position: "Defender" },
        { player_name: "Neeraj Kumar", position: "Defender" },
        { player_name: "Mohammadreza Shadloui", position: "Defender" },
        { player_name: "Sunil Kumar", position: "Defender" }
      ];
      benchList = [
        { player_name: "Pardeep Narwal", position: "Raider" }, // Swapped OUT!
        { player_name: "Rohit Gulia", position: "All-Rounder" },
        { player_name: "Monu", position: "Defender" }
      ];
    } else {
      playingList = initialSim.playing;
      benchList = initialSim.bench;
    }
  }

  return (
    <div className="page-body">
      <div className="page-header">
        <h1 className="shiny-text">Live Match Assistant</h1>
        <p>Real-time coaching telemetry console and degradation analytics</p>
      </div>

      {step === 1 && (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div className="card">
            <div className="section-header">
              <div className="section-title">Match Setup</div>
            </div>
            <div className="form-group">
              <label className="form-label">Your Team</label>
              <input className="form-input" value={form.team_name} onChange={e => setForm(f=>({...f,team_name:e.target.value}))} placeholder="e.g. Patna Pirates" />
            </div>
            <div className="form-group">
              <label className="form-label">Opponent Team</label>
              <input className="form-input" value={form.opponent_name} onChange={e => setForm(f=>({...f,opponent_name:e.target.value}))} placeholder="e.g. Dabang Delhi K.C." />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Your Score</label>
                <input className="form-input" type="number" min={0} value={form.score_for} onChange={e => setForm(f=>({...f,score_for:+e.target.value}))} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Opponent Score</label>
                <input className="form-input" type="number" min={0} value={form.score_against} onChange={e => setForm(f=>({...f,score_against:+e.target.value}))} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Time (min)</label>
                <input className="form-input" type="number" min={0} max={40} value={form.time_remaining} onChange={e => setForm(f=>({...f,time_remaining:+e.target.value}))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button className="btn btn-primary" onClick={() => setStep(2)}>
                Roster Setup <ChevronRight size={16} style={{ marginLeft: 2 }} />
              </button>
              <button className="btn btn-orange" onClick={startSimulator}>
                Launch Interactive Simulation
              </button>
            </div>
          </div>

          <div className="card">
            <div className="section-header">
              <div className="section-title">
                <Info size={16} style={{ marginRight: 4 }} />
                Coaching Simulator Overview
              </div>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
              Click <strong>Launch Interactive Simulation</strong> to run a step-by-step showcase of the AI Substitution workflow.
            </p>
            <div style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 16, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              <strong>Interactive Timeline Features:</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent-coral)' }} />
                <span>Sequentially simulate raids and tackles, watching rolling averages update live.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--text-primary)' }} />
                <span>See the Severe Degradation Alert trigger dynamically as raid success drops.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent-pink)' }} />
                <span>Click &apos;Accept Substitution&apos; on the sticky AI panel to swap roster slots instantly.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <div className="section-header">
            <div className="section-title">Roster Allocation</div>
          </div>
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Active Playing 7</div>
              {playing.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input className="form-input" placeholder={`Player ${i+1} Name`} value={p.player_name} onChange={e => setPlaying(pl => pl.map((x,j) => j===i?{...x,player_name:e.target.value}:x))} />
                  <select className="form-select" style={{ width: 140 }} value={p.position} onChange={e => setPlaying(pl => pl.map((x,j) => j===i?{...x,position:e.target.value}:x))}>
                    {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Bench Players</div>
              {bench.map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input className="form-input" placeholder={`Bench ${i+1} Name`} value={b.player_name} onChange={e => setBench(bl => bl.map((x,j) => j===i?{...x,player_name:e.target.value}:x))} />
                  <select className="form-select" style={{ width: 140 }} value={b.position} onChange={e => setBench(bl => bl.map((x,j) => j===i?{...x,position:e.target.value}:x))}>
                    {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}><ChevronLeft size={16} /> Back</button>
            <button className="btn btn-primary" onClick={createSession}>Start Live Console <Play size={14} style={{ marginLeft: 4 }} /></button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* Interactive Simulation Dashboard Control Bar (when simulation is active) */}
          {isSimulating && (
            <div className="simulator-panel">
              <div className="simulator-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Brain size={18} style={{ color: 'var(--accent-coral)' }} />
                  <span style={{ fontWeight: 800, fontSize: 15 }}>Match Simulation Controller</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                  Event {simStep + 1} of {SIMULATION_STEPS.length}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1, minWidth: 280 }}>
                  {SIMULATION_STEPS[simStep].eventText}
                </div>
                <div className="simulator-controls">
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={handlePrevSimStep}
                    disabled={simStep === 0}
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                  <button 
                    className="btn btn-orange btn-sm" 
                    onClick={handleNextSimStep}
                    disabled={simStep === SIMULATION_STEPS.length - 1}
                  >
                    Simulate Next Play <ChevronRight size={14} />
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setIsSimulating(false); setStep(1); }}
                  >
                    Exit Demo
                  </button>
                </div>
              </div>

              {/* Simulation chronological logs list */}
              <div className="event-log-container">
                {eventLogs.map((log, i) => (
                  <div key={i} className="event-log-item">
                    <span className="event-log-time">[{log.time}m]</span>
                    <span style={{ color: 'var(--text-primary)' }}>{log.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="coaching-console">
            {/* Main Coaching Workspace */}
            <div>
              {/* Scoreboard */}
              <div className="scoreboard-console">
                <div className="score-box">
                  <div className="score-team-name">{teamName}</div>
                  <div className="score-digit">{scoreFor}</div>
                </div>
                <div className="score-middle">
                  <div className="match-clock" style={{ display: 'flex', alignItems: 'center', gap: 6, color: timeLeft <= 5 ? '#EF4444' : 'var(--text-primary)' }}>
                    <Clock size={16} /> {timeLeft}m
                  </div>
                  <div className="match-state-label">Time Remaining</div>
                </div>
                <div className="score-box">
                  <div className="score-digit">{scoreAgainst}</div>
                  <div className="score-team-name">{opponentName}</div>
                </div>
              </div>

              {/* Playing 7 Grid */}
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="section-header">
                  <div className="section-title">
                    <Activity size={18} style={{ marginRight: 4 }} />
                    Active Playing 7
                  </div>
                  {!isSimulating && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Select player to log stats</span>}
                </div>
                
                <div className="console-player-grid">
                  {playingList.map((p, i) => {
                    const ps = liveStats[p.player_name] || { raid_attempts: 0, successful_raids: 0, tackle_attempts: 0, successful_tackles: 0 };
                    const isSelected = selectedPlayer === p.player_name;
                    const raidPct = ps.raid_attempts > 0 ? Math.round(ps.successful_raids / ps.raid_attempts * 100) : 0;
                    const tacklePct = ps.tackle_attempts > 0 ? Math.round(ps.successful_tackles / ps.tackle_attempts * 100) : 0;
                    const initials = p.player_name.split(' ').map(n=>n[0]).join('').substring(0, 2);

                    return (
                      <div 
                        key={i} 
                        className={`console-player-item${isSelected ? ' selected' : ''}`}
                        onClick={() => !isSimulating && setSelectedPlayer(isSelected ? null : p.player_name)}
                        style={{ cursor: isSimulating ? 'default' : 'pointer' }}
                      >
                        <div className="player-card-avatar" style={{ width: 32, height: 32, fontSize: 10, margin: '0 auto 8px', backgroundColor: 'var(--accent-peach)' }}>
                          {initials}
                        </div>
                        <div className="console-player-name">{p.player_name}</div>
                        <div className="console-player-pos">{p.position}</div>
                        <div className="console-player-score" style={{ color: p.position === 'Raider' && ps.raid_attempts >= 4 && raidPct <= 30 ? '#EF4444' : 'var(--text-primary)' }}>
                          {p.position === 'Raider' ? `${raidPct}%` : `${tacklePct}%`}
                        </div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                          {p.position === 'Raider' ? 'Raid Success' : 'Tackle Success'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Stat Logger overlay (only for non-simulated sessions) */}
                {selectedPlayer && !isSimulating && (
                  <div style={{ marginTop: 20, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>Log Stat for {selectedPlayer}</span>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelectedPlayer(null)}>Cancel</button>
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Raid Outcome</div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button className="btn btn-success btn-sm" onClick={() => updateStat(selectedPlayer, 'successful_raids', 1)}>Success</button>
                          <button className="btn btn-danger btn-sm" onClick={() => updateStat(selectedPlayer, 'raid_attempts', 1)}>Empty/Failed</button>
                        </div>
                        <div style={{ marginTop: 8, fontSize: 13 }}>
                          Logged: <strong>{liveStats[selectedPlayer]?.successful_raids || 0}</strong> / {liveStats[selectedPlayer]?.raid_attempts || 0}
                        </div>
                      </div>

                      <div style={{ flex: 1, border: '1px solid var(--border-color)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Tackle Outcome</div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button className="btn btn-success btn-sm" onClick={() => updateStat(selectedPlayer, 'successful_tackles', 1)}>Success</button>
                          <button className="btn btn-danger btn-sm" onClick={() => updateStat(selectedPlayer, 'tackle_attempts', 1)}>Fail</button>
                        </div>
                        <div style={{ marginTop: 8, fontSize: 13 }}>
                          Logged: <strong>{liveStats[selectedPlayer]?.successful_tackles || 0}</strong> / {liveStats[selectedPlayer]?.tackle_attempts || 0}
                        </div>
                      </div>
                    </div>
                    <button className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: 12 }} onClick={() => { refreshAlerts(); setSelectedPlayer(null); }}>
                      Save & Re-Analyze
                    </button>
                  </div>
                )}
              </div>

              {/* Bench Players */}
              <div className="card" style={{ marginBottom: 24 }}>
                <div className="section-header">
                  <div className="section-title">
                    Bench Substitutes
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                  {benchList.map((b, i) => (
                    <div key={i} className="player-card" style={{ padding: 12, gap: 4, flexDirection: 'row', alignItems: 'center' }}>
                      <div className="player-card-avatar" style={{ width: 28, height: 28, fontSize: 10 }}>
                        {b.player_name.split(' ').map(n=>n[0]).join('').substring(0, 2)}
                      </div>
                      <div>
                        <div className="console-player-name" style={{ fontSize: 13 }}>{b.player_name}</div>
                        <div className="console-player-pos" style={{ fontSize: 10 }}>{b.position}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Degradation alerts */}
              <div className="card">
                <div className="section-header">
                  <div className="section-title">
                    <AlertTriangle size={18} style={{ marginRight: 4, color: 'var(--text-muted)' }} />
                    Live Performance Monitor
                  </div>
                </div>

                <div className="degradation-monitor">
                  {alerts.length === 0 ? (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No roster degradation warnings logged.
                    </div>
                  ) : (
                    alerts.map((a, i) => (
                      <div key={i} className={`degradation-alert-box ${SEV_CLASS[a.severity]}`}>
                        <AlertTriangle className="degradation-alert-icon" />
                        <div className="degradation-alert-body">
                          <div className="degradation-alert-title">
                            {a.player_name} ({a.severity} Performance Degradation)
                          </div>
                          <div className="degradation-alert-desc">
                            {a.metric_label} dropped to {a.current}% (career baseline average: {a.historical}%). Severity Drop: -{a.drop_pct}%.
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sticky AI Recommendations Panel */}
            {/* Sticky AI Recommendations Panel */}
            {recs.length > 0 && (
              <div className="sticky-rec-panel">
                <div className="card floating-rec-card">
                  {/* Close circular X button like the PKL banner */}
                  <button 
                    className="pkl-floating-close-btn" 
                    onClick={() => isSimulating ? handleSimDecision(recs[0], false) : handleDecision(recs[0], false)}
                    title="Dismiss alert"
                  >
                    <X size={14} />
                  </button>

                  <div className="section-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.15)', paddingBottom: 8, marginBottom: 12 }}>
                    <div className="section-title" style={{ fontSize: 14, color: '#FFFFFF' }}>
                      <Brain size={16} style={{ marginRight: 6, color: '#FFD700' }} />
                      AI Recommendation Alert
                    </div>
                  </div>

                  {recs.map((rec) => (
                    <div key={rec.recommendation_id} className="recommendation-card" style={{ border: 'none', padding: 0, backgroundColor: 'transparent' }}>
                      <div className="rec-header-row" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 8, marginBottom: 12 }}>
                        <span className="rec-title-meta" style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.8)' }}>RECOMMENDED SWAP</span>
                        <span className="badge-position badge-mode-attack" style={{ fontSize: 9, backgroundColor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF' }}>{rec.mode} Mode</span>
                      </div>

                      <div className="swap-visualizer">
                        <div className="swap-player-side">
                          <div className="swap-player-action out" style={{ color: '#FF9B9B' }}>OUT</div>
                          <div className="swap-player-name" style={{ fontSize: 14, color: '#FFFFFF' }}>{rec.out_player}</div>
                          <div className="swap-player-val" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Impact: {rec.out_impact?.toFixed(1)}</div>
                        </div>
                        
                        <div className="swap-arrow" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                          <ArrowRight size={18} />
                        </div>

                        <div className="swap-player-side">
                          <div className="swap-player-action in" style={{ color: '#A3F5B8' }}>IN</div>
                          <div className="swap-player-name" style={{ fontSize: 14, color: '#FFFFFF' }}>{rec.in_player}</div>
                          <div className="swap-player-val" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Impact: {rec.in_impact?.toFixed(1)}</div>
                        </div>
                      </div>

                      <div className="rec-confidence-row" style={{ marginTop: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)' }}>AI Confidence Index</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{rec.confidence?.toFixed(1)}%</span>
                      </div>
                      
                      <div className="progress-track" style={{ width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                        <div className="progress-fill" style={{ width: `${rec.confidence}%`, backgroundColor: '#FFD700' }} />
                      </div>

                      <div style={{ border: '1px solid rgba(255, 255, 255, 0.2)', borderLeft: '3.5px solid #FFD700', borderRadius: 4, padding: 12, backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.7)', marginBottom: 2 }}>Expected Roster Gain</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>+{rec.impact_gain?.toFixed(1)} Net Impact</div>
                      </div>

                      <div className="rec-reasons-list" style={{ marginTop: 4 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 2 }}>Telemetry Evidence</div>
                        <div className="rec-reason-item">
                          <Info size={14} className="rec-reason-icon" style={{ color: '#FFD700' }} />
                          <span style={{ fontSize: 12, lineHeight: 1.4, color: '#FFFFFF' }}>{rec.reason}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        {isSimulating ? (
                          <button 
                            className="btn btn-sm btn-white-action" 
                            style={{ flex: 1 }} 
                            onClick={() => handleSimDecision(rec, true)}
                          >
                            Accept & Execute Swap
                          </button>
                        ) : (
                          <button 
                            className="btn btn-sm btn-white-action" 
                            style={{ flex: 1 }} 
                            onClick={() => handleDecision(rec, true)}
                          >
                            Accept Swap
                          </button>
                        )}
                        <button 
                          className="btn btn-sm btn-transparent-action" 
                          onClick={() => isSimulating ? handleSimDecision(rec, false) : handleDecision(rec, false)}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
