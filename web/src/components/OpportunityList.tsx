import { ArbitrageOpportunity } from '../types';

interface OpportunityListProps {
  opportunities: ArbitrageOpportunity[];
}

export function OpportunityList({ opportunities }: OpportunityListProps) {
  if (opportunities.length === 0) {
    return (
      <div className="opportunity-list empty">
        <div className="empty-state">
          <h3>No Opportunities Found</h3>
          <p>Start the bot to begin scanning for arbitrage opportunities</p>
        </div>
      </div>
    );
  }

  return (
    <div className="opportunity-list">
      <h2>Arbitrage Opportunities ({opportunities.length})</h2>

      <div className="opportunities">
        {opportunities.map((opp, index) => (
          <OpportunityCard key={`${opp.marketId}-${index}`} opportunity={opp} />
        ))}
      </div>
    </div>
  );
}

function OpportunityCard({ opportunity }: { opportunity: ArbitrageOpportunity }) {
  const timestamp = new Date(opportunity.timestamp).toLocaleString();

  return (
    <div className="opportunity-card">
      <div className="opportunity-header">
        <h3>{opportunity.question}</h3>
        <span className="opportunity-profit">
          {opportunity.profitPercentage.toFixed(2)}% profit
        </span>
      </div>

      <div className="opportunity-body">
        <div className="opportunity-info">
          <div className="info-row">
            <span className="label">Market ID:</span>
            <span className="value">{opportunity.marketId.slice(0, 20)}...</span>
          </div>

          <div className="info-row">
            <span className="label">Detected:</span>
            <span className="value">{timestamp}</span>
          </div>
        </div>

        <div className="outcomes">
          <h4>Outcome Prices:</h4>
          {opportunity.outcomes.map((outcome, i) => (
            <div key={i} className="outcome-row">
              <span className="outcome-name">{outcome}:</span>
              <span className="outcome-price">
                ${opportunity.prices[i].toFixed(4)} ({(opportunity.prices[i] * 100).toFixed(2)}%)
              </span>
            </div>
          ))}
        </div>

        <div className="opportunity-stats">
          <div className="stat">
            <span className="stat-label">Total Cost:</span>
            <span className="stat-value">${opportunity.investment.toFixed(4)}</span>
          </div>

          <div className="stat">
            <span className="stat-label">Expected Profit:</span>
            <span className="stat-value highlight">
              ${opportunity.expectedProfit.toFixed(4)}
            </span>
          </div>

          <div className="stat">
            <span className="stat-label">Implied Probability:</span>
            <span className="stat-value">
              {(opportunity.impliedProbabilitySum * 100).toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="opportunity-strategy">
          <strong>Strategy:</strong> Buy all outcomes at the listed prices.
          One outcome will win and pay $1.00, guaranteeing profit.
        </div>
      </div>
    </div>
  );
}
