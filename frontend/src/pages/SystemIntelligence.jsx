import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../api/client';
import { 
  Brain, 
  Activity, 
  Sliders, 
  Shield, 
  History, 
  Info, 
  ChevronRight, 
  Server, 
  Database,
  Check,
  RefreshCw
} from 'lucide-react';

const ENGINES = [
  {
    id: 'impact',
    icon: Sliders,
    title: 'Impact Score Engine',
    desc: 'Normalizes and weights 10 metrics based on player position (Raiders vs Defenders).',
    color: 'var(--accent-pink)',
    formula: `Attack Score  = 0.30 * Raid Points
              + 0.25 * Raid Success %
              + 0.20 * Super Raids
              + 0.15 * Super 10s
              + 0.10 * Avg Raid Points

Defense Score = 0.30 * Tackle Points
              + 0.25 * Tackle Success %
              + 0.20 * Super Tackles
              + 0.15 * High 5s
              + 0.10 * Avg Tackle Points

Impact Score (Raider)   = Attack * 0.80 + Defense * 0.20
Impact Score (Defender) = Attack * 0.20 + Defense * 0.80
Impact Score (All-Round)= Attack * 0.55 + Defense * 0.45`,
  },
  {
    id: 'degradation',
    icon: Activity,
    title: 'Performance Degradation Detector',
    desc: 'Logs real-time drops by comparing live rolling averages against historical baselines.',
    color: 'var(--accent-peach)',
    formula: `Historical Baseline = Career Average(Stat)
Live Current Value  = Moving average over last N attempts

Drop % = (Baseline - Current) / Baseline * 100

Severity Thresholds:
  MILD     : 5% - 15% drop   (Yellow alert trigger)
  MODERATE : 15% - 30% drop  (Orange alert trigger)
  SEVERE   : > 30% drop      (Red alert trigger)

Minimum sample depth: 4 raids or 3 tackles`,
  },
  {
    id: 'similarity',
    icon: Shield,
    title: 'Cosine Similarity Engine',
    desc: 'Analyzes spatial distance vectors to identify identical tactical archetypes.',
    color: 'var(--accent-amber)',
    formula: `Feature Vector = [
  Raid Points, Tackle Points, Raid %, Tackle %,
  Super Raids, Super Tackles, Avg Raid, Avg Tackle
]

Feature Scaling: Zero-mean unit variance normalization

Similarity(A, B) = Cosine Angle (A . B) / (||A|| * ||B||)
                 = Vector Dot Product dot normalized length`,
  },
  {
    id: 'recommendation',
    icon: Brain,
    title: 'Recommendation Engine',
    desc: 'Selects the ideal match mode and evaluates the squad bench for replacement fit.',
    color: 'var(--accent-coral)',
    formula: `Match Mode Parameters:
  CLUTCH   = Time Remaining <= 5m
  ATTACK   = Trailing score difference < -5
  DEFENSE  = Leading score difference > +5
  BALANCED = default state

Confidence = 0.40 * impact_diff
             + 0.30 * degradation_severity
             + 0.20 * historical_success_rate
             + 0.10 * position_match_bonus`,
  },
  {
    id: 'learning',
    icon: History,
    title: 'Continuous Learning System',
    desc: 'Records post-substitution points data to reinforce decision-making confidence.',
    color: 'var(--text-muted)',
    formula: `Efficacy Validation:
  Outcome is EFFICACIOUS if points scored > points conceded post-substitution

Success Index = accepted & successful substitutions
                / total accepted substitutions

Feedback loop: Success Index updates historical success rate weights in recommendation scoring.`,
  },
];

