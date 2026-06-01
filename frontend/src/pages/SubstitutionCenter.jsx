import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { api } from '../api/client';
import { 
  Brain, 
  UserMinus, 
  UserPlus, 
  TrendingUp, 
  Info, 
  Check, 
  X, 
  Pause,
  History as HistoryIcon,
  Activity,
  Award,
  Clock
} from 'lucide-react';

const MODE_CLASS = { ATTACK: 'badge-mode-attack', DEFENSE: 'badge-mode-defense', BALANCED: 'badge-mode-balanced' };

export default function SubstitutionCenter({ sessionId }) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  
  // Active Recs State
  const [recs, setRecs]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [outcomes, setOutcomes] = useState({});

  // History State
  const [historyList, setHistoryList] = useState([]);
  const [stats, setStats]             = useState(null);
  const [historyFilter, setHistoryFilter] = useState('all');

  const DEMO_SID = 'DEMO-PATNA-DELHI-2024';

  const loadActive = async (sid) => {
    if (!sid) return;
    setLoading(true);
    try {
      const r = await api.getRecommendations(sid);
      setRecs(r.data);
    } finally { setLoading(false); }
  };

  const loadHistory = async () => {
    try {
      const [h, s] = await Promise.all([api.getHistory(), api.getRecStats()]);
      setHistoryList(h.data);
      setStats(s.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'active') {
      loadActive(sessionId || DEMO_SID);
    } else {
      loadHistory();
    }
  }, [sessionId, activeTab]);

  const handleDecision = async (rec, accepted) => {
    const pts = outcomes[rec.recommendation_id] || { scored: 0, conceded: 0 };
    await api.submitOutcome(rec.recommendation_id, { accepted, points_scored_after: pts.scored, points_conceded_after: pts.conceded });
    setRecs(prev => prev.filter(r => r.recommendation_id !== rec.recommendation_id));
  };

  const filteredHistory = historyList.filter(r => {
    if (historyFilter === 'accepted') return r.accepted === 1;
    if (historyFilter === 'rejected') return r.accepted === 0 && r.accepted !== null;
    if (historyFilter === 'pending')  return r.accepted === null;
    return true;
  });

  return (
    <div className="page-body">
      {/* Page Header with Horizontal Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-color)', paddingBottom: 12, marginBottom: 32 }}>
        <div>
          <h1 className="shiny-text" style={{ fontSize: 'var(--title-page)', fontWeight: 800, fontFamily: 'var(--font-head)', letterSpacing: '-0.03em' }}>Recommendations Hub</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Manage active substitution guidelines and view continuous AI telemetry feedback logs</p>
        </div>

        <div className="tabs-navigation" style={{ margin: 0, borderBottom: 'none' }}>
          <span 
            className={`tab-trigger${activeTab === 'active' ? ' active' : ''}`} 
            onClick={() => setActiveTab('active')}
          >
            Active Decisions
          </span>
          <span 
            className={`tab-trigger${activeTab === 'history' ? ' active' : ''}`} 
            onClick={() => setActiveTab('history')}
          >
            Continuous Learning History
          </span>
        </div>
      </div>

      {/* ACTIVE RECOMMENDATIONS TAB */}
      {activeTab === 'active' && (
        <div>
          {/* Load indicator if no session is running */}
          {!sessionId && recs.length === 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="section-header">
                <div className="section-title">
                  <Brain size={18} style={{ marginRight: 4 }} />
                  Active Recommendations Telemetry
                </div>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 14 }}>
                No live coaching session active. Load the simulation session to view active recommendations.
              </p>
              <button className="btn btn-primary" onClick={() => loadActive(DEMO_SID)}>
                Load Simulation Session
              </button>
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: 16 }}>
              <div style={{ width: 32, height: 32, border: '3px solid var(--border-color)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Formulating substitution telemetry recommendations...</span>
            </div>
          )}

          {!loading && recs.length === 0 && sessionId && (
            <div className="card">
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Brain size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>No recommendations pending</h3>
                <p style={{ fontSize: 13 }}>All computed substitutions have been resolved, or no degradation has triggered recommendations.</p>
              </div>
            </div>
          )}

          {recs.map((rec) => (
            <div key={rec.recommendation_id} className="card" style={{ marginBottom: 24, borderTop: '4px solid var(--text-primary)' }}>
              {/* Header Row */}
              <div className="rec-header-row" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="rec-title-meta">RECOMMENDED SUBSTITUTION</span>
                  <span className={`badge-position ${MODE_CLASS[rec.mode] || 'badge-mode-balanced'}`}>
                    {rec.mode} Mode
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  REC ID: {rec.recommendation_id.substring(0, 8)}
                </span>
              </div>

              {/* Structured Swap Comparison Grid */}
              <div className="grid-2-1" style={{ gap: 24, marginBottom: 20 }}>
                {/* Visualizer swap */}
                <div className="swap-visualizer">
                  <div className="swap-player-side">
                    <div className="swap-player-action out" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <UserMinus size={14} /> OUT
                    </div>
                    <div className="swap-player-name">{rec.out_player}</div>
                    <div className="swap-player-val">Impact Score: {rec.out_impact?.toFixed(1)}</div>
                  </div>

                  <div className="swap-arrow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
                  </div>

                  <div className="swap-player-side">
                    <div className="swap-player-action in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <UserPlus size={14} /> IN
                    </div>
                    <div className="swap-player-name">{rec.in_player}</div>
                    <div className="swap-player-val">Impact Score: {rec.in_impact?.toFixed(1)}</div>
                  </div>
                </div>

                {/* Expected Impact Gain Badge */}
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, padding: 18, backgroundColor: 'var(--bg-main)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Expected Gain</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: rec.impact_gain >= 0 ? '#10B981' : '#EF4444', fontFamily: 'var(--font-head)' }}>
                    +{rec.impact_gain?.toFixed(1)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Net impact score increment</div>
                </div>
              </div>

              {/* Confidence Row */}
              <div style={{ marginBottom: 20 }}>
                <div className="rec-confidence-row" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>AI Confidence Index</span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{rec.confidence?.toFixed(1)}%</span>
                </div>
                <div className="progress-track" style={{ width: '100%' }}>
                  <div className="progress-fill" style={{ width: `${rec.confidence}%` }} />
                </div>
              </div>

              {/* Evidence Reason (No alerts, elegant data card) */}
              <div style={{ border: '1px solid var(--border-color)', borderLeft: '4px solid var(--text-primary)', borderRadius: 4, padding: 14, backgroundColor: 'var(--bg-main)', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Info size={16} style={{ color: 'var(--text-primary)', flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                    <strong>Evidence Logic:</strong> {rec.reason}
                  </div>
                </div>
              </div>

              {/* Outcome Telemetry Inputs */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Outcome Telemetry (Optional)</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Points Scored After Substitution</label>
                    <input 
                      type="number" 
                      min={0} 
                      placeholder="e.g. 6" 
                      className="form-input"
                      onChange={e => setOutcomes(o => ({ ...o, [rec.recommendation_id]: { ...o[rec.recommendation_id], scored: +e.target.value } }))} 
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Points Conceded After Substitution</label>
                    <input 
                      type="number" 
                      min={0} 
                      placeholder="e.g. 4" 
                      className="form-input"
                      onChange={e => setOutcomes(o => ({ ...o, [rec.recommendation_id]: { ...o[rec.recommendation_id], conceded: +e.target.value } }))} 
                    />
                  </div>
                </div>
              </div>

              {/* Action Row */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-primary" onClick={() => handleDecision(rec, true)}>
                  <Check size={14} style={{ marginRight: 2 }} /> Accept & Execute
                </button>
                <button className="btn btn-secondary" onClick={() => handleDecision(rec, false)}>
                  <X size={14} style={{ marginRight: 2 }} /> Reject
                </button>
                <button className="btn btn-secondary" onClick={() => setRecs(prev => prev.filter(r => r.recommendation_id !== rec.recommendation_id))}>
                  <Pause size={14} style={{ marginRight: 2 }} /> Defer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* HISTORICAL LEARNING LEDGER TAB */}
      {activeTab === 'history' && (
        <div>
          {/* Executive Insight Cards */}
          {stats && (
            <div className="insight-grid" style={{ marginBottom: 24 }}>
              <div className="insight-card pink">
                <div className="insight-card-title">Total Recommendations</div>
                <div className="insight-card-value">{stats.total_recommendations}</div>
                <div className="insight-card-footer">
                  <span className="insight-card-note">Decisions dispatched</span>
                </div>
              </div>

              <div className="insight-card peach">
                <div className="insight-card-title">Accepted Decisions</div>
                <div className="insight-card-value">{stats.accepted}</div>
                <div className="insight-card-footer">
                  <span className="insight-card-note">Implemented by coaching staff</span>
                </div>
              </div>

              <div className="insight-card amber">
                <div className="insight-card-title">Acceptance Rate</div>
                <div className="insight-card-value">{stats.acceptance_rate}%</div>
                <div className="insight-card-footer">
                  <span className="trend-indicator up"><TrendingUp size={12} style={{ marginRight: 2 }} /> Active</span>
                  <span className="insight-card-note">Adoption index</span>
                </div>
              </div>

              <div className="insight-card coral">
                <div className="insight-card-title">Success Rate</div>
                <div className="insight-card-value">{stats.success_rate}%</div>
                <div className="insight-card-footer">
                  <span className="trend-indicator up"><TrendingUp size={12} style={{ marginRight: 2 }} /> Validated</span>
                  <span className="insight-card-note">Roster outcome efficacy</span>
                </div>
              </div>
            </div>
          )}

          {/* AI Learning Curve Chart */}
          {stats?.learning_curve?.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="section-header">
                <div className="section-title">
                  <Activity size={18} style={{ marginRight: 4 }} />
                  AI Learning Curve - Cumulative Success Rate
                </div>
              </div>
              <div style={{ height: 16 }} />
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats.learning_curve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="index" label={{ value: 'Decisions Logged', position: 'bottom', fontSize: 11, fill: 'var(--text-muted)' }} tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} stroke="#9CA3AF" />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid var(--border-color)', backgroundColor: '#FFFFFF' }} 
                    formatter={v => [`${v}%`, 'Success Rate']} 
                  />
                  <ReferenceLine y={50} stroke="var(--accent-coral)" strokeDasharray="4 4" label={{ value: '50% Baseline', fontSize: 10, fill: 'var(--accent-coral)' }} />
                  <Line type="monotone" dataKey="cumulative_success_rate" stroke="var(--text-primary)" strokeWidth={2} dot={false} name="Success Rate" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* History Data Table */}
          <div className="card">
            <div className="section-header" style={{ marginBottom: 20 }}>
              <div className="section-title">
                <HistoryIcon size={18} style={{ marginRight: 4 }} />
                Substitution Decision Ledger
              </div>
              
              <div className="tabs-navigation" style={{ margin: 0, borderBottom: 'none' }}>
                {['all', 'accepted', 'rejected', 'pending'].map(f => (
                  <span 
                    key={f} 
                    className={`tab-trigger${historyFilter === f ? ' active' : ''}`} 
                    onClick={() => setHistoryFilter(f)}
                    style={{ padding: '6px 12px', fontSize: 13 }}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </span>
                ))}
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <HistoryIcon size={24} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p>No decision logs found matching this filter.</p>
              </div>
            ) : (
              <div className="executive-table-wrapper">
                <table className="executive-table">
                  <thead>
                    <tr>
                      <th>Mode</th>
                      <th>OUT Player</th>
                      <th>IN Player</th>
                      <th>Confidence Index</th>
                      <th>Net Gain</th>
                      <th>Coaching Action</th>
                      <th>Match Outcome</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((r, i) => (
                      <tr key={i}>
                        <td>
                          <span className={`badge-position ${MODE_CLASS[r.mode] || 'badge-mode-balanced'}`}>{r.mode}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{r.out_player}</td>
                        <td style={{ fontWeight: 600 }}>{r.in_player}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="progress-track" style={{ width: 80, height: 5, backgroundColor: 'var(--border-color)', borderRadius: 2 }}>
                              <div className="progress-fill" style={{ width: `${r.confidence}%`, height: '100%', borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700 }}>{r.confidence?.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: r.impact_gain >= 0 ? '#10B981' : '#EF4444' }}>
                            +{r.impact_gain?.toFixed(1)}
                          </span>
                        </td>
                        <td>
                          {r.accepted === null ? (
                            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Pending</span>
                          ) : r.accepted ? (
                            <span style={{ color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Check size={12} /> Accepted</span>
                          ) : (
                            <span style={{ color: '#EF4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><X size={12} /> Rejected</span>
                          )}
                        </td>
                        <td>
                          {r.successful === null ? (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          ) : r.successful ? (
                            <span style={{ color: '#10B981', fontWeight: 600 }}>Efficacious</span>
                          ) : (
                            <span style={{ color: '#EF4444', fontWeight: 600 }}>Ineffective</span>
                          )}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {r.created_at ? new Date(r.created_at).toLocaleDateString() + ' ' + new Date(r.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
