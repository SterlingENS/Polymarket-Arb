import { BotStats } from '../types';

interface StatsPanelProps {
  stats: BotStats;
  opportunitiesCount: number;
}

export function StatsPanel({ stats, opportunitiesCount }: StatsPanelProps) {
  return (
    <div className="panel stats-panel">
      <h2>Statistics</h2>

      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-label">Total Opportunities</div>
          <div className="stat-value">{stats.totalOpportunities}</div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Current Opportunities</div>
          <div className="stat-value">{opportunitiesCount}</div>
        </div>
      </div>
    </div>
  );
}
