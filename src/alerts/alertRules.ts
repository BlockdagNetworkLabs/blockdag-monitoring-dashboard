import { AlertRule } from '../types/alerts';
import { NodeMetrics } from '../types/metrics';
import { metricsEngine } from '../mockMetrics/metricsEngine';

export const alertRules: AlertRule[] = [
  {
    id: 'tip_age_high',
    name: 'Tip age > 60s for > 2 minutes',
    severity: 'critical',
    metricName: 'blockdag_tip_age_seconds',
    condition: (value: number) => value > 60,
    description: 'Tip age exceeds 60 seconds',
    threshold: 60,
  },
  {
    id: 'dag_tips_high',
    name: 'DAG tips count > 25 sustained',
    severity: 'warning',
    metricName: 'blockdag_dag_tips_count',
    condition: (value: number) => value > 25,
    description: 'DAG tips count is abnormally high',
    threshold: 25,
  },
  {
    id: 'peers_low',
    name: 'Peers connected < 6',
    severity: 'warning',
    metricName: 'blockdag_peers_connected',
    condition: (value: number) => value < 6,
    description: 'Low peer connectivity',
    threshold: 6,
  },
  {
    id: 'propagation_latency_high',
    name: 'Propagation latency p95 > 2s',
    severity: 'warning',
    metricName: 'blockdag_block_propagation_latency_seconds',
    condition: (value: number) => value > 2,
    description: 'Block propagation latency is high',
    threshold: 2,
  },
  {
    id: 'finality_lag_high',
    name: 'Finality lag > 50 blocks',
    severity: 'critical',
    metricName: 'blockdag_finality_lag_blocks',
    condition: (value: number) => value > 50,
    description: 'Finality lag is too high',
    threshold: 50,
  },
  {
    id: 'rpc_error_rate_high',
    name: 'RPC error rate > 2%',
    severity: 'warning',
    metricName: 'blockdag_rpc_errors_total',
    condition: (value: number, nodeId: string) => {
      const requests = metricsEngine.getNodeMetrics(nodeId)?.metrics.get('blockdag_rpc_requests_total');
      if (!requests || requests.dataPoints.length < 2) return false;
      const recent = requests.dataPoints.slice(-2);
      const errorRate = recent[1].value - recent[0].value > 0 
        ? ((value - (requests.dataPoints.find(dp => dp.timestamp < recent[1].timestamp)?.value || 0)) / (recent[1].value - recent[0].value)) * 100
        : 0;
      return errorRate > 2;
    },
    description: 'RPC error rate exceeds 2%',
    threshold: 2,
  },
  {
    id: 'disk_free_low',
    name: 'Disk free < 10GB',
    severity: 'critical',
    metricName: 'blockdag_disk_free_bytes',
    condition: (value: number) => value < 10 * 1024 * 1024 * 1024,
    description: 'Disk space is critically low',
    threshold: 10 * 1024 * 1024 * 1024,
  },
  {
    id: 'invalid_blocks_high',
    name: 'Invalid blocks rate > baseline',
    severity: 'warning',
    metricName: 'blockdag_invalid_blocks_total',
    condition: (_value: number, nodeId: string) => {
      const metric = metricsEngine.getNodeMetrics(nodeId)?.metrics.get('blockdag_invalid_blocks_total');
      if (!metric || metric.dataPoints.length < 2) return false;
      const recent = metric.dataPoints.slice(-2);
      const rate = (recent[1].value - recent[0].value) / 2; // per second
      return rate > 0.01; // baseline threshold
    },
    description: 'Invalid blocks rate is elevated',
  },
  {
    id: 'node_down',
    name: 'Node is DOWN',
    severity: 'critical',
    metricName: 'blockdag_node_up',
    condition: (value: number) => value === 0,
    description: 'Node is not responding',
    threshold: 0,
  },
];

export function evaluateAlerts(nodeMetrics: NodeMetrics): Array<{ rule: AlertRule; value: number; active: boolean }> {
  const results: Array<{ rule: AlertRule; value: number; active: boolean }> = [];
  
  alertRules.forEach((rule) => {
      let value = 0;
      let active = false;
      
      if (rule.metricName.includes('_latency_seconds') || rule.metricName.includes('_duration_seconds')) {
        // Histogram metric - check p95
        const histData = nodeMetrics.histogramMetrics.get(rule.metricName);
        if (histData && histData.length > 0) {
          const latest = histData[histData.length - 1];
          value = latest.quantiles.p95;
          active = rule.condition(value, nodeMetrics.nodeId, nodeMetrics);
        }
      } else {
        const metric = nodeMetrics.metrics.get(rule.metricName);
        if (metric && metric.dataPoints.length > 0) {
          const latest = metric.dataPoints[metric.dataPoints.length - 1];
          value = latest.value;
          active = rule.condition(value, nodeMetrics.nodeId, nodeMetrics);
        }
      }
      
      // value is used in the return statement below
    
    results.push({ rule, value, active });
  });
  
  return results;
}

