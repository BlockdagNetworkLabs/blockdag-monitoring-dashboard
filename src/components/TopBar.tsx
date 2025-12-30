import { TimeRange, AnomalyConfig } from '../types/metrics';
import { metricsEngine } from '../mockMetrics/metricsEngine';

interface TopBarProps {
  selectedNode: string;
  onNodeChange: (node: string) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  autoRefresh: boolean;
  onAutoRefreshChange: (enabled: boolean) => void;
  anomalyConfig: AnomalyConfig;
  onAnomalyConfigChange: (config: AnomalyConfig) => void;
}

export function TopBar({
  selectedNode,
  onNodeChange,
  timeRange,
  onTimeRangeChange,
  autoRefresh,
  onAutoRefreshChange,
  anomalyConfig,
  onAnomalyConfigChange,
}: TopBarProps) {
  const nodes = ['All', ...metricsEngine.getNodes()];
  const timeRanges: TimeRange[] = ['5m', '15m', '1h', '6h'];

  const handleAnomalyToggle = (key: keyof AnomalyConfig) => {
    const newConfig = { ...anomalyConfig, [key]: !anomalyConfig[key] };
    onAnomalyConfigChange(newConfig);
    metricsEngine.setAnomalyConfig(newConfig);
  };

  return (
    <div className="bg-grafana-dark border-b border-grafana-border px-6 py-3 flex items-center gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm text-grafana-textSecondary">Node:</label>
        <select
          value={selectedNode}
          onChange={(e) => onNodeChange(e.target.value)}
          className="grafana-input text-sm"
        >
          {nodes.map((node) => (
            <option key={node} value={node}>
              {node}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-grafana-textSecondary">Time Range:</label>
        <select
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value as TimeRange)}
          className="grafana-input text-sm"
        >
          {timeRanges.map((range) => (
            <option key={range} value={range}>
              {range}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="auto-refresh"
          checked={autoRefresh}
          onChange={(e) => onAutoRefreshChange(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="auto-refresh" className="text-sm text-grafana-textSecondary">
          Auto-refresh
        </label>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <input
          type="checkbox"
          id="inject-anomalies"
          checked={Object.values(anomalyConfig).some(v => v)}
          onChange={() => {}}
          className="w-4 h-4"
        />
        <label htmlFor="inject-anomalies" className="text-sm text-grafana-textSecondary">
          Inject Anomalies:
        </label>
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => handleAnomalyToggle('nodeDowntime')}
            className={`px-2 py-1 rounded ${anomalyConfig.nodeDowntime ? 'bg-grafana-critical' : 'bg-grafana-border'}`}
          >
            Node Down
          </button>
          <button
            onClick={() => handleAnomalyToggle('peerCollapse')}
            className={`px-2 py-1 rounded ${anomalyConfig.peerCollapse ? 'bg-grafana-warning' : 'bg-grafana-border'}`}
          >
            Peer Collapse
          </button>
          <button
            onClick={() => handleAnomalyToggle('propagationSlowdown')}
            className={`px-2 py-1 rounded ${anomalyConfig.propagationSlowdown ? 'bg-grafana-warning' : 'bg-grafana-border'}`}
          >
            Propagation
          </button>
          <button
            onClick={() => handleAnomalyToggle('mempoolOverload')}
            className={`px-2 py-1 rounded ${anomalyConfig.mempoolOverload ? 'bg-grafana-warning' : 'bg-grafana-border'}`}
          >
            Mempool
          </button>
          <button
            onClick={() => handleAnomalyToggle('diskPressure')}
            className={`px-2 py-1 rounded ${anomalyConfig.diskPressure ? 'bg-grafana-critical' : 'bg-grafana-border'}`}
          >
            Disk
          </button>
          <button
            onClick={() => handleAnomalyToggle('rpcFlood')}
            className={`px-2 py-1 rounded ${anomalyConfig.rpcFlood ? 'bg-grafana-warning' : 'bg-grafana-border'}`}
          >
            RPC Flood
          </button>
          <button
            onClick={() => handleAnomalyToggle('consensusStress')}
            className={`px-2 py-1 rounded ${anomalyConfig.consensusStress ? 'bg-grafana-critical' : 'bg-grafana-border'}`}
          >
            Consensus
          </button>
        </div>
      </div>
    </div>
  );
}

