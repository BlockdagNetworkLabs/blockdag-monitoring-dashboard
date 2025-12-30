import { TimeRange, DataPoint } from '../types/metrics';
import { metricsEngine } from '../mockMetrics/metricsEngine';
import { KPICard } from '../components/KPICard';
import { TimeSeriesChart } from '../components/TimeSeriesChart';
import { HistogramChart } from '../components/HistogramChart';
import { formatNumber, formatBytes, formatDuration } from '../utils/formatting';
import { Database, HardDrive, Clock } from 'lucide-react';

interface StorageProps {
  selectedNode: string;
  timeRange: TimeRange;
}

export function Storage({ selectedNode, timeRange }: StorageProps) {
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
          title="Disk Free"
          value={formatBytes(getLatestValue('blockdag_disk_free_bytes', primaryNode))}
          icon={<HardDrive className="w-5 h-5" />}
          color={getLatestValue('blockdag_disk_free_bytes', primaryNode) < 10 * 1024 * 1024 * 1024 ? 'critical' : 'primary'}
        />
        <KPICard
          title="DB Size"
          value={formatBytes(getLatestValue('blockdag_db_size_bytes', primaryNode))}
          icon={<Database className="w-5 h-5" />}
        />
        <KPICard
          title="DB Read Latency p95"
          value={formatDuration(getLatestHistogram('blockdag_db_read_latency_seconds', primaryNode, 'p95'))}
          icon={<Clock className="w-5 h-5" />}
        />
        <KPICard
          title="DB Write Latency p95"
          value={formatDuration(getLatestHistogram('blockdag_db_write_latency_seconds', primaryNode, 'p95'))}
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          title="Compaction Time p95"
          value={formatDuration(getLatestHistogram('blockdag_db_compaction_time_seconds', primaryNode, 'p95'))}
          icon={<Clock className="w-5 h-5" />}
        />
        <KPICard
          title="Compactions"
          value={formatNumber(getLatestValue('blockdag_db_compactions_total', primaryNode), 0)}
          icon={<Database className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimeSeriesChart
          title="Disk & DB Size"
          data={selectedNode === 'All' ? [] : getNodeData('blockdag_disk_free_bytes') as any}
          compareData={selectedNode === 'All' 
            ? [
                ...getNodeData('blockdag_disk_free_bytes'),
                ...(getNodeData('blockdag_db_size_bytes') as Array<{ label: string; data: DataPoint[]; color: string }>).map(d => ({ ...d, label: d.label + ' (DB)', color: '#f79420' }))
              ] as any
            : [
                { label: 'DB Size', data: getNodeData('blockdag_db_size_bytes') as any, color: '#f79420' }
              ]}
          yAxisLabel="Bytes"
        />
        <HistogramChart
          title="DB Read/Write Latency"
          data={metricsEngine.getNodeMetrics(primaryNode)?.histogramMetrics.get('blockdag_db_read_latency_seconds')?.filter(
            dp => dp.timestamp >= Date.now() - (timeRange === '5m' ? 5 * 60 * 1000 : timeRange === '15m' ? 15 * 60 * 1000 : timeRange === '1h' ? 60 * 60 * 1000 : 6 * 60 * 60 * 1000)
          ) || []}
          yAxisLabel="Seconds"
        />
      </div>
    </div>
  );
}

