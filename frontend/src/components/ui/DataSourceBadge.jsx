import { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';

export default function DataSourceBadge() {
  const [status, setStatus] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    api.getStatus()
      .then(r => setStatus(r.data))
      .catch(() => setStatus({ data_source: 'ERROR' }));
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowTooltip(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!status) return <span className="data-badge loading"><span className="data-badge-dot" />Checking Data Source</span>;

  const isReal = status.data_source === 'REAL';
  const cls    = isReal ? 'real' : status.data_source === 'ERROR' ? 'loading' : 'synthetic';
  const label  = isReal ? 'Real Data' : 'Synthetic Data';

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        className={`data-badge ${cls}`}
        onClick={() => setShowTooltip(v => !v)}
        title="Click for data source details"
      >
        <span className="data-badge-dot" />
        {label}
      </button>

      {showTooltip && status && (
        <div className="ds-tooltip">
          <div className="ds-tooltip-title">
            {isReal ? 'Real PKL Dataset Active' : 'Synthetic Dataset Active'}
          </div>
          {!isReal && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.4 }}>
              Place PKL_Organized_Dataset.xlsx into backend/data/ and restart the server to switch to real data.
            </p>
          )}
          <div className="ds-tooltip-row"><span>File</span><span className="ds-tooltip-val">{status.dataset_file || 'None'}</span></div>
          <div className="ds-tooltip-row"><span>Players</span><span className="ds-tooltip-val">{status.players_loaded}</span></div>
          <div className="ds-tooltip-row"><span>Teams</span><span className="ds-tooltip-val">{status.teams_loaded}</span></div>
          <div className="ds-tooltip-row"><span>Seasons</span><span className="ds-tooltip-val">{status.seasons_loaded}</span></div>
          <div className="ds-tooltip-row"><span>Records</span><span className="ds-tooltip-val">{status.records_loaded?.toLocaleString()}</span></div>
          <div className="ds-tooltip-row"><span>Loaded</span><span className="ds-tooltip-val">{status.last_ingested ? new Date(status.last_ingested).toLocaleTimeString() : '—'}</span></div>
        </div>
      )}
    </div>
  );
}
