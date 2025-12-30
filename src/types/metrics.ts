export type MetricType = 'gauge' | 'counter' | 'histogram';

export interface MetricLabel {
  [key: string]: string;
}

export interface DataPoint {
  timestamp: number;
  value: number;
  labels?: MetricLabel;
}

export interface Metric {
  name: string;
  type: MetricType;
  help: string;
  dataPoints: DataPoint[];
  labels?: MetricLabel;
}

export interface HistogramQuantiles {
  p50: number;
  p95: number;
  p99: number;
}

export interface HistogramDataPoint {
  timestamp: number;
  quantiles: HistogramQuantiles;
  labels?: MetricLabel;
}

export interface NodeMetrics {
  nodeId: string;
  metrics: Map<string, Metric>;
  histogramMetrics: Map<string, HistogramDataPoint[]>;
  lastUpdate: number;
}

export type TimeRange = '5m' | '15m' | '1h' | '6h';

export interface AnomalyConfig {
  nodeDowntime: boolean;
  peerCollapse: boolean;
  propagationSlowdown: boolean;
  mempoolOverload: boolean;
  diskPressure: boolean;
  rpcFlood: boolean;
  consensusStress: boolean;
}

