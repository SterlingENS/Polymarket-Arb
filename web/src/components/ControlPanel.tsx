interface ControlPanelProps {
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  onToggleConfig: () => void;
}

export function ControlPanel({
  isRunning,
  onStart,
  onStop,
  onClear,
  onToggleConfig,
}: ControlPanelProps) {
  return (
    <div className="panel control-panel">
      <h2>Controls</h2>

      <div className="control-buttons">
        {!isRunning ? (
          <button className="btn btn-primary" onClick={onStart}>
            Start Bot
          </button>
        ) : (
          <button className="btn btn-danger" onClick={onStop}>
            Stop Bot
          </button>
        )}

        <button className="btn btn-secondary" onClick={onClear}>
          Clear Opportunities
        </button>

        <button className="btn btn-secondary" onClick={onToggleConfig}>
          Configuration
        </button>
      </div>
    </div>
  );
}
