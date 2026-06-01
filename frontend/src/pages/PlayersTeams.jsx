import { useState, useEffect } from 'react';
import { 
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { api } from '../api/client';
import { 
  Users, 
  Search, 
  Radar as RadarIcon, 
  TrendingUp, 
  Shield, 
  Activity, 
  Info,
  ChevronRight
} from 'lucide-react';

const RADAR_STATS = [
  { key: 'Player Raid Points',            label: 'Raid Pts' },
  { key: 'Player Tackle Points',          label: 'Tackle Pts' },
  { key: 'Player Successful Raid Percent', label: 'Raid %' },
  { key: 'Player Successful Tackle Percent', label: 'Tackle %' },
  { key: 'Super 10s',                     label: 'Super 10s' },
  { key: 'High 5s',                       label: 'High 5s' },
];

const POSITION_CLASSES = { Raider: 'badge-raider', Defender: 'badge-defender', 'All-Rounder': 'badge-allrounder' };
const COMPARE_STATS = ['Team Raid Points','Team Tackle Points','Team Total Points','Team Successful Raids','Team Successful Tackles','Team Super Raid','Team Super Tackles'];

export default function PlayersTeams() {
  const [activeTab, setActiveTab] = useState('players'); // 'players' or 'teams'

  // Players State
  const [players, setPlayers]   = useState([]);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail]     = useState(null);
  const [similar, setSimilar]   = useState([]);
  const [trend, setTrend]       = useState([]);

  // Teams State
  const [teams, setTeams]       = useState([]);
  const [teamA, setTeamA]       = useState('');
  const [teamB, setTeamB]       = useState('');
  const [teamDetail, setTeamDetail] = useState(null);
  const [comparison, setComparison] = useState(null);

  // Load Initial Lists
  useEffect(() => {
    api.getPlayers({ limit: 300 }).then(r => setPlayers(r.data));
    api.getTeams().then(r => setTeams(r.data));
  }, []);

  // Filtered Players
  const filteredPlayers = players.filter(p =>
    p.player_name.toLowerCase().includes(search.toLowerCase())
  );

  // Select Player Handler
  const selectPlayer = async (p) => {
    setSelected(p);
    const [det, sim, tr] = await Promise.all([
      api.getPlayer(p.player_id),
      api.getSimilar(p.player_id, 6),
      api.getPlayerTrend(p.player_id),
    ]);
    setDetail(det.data);
    setSimilar(sim.data);
    setTrend(tr.data);
  };

  // Select Team Handler
  const loadTeamDetail = async (name) => {
    const t = teams.find(t => t.team_name === name);
    if (!t) return;
    const r = await api.getTeam(t.team_id);
    setTeamDetail(r.data);
  };

  // Compare Teams Handler
  const loadComparison = async () => {
    const ta = teams.find(t => t.team_name === teamA);
    const tb = teams.find(t => t.team_name === teamB);
    if (!ta || !tb) return;
    const r = await api.compareTeams(ta.team_id, tb.team_id);
    setComparison(r.data);
  };

  // Radar chart data for player
  const playerRadarData = RADAR_STATS.map(rs => {
    const statRows = detail?.stats?.filter(s => s.stat_name === rs.key) || [];
    const avg = statRows.length ? statRows.reduce((a, b) => a + b.stat_value, 0) / statRows.length : 0;
    return { subject: rs.label, value: Math.round(avg) };
  });

  // Trend data for player
  const playerTrendData = trend.map(t => ({
    season: t.season?.replace('Season ', 'S'),
    points: t['Player Total Points'] ? Math.round(t['Player Total Points']) : 0,
    raids:  t['Player Raid Points']  ? Math.round(t['Player Raid Points'])  : 0,
  }));

  // Radar chart data for teams
  const teamComparisonData = comparison ? COMPARE_STATS.map(s => ({
    stat: s.replace('Team ', '').replace('Successful ', '').replace('Average ', 'Avg '),
    a: Math.round(comparison.team_a.stats[s] || 0),
    b: Math.round(comparison.team_b.stats[s] || 0),
  })) : [];

  return (
    <div className="page-body">
      <div className="page-header">
        <h1 className="shiny-text">Players & Teams</h1>
        <p>Compare team attributes and review deep athlete analytics profiles</p>
      </div>

      {/* Tabs Menu */}
      <div className="tabs-navigation" style={{ marginBottom: 24 }}>
        <span 
          className={`tab-trigger${activeTab === 'players' ? ' active' : ''}`} 
          onClick={() => setActiveTab('players')}
        >
          <Users size={16} style={{ marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom' }} />
          Player Profiles
        </span>
        <span 
          className={`tab-trigger${activeTab === 'teams' ? ' active' : ''}`} 
          onClick={() => setActiveTab('teams')}
        >
          <Shield size={16} style={{ marginRight: 6, display: 'inline-block', verticalAlign: 'text-bottom' }} />
          Team Roster & Comparison
        </span>
      </div>

      {/* Players tab */}
      {activeTab === 'players' && (
        <div className="grid-1-2">
          {/* Left panel: Search and select */}
          <div className="card">
            <div className="section-header">
              <div className="section-title">Athlete Roster</div>
            </div>
            
            <div className="form-group" style={{ position: 'relative' }}>
              <input 
                className="form-input" 
                placeholder="Search athlete by name..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                style={{ paddingLeft: 36 }}
              />
              <Search size={16} style={{ position: 'absolute', left: 12, top: 38, color: 'var(--text-muted)' }} />
            </div>

            <div style={{ maxHeight: 520, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
              {filteredPlayers.slice(0, 50).map(p => {
                const initials = p.player_name.split(' ').map(n=>n[0]).join('').substring(0, 2);
                const isSelected = selected?.player_id === p.player_id;
                return (
                  <div 
                    key={p.player_id}
                    onClick={() => selectPlayer(p)}
                    className="console-player-item"
                    style={{ 
                      textAlign: 'left', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 12, 
                      padding: '10px 12px',
                      borderColor: isSelected ? 'var(--text-primary)' : 'var(--border-color)',
                      backgroundColor: isSelected ? '#F9FAFB' : '#FFFFFF'
                    }}
                  >
                    <div className="player-card-avatar" style={{ width: 34, height: 34, fontSize: 12, backgroundColor: 'var(--accent-peach)' }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="console-player-name" style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.player_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.team}</div>
                    </div>
                    <span className={`badge-position ${POSITION_CLASSES[p.position] || ''}`} style={{ fontSize: 9 }}>{p.position}</span>
                    <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 14 }}>
                      {p.impact_score?.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel: Details */}
          <div>
            {detail ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Profile header */}
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <div className="player-card-avatar" style={{ width: 64, height: 64, fontSize: 20 }}>
                    {detail.player_name.split(' ').map(n=>n[0]).join('').substring(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800 }}>{detail.player_name}</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 6 }}>{detail.team}</p>
                    <span className={`badge-position ${POSITION_CLASSES[detail.position] || ''}`}>{detail.position}</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 20 }}>
                    {[
                      { label: 'Impact', val: detail.impact_score?.toFixed(1), color: 'var(--text-primary)' },
                      { label: 'Attack', val: detail.attack_score?.toFixed(1), color: 'var(--text-muted)' },
                      { label: 'Defense', val: detail.defense_score?.toFixed(1), color: 'var(--text-muted)' }
                    ].map((st, i) => (
                      <div key={i} style={{ textAlign: 'center', minWidth: 60 }}>
                        <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 800, color: st.color }}>{st.val}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{st.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid-2">
                  {/* Radar */}
                  <div className="card">
                    <div className="section-header">
                      <div className="section-title">
                        <RadarIcon size={16} /> Performance Radar
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={playerRadarData}>
                        <PolarGrid stroke="var(--border-color)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis tick={false} />
                        <Radar dataKey="value" stroke="var(--accent-coral)" fill="var(--accent-coral)" fillOpacity={0.25} strokeWidth={1.5} />
                        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid var(--border-color)' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Trend line */}
                  <div className="card">
                    <div className="section-header">
                      <div className="section-title">
                        <TrendingUp size={16} /> Season Points Trend
                      </div>
                    </div>
                    {playerTrendData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={playerTrendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                          <XAxis dataKey="season" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                          <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid var(--border-color)' }} />
                          <Line type="monotone" dataKey="points" stroke="var(--text-primary)" strokeWidth={2} dot={{ r: 4 }} name="Total Points" />
                          <Line type="monotone" dataKey="raids" stroke="var(--accent-coral)" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 3 }} name="Raid Points" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                        No multi-season data logged.
                      </div>
                    )}
                  </div>
                </div>

                {/* Similar Players archetype scroll */}
                {similar.length > 0 && (
                  <div className="card">
                    <div className="section-header">
                      <div className="section-title">
                        Similar Athlete Archetypes
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                      {similar.map((s, i) => (
                        <div 
                          key={i} 
                          className="player-card"
                          style={{ padding: 14, gap: 10, cursor: 'default' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{s.similarity_pct?.toFixed(0)}% Match</span>
                            <span className={`badge-position ${POSITION_CLASSES[s.position] || ''}`} style={{ fontSize: 9 }}>{s.position}</span>
                          </div>
                          <div>
                            <div className="console-player-name" style={{ fontSize: 13 }}>{s.player_name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.team}</div>
                          </div>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            style={{ width: '100%' }}
                            onClick={() => selectPlayer({ player_id: s.player_id, player_name: s.player_name, team: s.team, position: s.position })}
                          >
                            Analyze
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 340, color: 'var(--text-muted)' }}>
                <div style={{ textAlign: 'center' }}>
                  <Users size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p>Choose an athlete from the roster to view active diagnostics.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Teams tab */}
      {activeTab === 'teams' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Compare widget */}
          <div className="card">
            <div className="section-header">
              <div className="section-title">Head-to-Head Comparison</div>
            </div>
            
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
                <label className="form-label">Team A</label>
                <select className="form-select" value={teamA} onChange={e => setTeamA(e.target.value)}>
                  <option value="">Select Team...</option>
                  {teams.map(t => <option key={t.team_id} value={t.team_name}>{t.team_name}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
                <label className="form-label">Team B</label>
                <select className="form-select" value={teamB} onChange={e => setTeamB(e.target.value)}>
                  <option value="">Select Team...</option>
                  {teams.map(t => <option key={t.team_id} value={t.team_name}>{t.team_name}</option>)}
                </select>
              </div>

              <button className="btn btn-primary" onClick={loadComparison} disabled={!teamA || !teamB || teamA === teamB}>
                Compare Teams
              </button>
            </div>

            {comparison && (
              <div style={{ marginTop: 24, borderTop: '1px solid var(--border-color)', paddingTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800 }}>{comparison.team_a.team_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Team A</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)' }}>VS</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800 }}>{comparison.team_b.team_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Team B</div>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="card" style={{ border: 'none', padding: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textAlign: 'center' }}>Comparative Radar Matrix</div>
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart data={teamComparisonData}>
                        <PolarGrid stroke="var(--border-color)" />
                        <PolarAngleAxis dataKey="stat" tick={{ fontSize: 9 }} />
                        <PolarRadiusAxis tick={false} />
                        <Radar dataKey="a" name={comparison.team_a.team_name} stroke="var(--accent-coral)" fill="var(--accent-coral)" fillOpacity={0.2} strokeWidth={1.5} />
                        <Radar dataKey="b" name={comparison.team_b.team_name} stroke="var(--text-primary)" fill="var(--text-primary)" fillOpacity={0.05} strokeWidth={1.5} />
                        <Legend />
                        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid var(--border-color)' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="card" style={{ border: 'none', padding: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textAlign: 'center' }}>Direct Value Comparison</div>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={teamComparisonData} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis type="number" tick={{ fontSize: 10 }} stroke="#9CA3AF" />
                        <YAxis type="category" dataKey="stat" tick={{ fontSize: 10 }} width={90} stroke="#9CA3AF" />
                        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid var(--border-color)' }} />
                        <Legend />
                        <Bar dataKey="a" name={comparison.team_a.team_name} fill="var(--accent-coral)" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="b" name={comparison.team_b.team_name} fill="var(--text-primary)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Roster database search */}
          <div className="card">
            <div className="section-header">
              <div className="section-title">Team Roster Explorer</div>
            </div>
            
            <div className="form-group" style={{ maxWidth: 320, marginBottom: 20 }}>
              <select className="form-select" onChange={e => loadTeamDetail(e.target.value)}>
                <option value="">Choose a team to view active squad...</option>
                {teams.map(t => <option key={t.team_id} value={t.team_name}>{t.team_name}</option>)}
              </select>
            </div>

            {teamDetail ? (
              <div className="executive-table-wrapper">
                <table className="executive-table">
                  <thead>
                    <tr>
                      <th>Player Name</th>
                      <th>Position</th>
                      <th>Impact Score</th>
                      <th>Attack Strength</th>
                      <th>Defense Strength</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamDetail.players?.map((p, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{p.player_name}</td>
                        <td>
                          <span className={`badge-position ${POSITION_CLASSES[p.position] || ''}`}>{p.position}</span>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--text-primary)' }}>{p.impact_score?.toFixed(1)}</strong>
                        </td>
                        <td>{p.attack_score?.toFixed(1)}</td>
                        <td>{p.defense_score?.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                Select a team from the dropdown to load squad list.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
