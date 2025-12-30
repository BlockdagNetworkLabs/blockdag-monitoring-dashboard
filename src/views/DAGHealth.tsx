import { TimeRange, DataPoint } from '../types/metrics';
import { metricsEngine } from '../mockMetrics/metricsEngine';
import { KPICard } from '../components/KPICard';
import { TimeSeriesChart } from '../components/TimeSeriesChart';
import { HistogramChart } from '../components/HistogramChart';
import { formatNumber, formatDuration } from '../utils/formatting';
import { Network, AlertTriangle, TrendingUp, Clock } from 'lucide-react';

interface DAGHealthProps {
  selectedNode: string;
  timeRange: TimeRange;
}

export function DAGHealth({ selectedNode, timeRange }: DAGHealthProps) {
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

  // Calculate rates from counters
  const getCounterRate = (metricName: string, nodeId: string): number => {
    const data = metricsEngine.getMetricData(nodeId, metricName, timeRange);
    if (data.length < 2) return 0;
    const recent = data.slice(-2);
    return (recent[1].value - recent[0].value) / 2; // per second
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="DAG Tips Count"
          value={formatNumber(getLatestValue('blockdag_dag_tips_count', primaryNode), 1)}
          icon={<Network className="w-5 h-5" />}
          color={getLatestValue('blockdag_dag_tips_count', primaryNode) > 25 ? 'warning' : 'primary'}
        />
        <KPICard
          title="DAG Width"
          value={formatNumber(getLatestValue('blockdag_dag_width', primaryNode), 2)}
          subtitle="Parallelism estimate"
          icon={<Network className="w-5 h-5" />}
        />
        <KPICard
          title="Merge Latency (p95)"
          value={formatDuration(getLatestHistogram('blockdag_merge_latency_seconds', primaryNode, 'p95'))}
          icon={<Clock className="w-5 h-5" />}
        />
        <KPICard
          title="Conflict Rate"
          value={`${formatNumber(getCounterRate('blockdag_conflict_blocks_total', primaryNode) * 60, 2)}/min`}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={getCounterRate('blockdag_conflict_blocks_total', primaryNode) > 0.01 ? 'warning' : 'primary'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Orphan Blocks Rate"
          value={`${formatNumber(getCounterRate('blockdag_orphan_blocks_total', primaryNode) * 60, 2)}/min`}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <KPICard
          title="Stale Blocks Rate"
          value={`${formatNumber(getCounterRate('blockdag_stale_blocks_total', primaryNode) * 60, 2)}/min`}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <KPICard
          title="Blue Score"
          value={formatNumber(getLatestValue('blockdag_bluescore', primaryNode), 0)}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <KPICard
          title="VSP Switches"
          value={formatNumber(getLatestValue('blockdag_virtual_parent_switches_total', primaryNode), 0)}
          subtitle="Virtual selected parent changes"
          icon={<Network className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimeSeriesChart
          title="DAG Tips, Width, and Merge Latency"
          data={selectedNode === 'All' ? [] : getNodeData('blockdag_dag_tips_count') as any}
          compareData={selectedNode === 'All' ? getNodeData('blockdag_dag_tips_count') as any : undefined}
          yAxisLabel="Count"
        />
        <HistogramChart
          title="Merge Latency Quantiles"
          data={metricsEngine.getNodeMetrics(primaryNode)?.histogramMetrics.get('blockdag_merge_latency_seconds')?.filter(
            dp => dp.timestamp >= Date.now() - (timeRange === '5m' ? 5 * 60 * 1000 : timeRange === '15m' ? 15 * 60 * 1000 : timeRange === '1h' ? 60 * 60 * 1000 : 6 * 60 * 60 * 1000)
          ) || []}
          yAxisLabel="Seconds"
        />
        <TimeSeriesChart
          title="Orphan/Stale Blocks Rate"
          data={selectedNode === 'All' ? [] : getNodeData('blockdag_orphan_blocks_total') as any}
          compareData={selectedNode === 'All' ? getNodeData('blockdag_orphan_blocks_total') as any : undefined}
          yAxisLabel="Rate/min"
        />
        <TimeSeriesChart
          title="Blue Score / DAA-like Score"
          data={selectedNode === 'All' ? [] : getNodeData('blockdag_bluescore') as any}
          compareData={selectedNode === 'All' ? getNodeData('blockdag_bluescore') as any : undefined}
          yAxisLabel="Score"
        />
        <TimeSeriesChart
          title="Block Acceptance vs Rejection"
          data={selectedNode === 'All' ? [] : getNodeData('blockdag_blocks_accepted_total') as any}
          compareData={selectedNode === 'All' ? [
            ...getNodeData('blockdag_blocks_accepted_total'),
            ...(getNodeData('blockdag_blocks_rejected_total') as Array<{ label: string; data: DataPoint[]; color: string }>).map(d => ({ ...d, label: d.label + ' (rejected)', color: '#e24d42' }))
          ] as any : undefined}
          yAxisLabel="Count"
        />
      </div>
    </div>
  );
}

