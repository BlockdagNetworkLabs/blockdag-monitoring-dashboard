import { Alert } from '../types/alerts';
import { AlertTriangle, XCircle } from 'lucide-react';
import { formatDuration } from '../utils/formatting';

interface AlertPanelProps {
  alerts: Alert[];
}

export function AlertPanel({ alerts }: AlertPanelProps) {
  const activeAlerts = alerts.filter((a) => a.timeActive > 0);

  if (activeAlerts.length === 0) {
    return (
      <div className="grafana-card">
        <h3 className="text-sm font-semibold text-grafana-text mb-4">Active Alerts</h3>
        <p className="text-sm text-grafana-textSecondary">No active alerts</p>
      </div>
    );
  }

  return (
    <div className="grafana-card">
      <h3 className="text-sm font-semibold text-grafana-text mb-4">Active Alerts</h3>
      <div className="space-y-2">
        {activeAlerts.map((alert) => {
          const Icon = alert.severity === 'critical' ? XCircle : AlertTriangle;
          const colorClass =
            alert.severity === 'critical' ? 'text-grafana-critical' : 'text-grafana-warning';
          const bgClass =
            alert.severity === 'critical'
              ? 'bg-grafana-critical bg-opacity-10 border-grafana-critical'
              : 'bg-grafana-warning bg-opacity-10 border-grafana-warning';

          return (
            <div
              key={alert.id}
              className={`p-3 rounded border ${bgClass} border-opacity-30`}
            >
              <div className="flex items-start gap-2">
                <Icon className={`w-5 h-5 ${colorClass} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-semibold ${colorClass}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-xs text-grafana-textSecondary">
                      {alert.nodeId}
                    </span>
                  </div>
                  <p className="text-sm text-grafana-text font-medium mb-1">
                    {alert.ruleName}
                  </p>
                  <p className="text-xs text-grafana-textSecondary mb-2">
                    {alert.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-grafana-textSecondary">
                      Value: <span className="text-grafana-text">{alert.currentValue.toFixed(2)}</span>
                    </span>
                    {alert.threshold !== undefined && (
                      <span className="text-grafana-textSecondary">
                        Threshold: <span className="text-grafana-text">{alert.threshold}</span>
                      </span>
                    )}
                    <span className="text-grafana-textSecondary">
                      Active: <span className="text-grafana-text">{formatDuration(alert.timeActive)}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

