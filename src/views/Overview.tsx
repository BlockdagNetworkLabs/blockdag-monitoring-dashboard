import { useEffect, useState } from 'react';
import { metricsEngine } from '../mockMetrics/metricsEngine';
import { TimeRange } from '../types/metrics';
import { KPICard } from '../components/KPICard';
import { TimeSeriesChart } from '../components/TimeSeriesChart';
import { AlertPanel } from '../components/AlertPanel';
import { DAGVisualizer } from '../components/DAGVisualizer';
import { evaluateAlerts } from '../alerts/alertRules';
import { Alert } from '../types/alerts';
import { formatBytes, formatDuration, formatNumber } from '../utils/formatting';
import { Activity, Network, Clock, Database, Zap } from 'lucide-react';

interface OverviewProps {
  selectedNode: string;
  timeRange: TimeRange;
}

export function Overview({ selectedNode, timeRange }: OverviewProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const updateAlerts = () => {
      const allAlerts: Alert[] = [];
      const nodes = selectedNode === 'All' ? metricsEngine.getNodes() : [selectedNode];

      nodes.forEach((nodeId) => {
        const nodeMetrics = metricsEngine.getNodeMetrics(nodeId);
        if (!nodeMetrics) return;

        const evaluations = evaluateAlerts(nodeMetrics);
        evaluations.forEach((evaluation) => {
          if (evaluation.active) {
            const existingAlert = allAlerts.find((a) => a.id === `${evaluation.rule.id}-${nodeId}`);
            if (existingAlert) {
              existingAlert.timeActive += 2; // 2 seconds per update
              existingAlert.currentValue = evaluation.value;
            } else {
              allAlerts.push({
                id: `${evaluation.rule.id}-${nodeId}`,
                ruleName: evaluation.rule.name,
                severity: evaluation.rule.severity,
                currentValue: evaluation.value,
                threshold: evaluation.rule.threshold ?? 0,
                timeActive: 2,
                nodeId,
                metricName: evaluation.rule.metricName,
                description: evaluation.rule.description,
              });
            }
          }
        });
      });

      setAlerts(allAlerts);
    };

    updateAlerts();
    const interval = setInterval(updateAlerts, 2000);
    return () => clearInterval(interval);
  }, [selectedNode]);

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

  const getNodeStatus = (nodeId: string): 'UP' | 'DOWN' => {
    const value = getLatestValue('blockdag_node_up', nodeId);
    return value === 1 ? 'UP' : 'DOWN';
  };


  const nodes = selectedNode === 'All' ? metricsEngine.getNodes() : [selectedNode];
  const primaryNode = nodes[0];

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Node Status"
          value={getNodeStatus(primaryNode)}
          color={getNodeStatus(primaryNode) === 'UP' ? 'success' : 'critical'}
          icon={<Activity className="w-5 h-5" />}
        />
        <KPICard
          title="Tip Age"
          value={formatDuration(getLatestValue('blockdag_tip_age_seconds', primaryNode))}
          subtitle="Time since last block"
          icon={<Clock className="w-5 h-5" />}
          color={getLatestValue('blockdag_tip_age_seconds', primaryNode) > 60 ? 'critical' : 'primary'}
        />
        <KPICard
          title="Virtual Height"
          value={formatNumber(getLatestValue('blockdag_virtual_height', primaryNode), 0)}
          subtitle="Current chain height"
          icon={<Network className="w-5 h-5" />}
        />
        <KPICard
          title="Finality Lag"
          value={formatNumber(getLatestValue('blockdag_finality_lag_blocks', primaryNode), 0)}
          subtitle="Blocks behind"
          icon={<Clock className="w-5 h-5" />}
          color={getLatestValue('blockdag_finality_lag_blocks', primaryNode) > 50 ? 'critical' : 'primary'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="DAG Tips Count"
          value={formatNumber(getLatestValue('blockdag_dag_tips_count', primaryNode), 1)}
          icon={<Network className="w-5 h-5" />}
          color={getLatestValue('blockdag_dag_tips_count', primaryNode) > 25 ? 'warning' : 'primary'}
        />
        <KPICard
          title="Peers Connected"
          value={formatNumber(getLatestValue('blockdag_peers_connected', primaryNode), 0)}
          icon={<Network className="w-5 h-5" />}
          color={getLatestValue('blockdag_peers_connected', primaryNode) < 6 ? 'warning' : 'success'}
        />
        <KPICard
          title="Mempool Size"
          value={formatNumber(getLatestValue('blockdag_mempool_size', primaryNode), 0)}
          subtitle={formatBytes(getLatestValue('blockdag_mempool_bytes', primaryNode))}
          icon={<Database className="w-5 h-5" />}
        />
        <KPICard
          title="TPS"
          value={formatNumber(getLatestValue('blockdag_tps', primaryNode), 1)}
          subtitle="Transactions per second"
          icon={<Zap className="w-5 h-5" />}
        />
      </div>

      <AlertPanel alerts={alerts} />

      <DAGVisualizer selectedNode={selectedNode} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimeSeriesChart
          title="Virtual Height Over Time"
          data={selectedNode === 'All' ? metricsEngine.getMetricData('Node A', 'blockdag_virtual_height', timeRange) : getNodeData('blockdag_virtual_height') as any}
          compareData={selectedNode === 'All' ? getNodeData('blockdag_virtual_height') as any : undefined}
          yAxisLabel="Height"
        />
        <TimeSeriesChart
          title="Tip Age Over Time"
          data={selectedNode === 'All' ? metricsEngine.getMetricData('Node A', 'blockdag_tip_age_seconds', timeRange) : getNodeData('blockdag_tip_age_seconds') as any}
          compareData={selectedNode === 'All' ? getNodeData('blockdag_tip_age_seconds') as any : undefined}
          yAxisLabel="Seconds"
        />
        <TimeSeriesChart
          title="DAG Tips Count Over Time"
          data={selectedNode === 'All' ? metricsEngine.getMetricData('Node A', 'blockdag_dag_tips_count', timeRange) : getNodeData('blockdag_dag_tips_count') as any}
          compareData={selectedNode === 'All' ? getNodeData('blockdag_dag_tips_count') as any : undefined}
          yAxisLabel="Count"
        />
        <TimeSeriesChart
          title="Mempool Size Over Time"
          data={selectedNode === 'All' ? metricsEngine.getMetricData('Node A', 'blockdag_mempool_size', timeRange) : getNodeData('blockdag_mempool_size') as any}
          compareData={selectedNode === 'All' ? getNodeData('blockdag_mempool_size') as any : undefined}
          yAxisLabel="Transactions"
        />
        <TimeSeriesChart
          title="TPS Over Time"
          data={selectedNode === 'All' ? metricsEngine.getMetricData('Node A', 'blockdag_tps', timeRange) : getNodeData('blockdag_tps') as any}
          compareData={selectedNode === 'All' ? getNodeData('blockdag_tps') as any : undefined}
          yAxisLabel="TPS"
        />
      </div>
    </div>
  );
}

