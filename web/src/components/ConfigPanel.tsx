import { useState } from 'react';
import { BotConfig } from '../types';
import { updateConfig } from '../api';

interface ConfigPanelProps {
  config: BotConfig;
  onUpdate: (config: Partial<BotConfig>) => void;
  disabled: boolean;
}

export function ConfigPanel({ config, onUpdate, disabled }: ConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState(config);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await updateConfig(localConfig);
      onUpdate(localConfig);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel config-panel">
      <h2>Configuration</h2>

      {disabled && (
        <div className="config-warning">
          Stop the bot to change configuration
        </div>
      )}

      {error && (
        <div className="config-error">{error}</div>
      )}

      <div className="config-form">
        <div className="form-group">
          <label>Minimum Profit %</label>
          <input
            type="number"
            step="0.1"
            value={localConfig.minProfitPercentage}
            onChange={(e) => setLocalConfig({
              ...localConfig,
              minProfitPercentage: parseFloat(e.target.value) || 0
            })}
            disabled={disabled}
          />
        </div>

        <div className="form-group">
          <label>Check Interval (ms)</label>
          <input
            type="number"
            step="1000"
            value={localConfig.checkIntervalMs}
            onChange={(e) => setLocalConfig({
              ...localConfig,
              checkIntervalMs: parseInt(e.target.value) || 5000
            })}
            disabled={disabled}
          />
        </div>

        <div className="form-group">
          <label>Max Position Size (USDC)</label>
          <input
            type="number"
            step="10"
            value={localConfig.maxPositionSizeUsdc}
            onChange={(e) => setLocalConfig({
              ...localConfig,
              maxPositionSizeUsdc: parseFloat(e.target.value) || 100
            })}
            disabled={disabled}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={disabled || saving}
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
