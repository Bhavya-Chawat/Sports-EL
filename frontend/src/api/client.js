import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

export const api = {
  // System
  getStatus: () => client.get('/system/status'),

  // Analytics
  getSummary:        () => client.get('/analytics/summary'),
  getTopPerformers:  (params) => client.get('/analytics/top-performers', { params }),
  getSeasonBreakdown: () => client.get('/analytics/season-breakdown'),
  getIngestionLog:   () => client.get('/analytics/ingestion-log'),

  // Players
  getPlayers:    (params) => client.get('/players', { params }),
  getPlayer:     (id) => client.get(`/players/${id}`),
  getSimilar:    (id, topN = 8) => client.get(`/players/${id}/similar`, { params: { top_n: topN } }),
  getPlayerTrend:(id) => client.get(`/players/${id}/trend`),

  // Teams
  getTeams:        () => client.get('/teams'),
  getTeam:         (id) => client.get(`/teams/${id}`),
  compareTeams:    (a, b) => client.get(`/teams/${a}/compare/${b}`),

  // Live Match
  createSession:   (body) => client.post('/live/session', body),
  getSession:      (id) => client.get(`/live/session/${id}`),
  setRoster:       (id, playing, bench) => client.post(`/live/session/${id}/roster`, { playing, bench }),
  updateScore:     (id, body) => client.put(`/live/session/${id}/score`, body),
  updateStats:     (id, stats) => client.put(`/live/session/${id}/stats`, stats),
  getAlerts:       (id) => client.get(`/live/session/${id}/alerts`),
  getRecommendations: (id) => client.get(`/live/session/${id}/recommendations`),
  loadDemo:        () => client.post('/live/demo/load'),

  // Recommendations
  getHistory:      (limit = 100) => client.get('/recommendations/history', { params: { limit } }),
  getRecStats:     () => client.get('/recommendations/stats'),
  submitOutcome:   (id, body) => client.post(`/recommendations/${id}/outcome`, body),

  // Similarity
  comparePlayers:  (a, b) => client.get('/similarity/compare', { params: { player_a: a, player_b: b } }),
  getSimilarityMatrix: (limit = 20) => client.get('/similarity/matrix', { params: { limit } }),
};

export default client;
