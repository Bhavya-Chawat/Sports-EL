import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';

import ExecutiveDashboard    from './pages/ExecutiveDashboard';
import LiveMatchAssistant    from './pages/LiveMatchAssistant';
import SubstitutionCenter    from './pages/SubstitutionCenter';
import PlayersTeams          from './pages/PlayersTeams';
import SystemIntelligence    from './pages/SystemIntelligence';

export default function App() {
  const [sessionId, setSessionId] = useState(null);

  return (
    <BrowserRouter>
      <div className="app-shell-horizontal">
        <Header liveSession={!!sessionId} />
        
        <div className="main-content-horizontal">
          <Routes>
            <Route path="/"                 element={<ExecutiveDashboard />} />
            <Route path="/live"             element={<LiveMatchAssistant onSessionStart={setSessionId} />} />
            <Route path="/substitution"     element={<SubstitutionCenter sessionId={sessionId} />} />
            <Route path="/players-teams"    element={<PlayersTeams />} />
            <Route path="/intelligence"     element={<SystemIntelligence />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}


