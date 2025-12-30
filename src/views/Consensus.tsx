import { TimeRange, DataPoint } from '../types/metrics';
import { metricsEngine } from '../mockMetrics/metricsEngine';
import { KPICard } from '../components/KPICard';
import { TimeSeriesChart } from '../components/TimeSeriesChart';
import { HistogramChart } from '../components/HistogramChart';
import { formatNumber, formatDuration } from '../utils/formatting';
import { CheckCircle2, Clock } from 'lucide-react';

interface ConsensusProps {
  selectedNode: string;
  timeRange: TimeRange;
}

export function Consensus({ selectedNode, timeRange }: ConsensusProps) {
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

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Virtual Height"
          value={formatNumber(getLatestValue('blockdag_virtual_height', primaryNode), 0)}
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <KPICard
          title="Finalized Height"
          value={formatNumber(getLatestValue('blockdag_finalized_height', primaryNode), 0)}
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <KPICard
          title="Finality Lag"
          value={formatNumber(getLatestValue('blockdag_finality_lag_blocks', primaryNode), 0)}
          subtitle="Blocks behind"
          icon={<Clock className="w-5 h-5" />}
          color={getLatestValue('blockdag_finality_lag_blocks', primaryNode) > 50 ? 'critical' : 'primary'}
        />
        <KPICard
          title="Consensus Processing p95"
          value={formatDuration(getLatestHistogram('blockdag_consensus_processing_time_seconds', primaryNode, 'p95'))}
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimeSeriesChart
          title="Virtual Height vs Finalized Height"
          data={selectedNode === 'All' ? [] : getNodeData('blockdag_virtual_height') as any}
          compareData={selectedNode === 'All' 
            ? [
                ...getNodeData('blockdag_virtual_height'),
                ...(getNodeData('blockdag_finalized_height') as Array<{ label: string; data: DataPoint[]; color: string }>).map(d => ({ ...d, label: d.label + ' (finalized)', color: '#73bf69' }))
              ] as any
            : [
                { label: 'Finalized', data: getNodeData('blockdag_finalized_height') as any, color: '#73bf69' }
              ]}
          yAxisLabel="Height"
        />
        <TimeSeriesChart
          title="Finality Lag Over Time"
          data={selectedNode === 'All' ? [] : getNodeData('blockdag_finality_lag_blocks') as any}
          compareData={selectedNode === 'All' ? getNodeData('blockdag_finality_lag_blocks') as any : undefined}
          yAxisLabel="Blocks"
        />
        <HistogramChart
          title="Consensus Processing Time (p95)"
          data={metricsEngine.getNodeMetrics(primaryNode)?.histogramMetrics.get('blockdag_consensus_processing_time_seconds')?.filter(
            dp => dp.timestamp >= Date.now() - (timeRange === '5m' ? 5 * 60 * 1000 : timeRange === '15m' ? 15 * 60 * 1000 : timeRange === '1h' ? 60 * 60 * 1000 : 6 * 60 * 60 * 1000)
          ) || []}
          yAxisLabel="Seconds"
        />
      </div>
    </div>
  );
}

