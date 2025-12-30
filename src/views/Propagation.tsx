import { TimeRange } from '../types/metrics';
import { metricsEngine } from '../mockMetrics/metricsEngine';
import { KPICard } from '../components/KPICard';
import { TimeSeriesChart } from '../components/TimeSeriesChart';
import { HistogramChart } from '../components/HistogramChart';
import { formatNumber, formatDuration } from '../utils/formatting';
import { Network, AlertTriangle, MessageSquare } from 'lucide-react';

interface PropagationProps {
  selectedNode: string;
  timeRange: TimeRange;
}

export function Propagation({ selectedNode, timeRange }: PropagationProps) {
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

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Connected Peers"
          value={formatNumber(getLatestValue('blockdag_peers_connected', primaryNode), 0)}
          subtitle={`${formatNumber(getLatestValue('blockdag_peers_inbound', primaryNode), 0)} inbound / ${formatNumber(getLatestValue('blockdag_peers_outbound', primaryNode), 0)} outbound`}
          icon={<Network className="w-5 h-5" />}
          color={getLatestValue('blockdag_peers_connected', primaryNode) < 6 ? 'warning' : 'success'}
        />
        <KPICard
          title="Block Propagation p95"
          value={formatDuration(getLatestHistogram('blockdag_block_propagation_latency_seconds', primaryNode, 'p95'))}
          icon={<MessageSquare className="w-5 h-5" />}
          color={getLatestHistogram('blockdag_block_propagation_latency_seconds', primaryNode, 'p95') > 2 ? 'warning' : 'primary'}
        />
        <KPICard
          title="Tx Propagation p95"
          value={formatDuration(getLatestHistogram('blockdag_tx_propagation_latency_seconds', primaryNode, 'p95'))}
          icon={<MessageSquare className="w-5 h-5" />}
        />
        <KPICard
          title="Gossip Messages Rate"
          value={`${formatNumber(getCounterRate('blockdag_blocks_accepted_total', primaryNode) + getCounterRate('blockdag_tx_received_total', primaryNode), 1)}/s`}
          icon={<MessageSquare className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          title="Dial Failures"
          value={formatNumber(getLatestValue('blockdag_dial_failures_total', primaryNode), 0)}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <KPICard
          title="Peer Disconnects"
          value={formatNumber(getLatestValue('blockdag_peer_disconnects_total', primaryNode), 0)}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HistogramChart
          title="Block Propagation Latency Quantiles"
          data={metricsEngine.getNodeMetrics(primaryNode)?.histogramMetrics.get('blockdag_block_propagation_latency_seconds')?.filter(
            dp => dp.timestamp >= Date.now() - (timeRange === '5m' ? 5 * 60 * 1000 : timeRange === '15m' ? 15 * 60 * 1000 : timeRange === '1h' ? 60 * 60 * 1000 : 6 * 60 * 60 * 1000)
          ) || []}
          yAxisLabel="Seconds"
        />
        <HistogramChart
          title="Tx Propagation Latency Quantiles"
          data={metricsEngine.getNodeMetrics(primaryNode)?.histogramMetrics.get('blockdag_tx_propagation_latency_seconds')?.filter(
            dp => dp.timestamp >= Date.now() - (timeRange === '5m' ? 5 * 60 * 1000 : timeRange === '15m' ? 15 * 60 * 1000 : timeRange === '1h' ? 60 * 60 * 1000 : 6 * 60 * 60 * 1000)
          ) || []}
          yAxisLabel="Seconds"
        />
        <TimeSeriesChart
          title="Peers & Disconnects"
          data={selectedNode === 'All' ? [] : getNodeData('blockdag_peers_connected') as any}
          compareData={selectedNode === 'All' ? getNodeData('blockdag_peers_connected') as any : undefined}
          yAxisLabel="Count"
        />
      </div>
    </div>
  );
}

