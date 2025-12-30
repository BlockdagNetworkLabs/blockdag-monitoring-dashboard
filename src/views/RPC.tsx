import { TimeRange } from '../types/metrics';
import { metricsEngine } from '../mockMetrics/metricsEngine';
import { KPICard } from '../components/KPICard';
import { TimeSeriesChart } from '../components/TimeSeriesChart';
import { HistogramChart } from '../components/HistogramChart';
import { formatNumber, formatDuration } from '../utils/formatting';
import { Server, AlertTriangle, Network, Clock } from 'lucide-react';

interface RPCProps {
  selectedNode: string;
  timeRange: TimeRange;
}

export function RPC({ selectedNode, timeRange }: RPCProps) {
  const getNodeData = (metricName: string) => {
    if (selectedNode === 'All') {
      const nodes = metricsEngine.getNodes();
      return nodes.map((nodeId) => ({
        label: nodeId,
        data: metricsEngine.getMetricData(nodeId, metricName, timeRange),
        color: nodeId === 'Node A' ? '#5794f2' : nodeId === 'Node B' ? '#73bf69' : '#f79420',
      }));
    }
    return metricsEngine.getMetricData(selectedNode, metricName, timeRange);
  };

  const getLatestValue = (metricName: string, nodeId: string): number => {
    const data = metricsEngine.getMetricData(nodeId, metricName, timeRange);
    return data.length > 0 ? data[data.length - 1].value : 0;
  };

  const getLatestHistogram = (metricName: string, nodeId: string, quantile: 'p50' | 'p95' | 'p99'): number => {
    const data = metricsEngine.getHistogramData(nodeId, metricName, timeRange, quantile);
    return data.length > 0 ? data[data.length - 1].value : 0;
  };

  const nodes = selectedNode === 'All' ? metricsEngine.getNodes() : [selectedNode];
  const primaryNode = nodes[0];

  const getCounterRate = (metricName: string, nodeId: string): number => {
    const data = metricsEngine.getMetricData(nodeId, metricName, timeRange);
    if (data.length < 2) return 0;
    const recent = data.slice(-2);
    return (recent[1].value - recent[0].value) / 2;
  };

  const getErrorRate = (nodeId: string): number => {
    const requests = getCounterRate('blockdag_rpc_requests_total', nodeId);
    const errors = getCounterRate('blockdag_rpc_errors_total', nodeId);
    return requests > 0 ? (errors / requests) * 100 : 0;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="RPC Request Rate"
          value={`${formatNumber(getCounterRate('blockdag_rpc_requests_total', primaryNode), 1)}/s`}
          icon={<Server className="w-5 h-5" />}
        />
        <KPICard
          title="RPC Error Rate"
          value={`${getErrorRate(primaryNode).toFixed(2)}%`}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={getErrorRate(primaryNode) > 2 ? 'warning' : 'primary'}
        />
        <KPICard
          title="RPC Latency p95"
          value={formatDuration(getLatestHistogram('blockdag_rpc_duration_seconds', primaryNode, 'p95'))}
          icon={<Clock className="w-5 h-5" />}
        />
        <KPICard
          title="Active Connections"
          value={formatNumber(getLatestValue('blockdag_rpc_active_connections', primaryNode), 0)}
          icon={<Network className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimeSeriesChart
          title="RPC Requests by Method (Stacked)"
          data={selectedNode === 'All' ? [] : getNodeData('blockdag_rpc_requests_total') as any}
          compareData={selectedNode === 'All' ? getNodeData('blockdag_rpc_requests_total') as any : undefined}
          yAxisLabel="Requests/s"
        />
        <HistogramChart
          title="RPC Latency Quantiles"
          data={metricsEngine.getNodeMetrics(primaryNode)?.histogramMetrics.get('blockdag_rpc_duration_seconds')?.filter(
            dp => dp.timestamp >= Date.now() - (timeRange === '5m' ? 5 * 60 * 1000 : timeRange === '15m' ? 15 * 60 * 1000 : timeRange === '1h' ? 60 * 60 * 1000 : 6 * 60 * 60 * 1000)
          ) || []}
          yAxisLabel="Seconds"
        />
        <TimeSeriesChart
          title="RPC Error Rate %"
          data={selectedNode === 'All' ? [] : getNodeData('blockdag_rpc_errors_total') as any}
          compareData={selectedNode === 'All' ? getNodeData('blockdag_rpc_errors_total') as any : undefined}
          yAxisLabel="%"
        />
      </div>
    </div>
  );
}

