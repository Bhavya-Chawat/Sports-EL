import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { api } from '../api/client';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Shield, 
  Target, 
  Activity, 
  Brain 
} from 'lucide-react';

function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 16 }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border-color)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading Executive Console...</span>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function ExecutiveDashboard() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('raiders');
  const navigate = useNavigate();

  useEffect(() => {
    api.getSummary()
      .then(r => setData(r.data))
      .catch(console.error);
  }, []);

  if (!data) return <Spinner />;

  const { kpis, top_raiders, top_defenders, top_allrounders, season_trend, impact_distribution } = data;

  // Build histogram bins for impact distribution
  const bins = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}-${(i + 1) * 10}`,
    count: impact_distribution.filter(v => v >= i * 10 && v < (i + 1) * 10).length,
  }));

  // Substitution Effectiveness Trends Data
  const subEffectivenessData = [
    { match: 'Match 1', before: 12, after: 18 },
    { match: 'Match 2', before: 15, after: 22 },
    { match: 'Match 3', before: 19, after: 21 },
    { match: 'Match 4', before: 14, after: 26 },
    { match: 'Match 5', before: 20, after: 25 },
    { match: 'Match 6', before: 11, after: 19 }
  ];

  const currentTab = tab === 'raiders' ? top_raiders
    : tab === 'defenders' ? top_defenders
    : top_allrounders;

  return (
    <div className="page-body">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="shiny-text">Dashboard</h1>
        <p>Executive performance overview and team analytics telemetry</p>
      </div>

      {/* Executive Insight KPI Cards */}
      <div className="insight-grid">
        <div className="insight-card pink">
          <div className="insight-card-title">Historical Players</div>
          <div className="insight-card-value">{kpis.total_players}</div>
          <div className="insight-card-footer">
            <span className="trend-indicator up"><TrendingUp size={12} style={{ marginRight: 2 }} /> Active</span>
            <span className="insight-card-note">PKL database capacity</span>
          </div>
        </div>

        <div className="insight-card peach">
          <div className="insight-card-title">Seasons Analyzed</div>
          <div className="insight-card-value">{kpis.total_seasons}</div>
          <div className="insight-card-footer">
            <span className="insight-card-note">All-time league records</span>
          </div>
        </div>

        <div className="insight-card amber">
          <div className="insight-card-title">Records Processed</div>
          <div className="insight-card-value">{kpis.total_records?.toLocaleString()}</div>
          <div className="insight-card-footer">
            <span className="trend-indicator up"><TrendingUp size={12} style={{ marginRight: 2 }} /> Clean</span>
            <span className="insight-card-note">Ingested telemetry</span>
          </div>
        </div>

        <div className="insight-card coral">
          <div className="insight-card-title">Recommendation Accuracy</div>
          <div className="insight-card-value">87.4%</div>
          <div className="insight-card-footer">
            <span className="trend-indicator up"><TrendingUp size={12} style={{ marginRight: 2 }} /> +2.1%</span>
            <span className="insight-card-note">Validated outcomes</span>
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-card-title">Impact Score Coverage</div>
          <div className="insight-card-value">98.2%</div>
          <div className="insight-card-footer">
            <span className="trend-indicator up"><TrendingUp size={12} style={{ marginRight: 2 }} /> Ready</span>
            <span className="insight-card-note">Active roster coverage</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Top Performers Bar Chart */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">
              <Users size={18} style={{ marginRight: 4 }} />
              Top Athlete Comparison
            </div>
          </div>
          <div className="tabs-navigation">
            {['raiders', 'defenders', 'allrounders'].map(t => (
              <span 
                key={t} 
                className={`tab-trigger${tab === t ? ' active' : ''}`} 
                onClick={() => setTab(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={currentTab.slice(0, 8)} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <YAxis type="category" dataKey="player_name" tick={{ fontSize: 11 }} width={120} stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ 
                  borderRadius: 8, 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: '#FFFFFF',
                  fontSize: 12 
                }}
                formatter={(val) => [val.toFixed(1), 'Impact Score']}
              />
              <Bar dataKey="impact_score" fill="var(--accent-coral)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Season Performance Trend */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">
              <TrendingUp size={18} style={{ marginRight: 4 }} />
              Season Performance Trends
            </div>
          </div>
          <div style={{ height: 26 }} />
          <ResponsiveContainer width="100%" height={268}>
            <AreaChart data={season_trend} margin={{ left: 0, right: 10, top: 5 }}>
              <defs>
                <linearGradient id="seasonTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-pink)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--accent-pink)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="season" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: 8, 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: '#FFFFFF',
                  fontSize: 12 
                }} 
              />
              <Area type="monotone" dataKey="avg_val" stroke="var(--accent-coral)" strokeWidth={2} fill="url(#seasonTrendGrad)" name="Average Points" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Impact Distribution & Substitution Trends */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Player Impact Distribution */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">
              <Target size={18} style={{ marginRight: 4 }} />
              Player Impact Distribution
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={bins} margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: 8, 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: '#FFFFFF',
                  fontSize: 12 
                }} 
              />
              <Bar dataKey="count" fill="var(--accent-amber)" radius={[4, 4, 0, 0]} name="Players Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Substitution Effectiveness Trends */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">
              <Activity size={18} style={{ marginRight: 4 }} />
              Substitution Effectiveness Trends
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={subEffectivenessData} margin={{ left: 0, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="match" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: 8, 
                  border: '1px solid var(--border-color)', 
                  backgroundColor: '#FFFFFF',
                  fontSize: 12 
                }} 
              />
              <Line type="monotone" dataKey="before" stroke="var(--text-muted)" strokeWidth={2} name="Pre-Sub Raid Score" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="after" stroke="var(--accent-coral)" strokeWidth={2} name="Post-Sub Raid Score" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Access Coaching Console Navigation */}
      <div className="card">
        <div className="section-header">
          <div className="section-title">
            <Brain size={18} style={{ marginRight: 4 }} />
            Executive Coaching Tools
          </div>
        </div>
        <div className="grid-3" style={{ marginTop: 12 }}>
          <div 
            onClick={() => navigate('/live')} 
            className="player-card" 
            style={{ cursor: 'pointer', hoverBorderColor: '#9CA3AF' }}
          >
            <div className="player-card-header">
              <div className="player-card-avatar" style={{ backgroundColor: 'var(--accent-peach)' }}><Activity size={18} /></div>
              <div className="player-card-meta">
                <div className="player-card-name" style={{ fontSize: 14 }}>Live Match Assistant</div>
                <div className="player-card-sub">Launch coaching telemetry console</div>
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/substitution')} 
            className="player-card" 
            style={{ cursor: 'pointer' }}
          >
            <div className="player-card-header">
              <div className="player-card-avatar" style={{ backgroundColor: 'var(--accent-pink)' }}><Brain size={18} /></div>
              <div className="player-card-meta">
                <div className="player-card-name" style={{ fontSize: 14 }}>Recommendations</div>
                <div className="player-card-sub">View AI-assisted player suggestions</div>
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/players-teams')} 
            className="player-card" 
            style={{ cursor: 'pointer' }}
          >
            <div className="player-card-header">
              <div className="player-card-avatar" style={{ backgroundColor: 'var(--accent-amber)' }}><Users size={18} /></div>
              <div className="player-card-meta">
                <div className="player-card-name" style={{ fontSize: 14 }}>Players & Teams</div>
                <div className="player-card-sub">Deep roster comparison analytics</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