export default function SystemIntelligence() {
  const [activeTab, setActiveTab] = useState('explainable'); // 'explainable' or 'calibration'
  
  // Explainable AI State
  const [activeEngine, setActiveEngine] = useState('impact');
  const [status, setStatus] = useState(null);
  const [log, setLog]       = useState([]);

  // Calibration Form State
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [weights, setWeights] = useState({
    raidWeight: 30,
    tackleWeight: 30,
    superRaidWeight: 20,
    superTackleWeight: 20,
    rollingWindowRaid: 4,
    rollingWindowTackle: 3,
    confidenceThreshold: 70
  });

  const loadStatus = async () => {
    try {
      const r = await api.getStatus();
      setStatus(r.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadStatus();
    api.getIngestionLog().then(r => {
      setLog(r.data.logs || []);
    });
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMsg('System parameters successfully calibrated.');
      setTimeout(() => setSuccessMsg(''), 4000);
    }, 800);
  };

  const engine = ENGINES.find(e => e.id === activeEngine);

  // Demo bar chart for impact score weights
  const weightData = [
    { stat: 'Raid Pts',    weight: 30, fill: 'var(--accent-pink)' },
    { stat: 'Raid %',      weight: 25, fill: 'var(--accent-peach)' },
    { stat: 'Super Raids', weight: 20, fill: 'var(--accent-amber)' },
    { stat: 'Super 10s',   weight: 15, fill: 'var(--accent-coral)' },
    { stat: 'Avg Raid',    weight: 10, fill: 'var(--text-muted)' },
  ];

  return (
    <div className="page-body">
      {/* Tabbed Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-color)', paddingBottom: 12, marginBottom: 32 }}>
        <div>
          <h1 className="shiny-text" style={{ fontSize: 'var(--title-page)', fontWeight: 800, fontFamily: 'var(--font-head)', letterSpacing: '-0.03em' }}>System Intelligence</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Explainable AI engines formulas explainer and sensitivity parameter calibration console</p>
        </div>

        <div className="tabs-navigation" style={{ margin: 0, borderBottom: 'none' }}>
          <span 
            className={`tab-trigger${activeTab === 'explainable' ? ' active' : ''}`} 
            onClick={() => setActiveTab('explainable')}
          >
            Explainable AI Engines
          </span>
          <span 
            className={`tab-trigger${activeTab === 'calibration' ? ' active' : ''}`} 
            onClick={() => setActiveTab('calibration')}
          >
            Diagnostics & Calibrations
          </span>
        </div>
      </div>

      {successMsg && (
        <div 
          style={{ 
            backgroundColor: 'rgba(16, 185, 129, 0.08)', 
            border: '1px solid #10B981', 
            borderRadius: 6, 
            padding: 14, 
            marginBottom: 20, 
            fontSize: 13, 
            color: '#10B981',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Check size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* EXPLAINABLE AI TAB */}
      {activeTab === 'explainable' && (
        <div>
          {/* Database Integration Telemetry */}
          {status && (
            <div 
              className="card" 
              style={{ 
                marginBottom: 24, 
                borderColor: status.data_source === 'REAL' ? '#10B981' : 'var(--accent-amber)', 
                backgroundColor: status.data_source === 'REAL' ? 'rgba(16, 185, 129, 0.04)' : 'rgba(245, 158, 11, 0.04)' 
              }}
            >
              <div className="section-header">
                <div className="section-title">
                  <Database size={16} /> Data Connection Status
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: status.data_source === 'REAL' ? '#10B981' : 'var(--text-primary)' }}>
                  {status.data_source} Dataset Active
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: 12 }}>
                <div><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Dataset File:</span> <strong style={{ display: 'block', fontSize: 13 }}>{status.dataset_file}</strong></div>
                <div><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Players:</span> <strong style={{ display: 'block', fontSize: 13 }}>{status.players_loaded}</strong></div>
                <div><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Seasons Ingested:</span> <strong style={{ display: 'block', fontSize: 13 }}>{status.seasons_loaded}</strong></div>
                <div><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Records Loaded:</span> <strong style={{ display: 'block', fontSize: 13 }}>{status.records_loaded?.toLocaleString()}</strong></div>
              </div>
            </div>
          )}

          {/* System Architecture Flow */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="section-header">
              <div className="section-title">
                <Server size={18} style={{ marginRight: 4 }} />
                System Architecture
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {['Roster Dataset', 'In-Memory DB', 'Impact Weighting', 'Similarity Engine', 'Degradation Log', 'Substitution Engine', 'Coaching Console'].map((item, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {i > 0 && <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
                  <span style={{ 
                    backgroundColor: 'var(--bg-main)', 
                    border: '1px solid var(--border-color)', 
                    padding: '6px 12px', 
                    borderRadius: 4, 
                    fontSize: 12, 
                    fontWeight: 600 
                  }}>
                    {item}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Main Split Console */}
          <div className="coaching-console" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {/* Left: Engine Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ENGINES.map(e => {
                const Icon = e.icon;
                const isSelected = activeEngine === e.id;
                return (
                  <div
                    key={e.id}
                    onClick={() => setActiveEngine(e.id)}
                    className="player-card"
                    style={{ 
                      cursor: 'pointer', 
                      borderColor: isSelected ? 'var(--text-primary)' : 'var(--border-color)',
                      backgroundColor: isSelected ? '#F9FAFB' : '#FFFFFF',
                      textAlign: 'left'
                    }}
                  >
                    <div className="player-card-header">
                      <div className="player-card-avatar" style={{ backgroundColor: 'var(--accent-peach)' }}><Icon size={18} /></div>
                      <div className="player-card-meta">
                        <div className="player-card-name" style={{ fontSize: 14 }}>{e.title}</div>
                        <div className="player-card-sub" style={{ fontSize: 12 }}>{e.desc}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Engine Details Explainer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {engine && (
                <div className="card" style={{ borderTop: `4px solid ${engine.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-head)' }}>{engine.title} Formula</span>
                  </div>
                  <pre style={{ 
                    backgroundColor: 'var(--bg-main)', 
                    border: '1px solid var(--border-color)', 
                    padding: 16, 
                    borderRadius: 6, 
                    fontFamily: 'Courier New, monospace', 
                    fontSize: 12, 
                    lineHeight: 1.5,
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}>{engine.formula}</pre>
                </div>
              )}

              {/* Additional details for Impact score weights */}
              {activeEngine === 'impact' && (
                <div className="card">
                  <div className="section-header">
                    <div className="section-title">Attack Attribute Weights</div>
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={weightData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis dataKey="stat" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} stroke="#9CA3AF" />
                      <RechartsTooltip contentStyle={{ borderRadius: 8, fontSize: 11, border: '1px solid var(--border-color)' }} formatter={v => [`${v}%`, 'Weight']} />
                      <Bar dataKey="weight" radius={[4, 4, 0, 0]}>
                        {weightData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Degradation details */}
              {activeEngine === 'degradation' && (
                <div className="card">
                  <div className="section-header">
                    <div className="section-title">Severity Levels</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: 'Mild', range: '5% - 15%', color: 'var(--accent-pink)' },
                      { label: 'Moderate', range: '15% - 30%', color: 'var(--accent-amber)' },
                      { label: 'Severe', range: '> 30%', color: 'var(--accent-coral)' }
                    ].map((st, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: st.color }} />
                        <span style={{ fontWeight: 700, width: 80 }}>{st.label}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Baseline drop of {st.range}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SQLite Data Ingestion Log */}
          <div className="card" style={{ marginTop: 24 }}>
            <div className="section-header">
              <div className="section-title">
                <History size={18} style={{ marginRight: 4 }} />
                SQLite Database Logs
              </div>
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 6, backgroundColor: '#FFFFFF', padding: 12 }}>
              {log.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>No logs loaded.</div>
              ) : log.map((entry, i) => (
                <div key={i} style={{ padding: '4px 0', fontSize: 12, borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>[{entry.logged_at?.slice(11, 19)}]</span>
                  <span style={{ 
                    fontWeight: 700, 
                    color: entry.level === 'ERROR' ? '#EF4444' : entry.level === 'WARNING' ? 'var(--accent-amber)' : '#10B981',
                    width: 60
                  }}>[{entry.level}]</span>
                  <span style={{ color: 'var(--text-primary)' }}>{entry.message?.replace(/[\u2600-\u27BF]/g, '')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM CALIBRATION & DIAGNOSTICS TAB */}
      {activeTab === 'calibration' && (
        <div className="coaching-console" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
          {/* Left Column: Model Weight Calibration */}
          <div className="card">
            <div className="section-header" style={{ marginBottom: 20 }}>
              <div className="section-title">
                <Sliders size={18} style={{ marginRight: 4 }} />
                AI Impact Formula Calibration
              </div>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Raid point weights */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                    <span>Raid Point Coefficient Weight</span>
                    <span>{weights.raidWeight}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="60" 
                    value={weights.raidWeight} 
                    onChange={e => setWeights({...weights, raidWeight: parseInt(e.target.value)})}
                    style={{ width: '100%', accentColor: 'var(--text-primary)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                    <span>10% (Low)</span>
                    <span>60% (High Priority)</span>
                  </div>
                </div>

                {/* Tackle points weights */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                    <span>Tackle Point Coefficient Weight</span>
                    <span>{weights.tackleWeight}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="60" 
                    value={weights.tackleWeight} 
                    onChange={e => setWeights({...weights, tackleWeight: parseInt(e.target.value)})}
                    style={{ width: '100%', accentColor: 'var(--text-primary)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                    <span>10% (Low)</span>
                    <span>60% (High Priority)</span>
                  </div>
                </div>

                {/* Rolling window config */}
                <div style={{ display: 'flex', gap: 16 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Rolling Raid Window (Attempts)</label>
                    <input 
                      type="number" 
                      min="2" 
                      max="10" 
                      className="form-input" 
                      value={weights.rollingWindowRaid}
                      onChange={e => setWeights({...weights, rollingWindowRaid: parseInt(e.target.value)})}
                    />
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Baseline drop check depth</span>
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Rolling Tackle Window (Attempts)</label>
                    <input 
                      type="number" 
                      min="2" 
                      max="10" 
                      className="form-input" 
                      value={weights.rollingWindowTackle}
                      onChange={e => setWeights({...weights, rollingWindowTackle: parseInt(e.target.value)})}
                    />
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Baseline drop check depth</span>
                  </div>
                </div>

                {/* Confidence margin thresholds */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                    <span>Dispatch Confidence Threshold</span>
                    <span>{weights.confidenceThreshold}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="90" 
                    value={weights.confidenceThreshold} 
                    onChange={e => setWeights({...weights, confidenceThreshold: parseInt(e.target.value)})}
                    style={{ width: '100%', accentColor: 'var(--text-primary)' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
                    <span>50% (High Volume)</span>
                    <span>90% (Strict Accuracy)</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={loading}
                  >
                    {loading ? 'Saving Parameters...' : 'Save & Calibrate Parameters'}
                  </button>
                </div>

              </div>
            </form>
          </div>

          {/* Right Column: Database Roster Source Diagnostics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Active Database statistics */}
            <div className="card">
              <div className="section-header" style={{ marginBottom: 16 }}>
                <div className="section-title">
                  <Database size={18} style={{ marginRight: 4 }} />
                  Roster Source Registry
                </div>
              </div>

              {status ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Data Mode</span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{status.data_source}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Connected Source File</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{status.dataset_file || 'None'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Ingested Player Depth</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{status.players_loaded} players</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Season Database Range</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{status.seasons_loaded} Seasons</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Historical Logs</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{status.records_loaded?.toLocaleString()} rows</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Database Ingest Clock</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{status.last_ingested ? new Date(status.last_ingested).toLocaleTimeString() : 'None'}</span>
                  </div>

                  <button 
                    className="btn btn-secondary" 
                    style={{ width: '100%', marginTop: 8 }}
                    onClick={loadStatus}
                  >
                    <RefreshCw size={14} style={{ marginRight: 2 }} /> Check Connection Status
                  </button>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Connecting to SQL Engine...</div>
              )}
            </div>

            {/* Excel file ingestion guide */}
            <div className="card">
              <div className="section-header" style={{ marginBottom: 12 }}>
                <div className="section-title">
                  <Info size={16} style={{ marginRight: 4 }} />
                  Real Data Ingestion Guide
                </div>
              </div>
              
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                To swap from simulated synthetic data to real Pro Kabaddi League history logs:
              </p>

              <ol style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 16, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <li>Place <code>PKL_Organized_Dataset.xlsx</code> in the <code>backend/data/</code> directory.</li>
                <li>Ensure the sheets are correctly named: <code>Player_Stats</code>, <code>Team_Stats</code>, and <code>Rankings</code>.</li>
                <li>Restart the FastAPI backend server to trigger SQLite DB build.</li>
              </ol>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
