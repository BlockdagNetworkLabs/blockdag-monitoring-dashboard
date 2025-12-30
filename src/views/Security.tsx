import { TimeRange } from '../types/metrics';
import { metricsEngine } from '../mockMetrics/metricsEngine';
import { KPICard } from '../components/KPICard';
import { TimeSeriesChart } from '../components/TimeSeriesChart';
import { formatNumber } from '../utils/formatting';
import { Shield, AlertTriangle, Ban } from 'lucide-react';

interface SecurityProps {
  selectedNode: string;
  timeRange: TimeRange;
}

export function Security({ selectedNode, timeRange }: SecurityProps) {
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
          title="Invalid Blocks Rate"
          value={`${formatNumber(getCounterRate('blockdag_invalid_blocks_total', primaryNode) * 60, 2)}/min`}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={getCounterRate('blockdag_invalid_blocks_total', primaryNode) > 0.01 ? 'warning' : 'primary'}
        />
        <KPICard
          title="Invalid Txs Rate"
          value={`${formatNumber(getCounterRate('blockdag_invalid_txs_total', primaryNode) * 60, 2)}/min`}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <KPICard
          title="Banned Peers"
          value={formatNumber(getLatestValue('blockdag_banned_peers_total', primaryNode), 0)}
          icon={<Ban className="w-5 h-5" />}
        />
        <KPICard
          title="Rate Limited Peers"
          value={formatNumber(getLatestValue('blockdag_rate_limited_peers_total', primaryNode), 0)}
          icon={<Shield className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KPICard
          title="Malformed Messages"
          value={formatNumber(getLatestValue('blockdag_malformed_messages_total', primaryNode), 0)}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimeSeriesChart
          title="Invalid Blocks Rate"
          data={selectedNode === 'All' ? [] : getNodeData('blockdag_invalid_blocks_total') as any}
          compareData={selectedNode === 'All' ? getNodeData('blockdag_invalid_blocks_total') as any : undefined}
          yAxisLabel="Rate/min"
        />
        <TimeSeriesChart
          title="Invalid Txs Rate"
          data={selectedNode === 'All' ? [] : getNodeData('blockdag_invalid_txs_total') as any}
          compareData={selectedNode === 'All' ? getNodeData('blockdag_invalid_txs_total') as any : undefined}
          yAxisLabel="Rate/min"
        />
      </div>
    </div>
  );
}

