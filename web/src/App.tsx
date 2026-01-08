import { useState, useEffect, useCallback } from 'react';
import { BotConfig, BotStatus, ArbitrageOpportunity } from './types';
import { getStatus, startBot, stopBot, clearOpportunities } from './api';
import { useWebSocket } from './useWebSocket';
import { ControlPanel } from './components/ControlPanel';
import { OpportunityList } from './components/OpportunityList';
import { ConfigPanel } from './components/ConfigPanel';
import { StatsPanel } from './components/StatsPanel';
import './App.css';

function App() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  // Load initial status
  useEffect(() => {
    getStatus()
      .then(setStatus)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
    if (message.type === 'status') {
      setStatus(message.data);
    } else if (message.type === 'opportunities') {
      setStatus((prev) => prev ? {
        ...prev,
        opportunities: message.data
      } : null);
    } else if (message.type === 'stats') {
      setStatus((prev) => prev ? {
        ...prev,
        stats: message.data
      } : null);
    } else if (message.type === 'config') {
      setStatus((prev) => prev ? {
        ...prev,
        config: message.data
      } : null);
    } else if (message.type === 'error') {
      setError(message.data.message);
    }
  }, []);

  useWebSocket(handleWebSocketMessage, true);

  const handleStart = async () => {
    try {
      setError(null);
      await startBot();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStop = async () => {
    try {
      setError(null);
      await stopBot();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleClear = async () => {
    try {
      setError(null);
      await clearOpportunities();
      setStatus((prev) => prev ? { ...prev, opportunities: [] } : null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleConfigUpdate = (config: Partial<BotConfig>) => {
    setStatus((prev) => prev ? {
      ...prev,
      config: { ...prev.config, ...config }
    } : null);
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="app">
        <div className="error">Failed to load bot status</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Polymarket Arbitrage Bot</h1>
        <div className="header-status">
          <span className={`status-indicator ${status.isRunning ? 'running' : 'stopped'}`}>
            {status.isRunning ? 'Running' : 'Stopped'}
          </span>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="container">
        <div className="sidebar">
          <ControlPanel
            isRunning={status.isRunning}
            onStart={handleStart}
            onStop={handleStop}
            onClear={handleClear}
            onToggleConfig={() => setShowConfig(!showConfig)}
          />

          <StatsPanel
            stats={status.stats}
            opportunitiesCount={status.opportunities.length}
          />

          {showConfig && (
            <ConfigPanel
              config={status.config}
              onUpdate={handleConfigUpdate}
              disabled={status.isRunning}
            />
          )}
        </div>

        <div className="main-content">
          <OpportunityList opportunities={status.opportunities} />
        </div>
      </div>
    </div>
  );
}

export default App;
