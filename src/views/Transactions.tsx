import { TimeRange, DataPoint } from '../types/metrics';
import { metricsEngine } from '../mockMetrics/metricsEngine';
import { KPICard } from '../components/KPICard';
import { TimeSeriesChart } from '../components/TimeSeriesChart';
import { formatNumber, formatBytes } from '../utils/formatting';
import { ArrowRightLeft, Database, AlertTriangle } from 'lucide-react';

interface TransactionsProps {
  selectedNode: string;
  timeRange: TimeRange;
}

export function Transactions({ selectedNode, timeRange }: TransactionsProps) {
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
          title="Mempool Size"
          value={formatNumber(getLatestValue('blockdag_mempool_size', primaryNode), 0)}
          subtitle={formatBytes(getLatestValue('blockdag_mempool_bytes', primaryNode))}
          icon={<Database className="w-5 h-5" />}
        />
        <KPICard
          title="Incoming Tx Rate"
          value={`${formatNumber(getCounterRate('blockdag_tx_received_total', primaryNode), 1)}/s`}
          icon={<ArrowRightLeft className="w-5 h-5" />}
        />
        <KPICard
          title="Dropped/Evicted Rate"
          value={`${formatNumber(getCounterRate('blockdag_tx_evicted_total', primaryNode), 1)}/s`}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={getCounterRate('blockdag_tx_evicted_total', primaryNode) > 1 ? 'warning' : 'primary'}
        />
        <KPICard
          title="Included Tx per Block"
          value={formatNumber(getCounterRate('blockdag_tx_committed_total', primaryNode) / (getCounterRate('blockdag_blocks_accepted_total', primaryNode) || 1), 1)}
          icon={<ArrowRightLeft className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimeSeriesChart
          title="Tx Received vs Committed"
          data={selectedNode === 'All' ? [] : getNodeData('blockdag_tx_received_total') as any}
          compareData={selectedNode === 'All' 
            ? [
                ...getNodeData('blockdag_tx_received_total'),
                ...(getNodeData('blockdag_tx_committed_total') as Array<{ label: string; data: DataPoint[]; color: string }>).map(d => ({ ...d, label: d.label + ' (committed)', color: '#73bf69' }))
              ] as any
            : [
                { label: 'Committed', data: getNodeData('blockdag_tx_committed_total') as any, color: '#73bf69' }
              ]}
          yAxisLabel="Count"
        />
        <TimeSeriesChart
          title="Mempool Inflow/Outflow"
          data={selectedNode === 'All' ? [] : getNodeData('blockdag_mempool_size') as any}
          compareData={selectedNode === 'All' ? getNodeData('blockdag_mempool_size') as any : undefined}
          yAxisLabel="Size"
        />
      </div>
    </div>
  );
}

