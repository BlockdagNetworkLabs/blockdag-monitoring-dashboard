export type AlertSeverity = 'warning' | 'critical';

export interface Alert {
  id: string;
  ruleName: string;
  severity: AlertSeverity;
  currentValue: number;
  threshold: number;
  timeActive: number; // seconds
  nodeId: string;
  metricName: string;
  description: string;
}

export interface AlertRule {
  id: string;
  name: string;
  severity: AlertSeverity;
  metricName: string;
  condition: (value: number, nodeId: string, metrics: any) => boolean;
  description: string;
  threshold?: number;
}

