import { Metric, DataPoint, HistogramDataPoint, HistogramQuantiles, NodeMetrics, AnomalyConfig } from '../types/metrics';

const NODES = ['Node A', 'Node B', 'Node C'];
const DATA_RETENTION_MS = 6 * 60 * 60 * 1000; // 6 hours
const UPDATE_INTERVAL_MS = 2000; // 2 seconds

export class MetricsEngine {
  private nodes: Map<string, NodeMetrics> = new Map();
  private anomalyConfig: AnomalyConfig = {
    nodeDowntime: false,
    peerCollapse: false,
    propagationSlowdown: false,
    mempoolOverload: false,
    diskPressure: false,
    rpcFlood: false,
    consensusStress: false,
  };
  private intervalId: number | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initializeNodes();
  }

  private initializeNodes() {
    NODES.forEach((nodeId) => {
      const metrics = new Map<string, Metric>();
      const histogramMetrics = new Map<string, HistogramDataPoint[]>();
      
      // Initialize all metrics
      this.initializeMetric(metrics, 'blockdag_node_up', 'gauge', 1);
      this.initializeMetric(metrics, 'blockdag_process_uptime_seconds', 'gauge', 0);
      this.initializeMetric(metrics, 'blockdag_virtual_height', 'gauge', 1000000);
      this.initializeMetric(metrics, 'blockdag_finalized_height', 'gauge', 999950);
      this.initializeMetric(metrics, 'blockdag_tip_age_seconds', 'gauge', 5);
      this.initializeMetric(metrics, 'blockdag_bluescore', 'counter', 1000000);
      this.initializeMetric(metrics, 'blockdag_finality_lag_blocks', 'gauge', 50);
      this.initializeMetric(metrics, 'blockdag_dag_tips_count', 'gauge', 3);
      this.initializeMetric(metrics, 'blockdag_dag_width', 'gauge', 2.5);
      this.initializeMetric(metrics, 'blockdag_virtual_parent_switches_total', 'counter', 0);
      this.initializeMetric(metrics, 'blockdag_blocks_accepted_total', 'counter', 50000);
      this.initializeMetric(metrics, 'blockdag_blocks_rejected_total', 'counter', 100);
      this.initializeMetric(metrics, 'blockdag_orphan_blocks_total', 'counter', 50);
      this.initializeMetric(metrics, 'blockdag_stale_blocks_total', 'counter', 30);
      this.initializeMetric(metrics, 'blockdag_conflict_blocks_total', 'counter', 20);
      this.initializeMetric(metrics, 'blockdag_peers_connected', 'gauge', 12);
      this.initializeMetric(metrics, 'blockdag_peers_inbound', 'gauge', 6);
      this.initializeMetric(metrics, 'blockdag_peers_outbound', 'gauge', 6);
      this.initializeMetric(metrics, 'blockdag_peer_disconnects_total', 'counter', 5);
      this.initializeMetric(metrics, 'blockdag_dial_failures_total', 'counter', 2);
      this.initializeMetric(metrics, 'blockdag_mempool_size', 'gauge', 5000);
      this.initializeMetric(metrics, 'blockdag_mempool_bytes', 'gauge', 50 * 1024 * 1024);
      this.initializeMetric(metrics, 'blockdag_tx_received_total', 'counter', 100000);
      this.initializeMetric(metrics, 'blockdag_tx_evicted_total', 'counter', 500);
      this.initializeMetric(metrics, 'blockdag_tx_committed_total', 'counter', 95000);
      this.initializeMetric(metrics, 'blockdag_tps', 'gauge', 10);
      this.initializeMetric(metrics, 'blockdag_rpc_requests_total', 'counter', 50000);
      this.initializeMetric(metrics, 'blockdag_rpc_errors_total', 'counter', 100);
      this.initializeMetric(metrics, 'blockdag_rpc_active_connections', 'gauge', 25);
      this.initializeMetric(metrics, 'blockdag_db_size_bytes', 'gauge', 50 * 1024 * 1024 * 1024);
      this.initializeMetric(metrics, 'blockdag_db_compactions_total', 'counter', 10);
      this.initializeMetric(metrics, 'blockdag_disk_free_bytes', 'gauge', 500 * 1024 * 1024 * 1024);
      this.initializeMetric(metrics, 'blockdag_invalid_blocks_total', 'counter', 5);
      this.initializeMetric(metrics, 'blockdag_invalid_txs_total', 'counter', 200);
      this.initializeMetric(metrics, 'blockdag_banned_peers_total', 'counter', 1);
      this.initializeMetric(metrics, 'blockdag_rate_limited_peers_total', 'counter', 0);
      this.initializeMetric(metrics, 'blockdag_malformed_messages_total', 'counter', 10);

      // Initialize histogram metrics
      histogramMetrics.set('blockdag_merge_latency_seconds', []);
      histogramMetrics.set('blockdag_block_propagation_latency_seconds', []);
      histogramMetrics.set('blockdag_tx_propagation_latency_seconds', []);
      histogramMetrics.set('blockdag_rpc_duration_seconds', []);
      histogramMetrics.set('blockdag_db_read_latency_seconds', []);
      histogramMetrics.set('blockdag_db_write_latency_seconds', []);
      histogramMetrics.set('blockdag_db_compaction_time_seconds', []);
      histogramMetrics.set('blockdag_consensus_processing_time_seconds', []);

      this.nodes.set(nodeId, {
        nodeId,
        metrics,
        histogramMetrics,
        lastUpdate: Date.now(),
      });
    });
  }

  private initializeMetric(metrics: Map<string, Metric>, name: string, type: 'gauge' | 'counter', initialValue: number) {
    metrics.set(name, {
      name,
      type,
      help: `Mock ${name}`,
      dataPoints: [{
        timestamp: Date.now(),
        value: initialValue,
      }],
    });
  }

  start() {
    if (this.intervalId !== null) return;
    
    this.intervalId = window.setInterval(() => {
      this.updateMetrics();
      this.cleanupOldData();
      this.notifyListeners();
    }, UPDATE_INTERVAL_MS);
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  setAnomalyConfig(config: AnomalyConfig) {
    this.anomalyConfig = config;
  }

  getAnomalyConfig(): AnomalyConfig {
    return { ...this.anomalyConfig };
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  getNodes(): string[] {
    return Array.from(this.nodes.keys());
  }

  getNodeMetrics(nodeId: string): NodeMetrics | undefined {
    return this.nodes.get(nodeId);
  }

  getAllNodesMetrics(): Map<string, NodeMetrics> {
    return new Map(this.nodes);
  }

  private updateMetrics() {
    const now = Date.now();
    
    this.nodes.forEach((nodeMetrics, nodeId) => {
      // Apply anomalies
      const isDown = this.anomalyConfig.nodeDowntime && nodeId === 'Node A';
      
      if (isDown) {
        nodeMetrics.metrics.get('blockdag_node_up')!.dataPoints.push({
          timestamp: now,
          value: 0,
        });
        nodeMetrics.lastUpdate = now;
        return;
      }

      // Update all metrics
      this.updateGaugeMetrics(nodeMetrics, now, nodeId);
      this.updateCounterMetrics(nodeMetrics, now, nodeId);
      this.updateHistogramMetrics(nodeMetrics, now, nodeId);
      
      nodeMetrics.lastUpdate = now;
    });
  }

  private updateGaugeMetrics(nodeMetrics: NodeMetrics, now: number, nodeId: string) {
    const baseValues: Record<string, number> = {
      'blockdag_node_up': 1,
      'blockdag_process_uptime_seconds': (now - (Date.now() - 3600000)) / 1000,
      'blockdag_virtual_height': 1000000 + Math.floor((now - Date.now() + 3600000) / 1000) * 0.1,
      'blockdag_finalized_height': 999950 + Math.floor((now - Date.now() + 3600000) / 1000) * 0.1,
      'blockdag_tip_age_seconds': 5,
      'blockdag_finality_lag_blocks': 50,
      'blockdag_dag_tips_count': 3,
      'blockdag_dag_width': 2.5,
      'blockdag_peers_connected': 12,
      'blockdag_peers_inbound': 6,
      'blockdag_peers_outbound': 6,
      'blockdag_mempool_size': 5000,
      'blockdag_mempool_bytes': 50 * 1024 * 1024,
      'blockdag_tps': 10,
      'blockdag_rpc_active_connections': 25,
      'blockdag_db_size_bytes': 50 * 1024 * 1024 * 1024,
      'blockdag_disk_free_bytes': 500 * 1024 * 1024 * 1024,
    };

    // Apply anomalies
    if (this.anomalyConfig.peerCollapse && nodeId === 'Node A') {
      baseValues['blockdag_peers_connected'] = 2;
      baseValues['blockdag_peers_inbound'] = 1;
      baseValues['blockdag_peers_outbound'] = 1;
      baseValues['blockdag_dag_tips_count'] = 25;
    }

    if (this.anomalyConfig.mempoolOverload && nodeId === 'Node A') {
      baseValues['blockdag_mempool_size'] = 50000;
      baseValues['blockdag_mempool_bytes'] = 500 * 1024 * 1024;
    }

    if (this.anomalyConfig.diskPressure && nodeId === 'Node A') {
      baseValues['blockdag_disk_free_bytes'] = 5 * 1024 * 1024 * 1024; // 5GB
    }

    if (this.anomalyConfig.consensusStress && nodeId === 'Node A') {
      baseValues['blockdag_finality_lag_blocks'] = 200;
      baseValues['blockdag_tip_age_seconds'] = 120;
    }

    Object.entries(baseValues).forEach(([name, baseValue]) => {
      const metric = nodeMetrics.metrics.get(name);
      if (metric && metric.type === 'gauge') {
        const noise = (Math.random() - 0.5) * 0.1 * baseValue;
        const value = Math.max(0, baseValue + noise);
        metric.dataPoints.push({
          timestamp: now,
          value,
        });
      }
    });
  }

  private updateCounterMetrics(nodeMetrics: NodeMetrics, now: number, nodeId: string) {
    const incrementRates: Record<string, number> = {
      'blockdag_bluescore': 0.1,
      'blockdag_virtual_parent_switches_total': 0.001,
      'blockdag_blocks_accepted_total': 0.5,
      'blockdag_blocks_rejected_total': 0.001,
      'blockdag_orphan_blocks_total': 0.0005,
      'blockdag_stale_blocks_total': 0.0003,
      'blockdag_conflict_blocks_total': 0.0002,
      'blockdag_peer_disconnects_total': 0.0001,
      'blockdag_dial_failures_total': 0.00005,
      'blockdag_tx_received_total': 5,
      'blockdag_tx_evicted_total': 0.1,
      'blockdag_tx_committed_total': 5,
      'blockdag_rpc_requests_total': 10,
      'blockdag_rpc_errors_total': 0.05,
      'blockdag_db_compactions_total': 0.0001,
      'blockdag_invalid_blocks_total': 0.0001,
      'blockdag_invalid_txs_total': 0.1,
      'blockdag_banned_peers_total': 0.00001,
      'blockdag_rate_limited_peers_total': 0.0001,
      'blockdag_malformed_messages_total': 0.01,
    };

    // Apply anomalies
    if (this.anomalyConfig.rpcFlood && nodeId === 'Node A') {
      incrementRates['blockdag_rpc_requests_total'] = 100;
      incrementRates['blockdag_rpc_errors_total'] = 5;
    }

    if (this.anomalyConfig.peerCollapse && nodeId === 'Node A') {
      incrementRates['blockdag_orphan_blocks_total'] = 0.1;
      incrementRates['blockdag_stale_blocks_total'] = 0.1;
    }

    if (this.anomalyConfig.mempoolOverload && nodeId === 'Node A') {
      incrementRates['blockdag_tx_evicted_total'] = 10;
    }

    Object.entries(incrementRates).forEach(([name, rate]) => {
      const metric = nodeMetrics.metrics.get(name);
      if (metric && metric.type === 'counter') {
        const lastPoint = metric.dataPoints[metric.dataPoints.length - 1];
        const increment = rate * (UPDATE_INTERVAL_MS / 1000);
        const newValue = lastPoint.value + increment;
        metric.dataPoints.push({
          timestamp: now,
          value: newValue,
        });
      }
    });
  }

  private updateHistogramMetrics(nodeMetrics: NodeMetrics, now: number, nodeId: string) {
    const baseLatencies: Record<string, HistogramQuantiles> = {
      'blockdag_merge_latency_seconds': { p50: 0.1, p95: 0.3, p99: 0.5 },
      'blockdag_block_propagation_latency_seconds': { p50: 0.05, p95: 0.2, p99: 0.4 },
      'blockdag_tx_propagation_latency_seconds': { p50: 0.02, p95: 0.1, p99: 0.2 },
      'blockdag_rpc_duration_seconds': { p50: 0.01, p95: 0.05, p99: 0.1 },
      'blockdag_db_read_latency_seconds': { p50: 0.001, p95: 0.005, p99: 0.01 },
      'blockdag_db_write_latency_seconds': { p50: 0.002, p95: 0.01, p99: 0.02 },
      'blockdag_db_compaction_time_seconds': { p50: 1, p95: 5, p99: 10 },
      'blockdag_consensus_processing_time_seconds': { p50: 0.05, p95: 0.15, p99: 0.3 },
    };

    // Apply anomalies
    if (this.anomalyConfig.propagationSlowdown && nodeId === 'Node A') {
      baseLatencies['blockdag_block_propagation_latency_seconds'] = { p50: 0.5, p95: 2.5, p99: 5 };
      baseLatencies['blockdag_tx_propagation_latency_seconds'] = { p50: 0.2, p95: 1, p99: 2 };
    }

    if (this.anomalyConfig.diskPressure && nodeId === 'Node A') {
      baseLatencies['blockdag_db_read_latency_seconds'] = { p50: 0.01, p95: 0.1, p99: 0.5 };
      baseLatencies['blockdag_db_write_latency_seconds'] = { p50: 0.02, p95: 0.2, p99: 1 };
    }

    if (this.anomalyConfig.rpcFlood && nodeId === 'Node A') {
      baseLatencies['blockdag_rpc_duration_seconds'] = { p50: 0.1, p95: 1, p99: 2 };
    }

    if (this.anomalyConfig.consensusStress && nodeId === 'Node A') {
      baseLatencies['blockdag_merge_latency_seconds'] = { p50: 0.5, p95: 2, p99: 5 };
      baseLatencies['blockdag_consensus_processing_time_seconds'] = { p50: 0.2, p95: 1, p99: 3 };
    }

    Object.entries(baseLatencies).forEach(([name, baseQuantiles]) => {
      const histData = nodeMetrics.histogramMetrics.get(name) || [];
      const noise = (Math.random() - 0.5) * 0.1;
      const quantiles: HistogramQuantiles = {
        p50: Math.max(0, baseQuantiles.p50 * (1 + noise)),
        p95: Math.max(0, baseQuantiles.p95 * (1 + noise)),
        p99: Math.max(0, baseQuantiles.p99 * (1 + noise)),
      };
      histData.push({
        timestamp: now,
        quantiles,
      });
      nodeMetrics.histogramMetrics.set(name, histData);
    });
  }

  private cleanupOldData() {
    const cutoff = Date.now() - DATA_RETENTION_MS;
    
    this.nodes.forEach((nodeMetrics) => {
      nodeMetrics.metrics.forEach((metric) => {
        metric.dataPoints = metric.dataPoints.filter(dp => dp.timestamp >= cutoff);
      });
      
      nodeMetrics.histogramMetrics.forEach((histData, name) => {
        const filtered = histData.filter(dp => dp.timestamp >= cutoff);
        nodeMetrics.histogramMetrics.set(name, filtered);
      });
    });
  }

  getMetricData(nodeId: string, metricName: string, timeRange: string): DataPoint[] {
    const nodeMetrics = this.nodes.get(nodeId);
    if (!nodeMetrics) return [];
    
    const metric = nodeMetrics.metrics.get(metricName);
    if (!metric) return [];
    
    const rangeMs = this.getTimeRangeMs(timeRange);
    const cutoff = Date.now() - rangeMs;
    
    return metric.dataPoints.filter(dp => dp.timestamp >= cutoff);
  }

  getHistogramData(nodeId: string, metricName: string, timeRange: string, quantile: 'p50' | 'p95' | 'p99'): DataPoint[] {
    const nodeMetrics = this.nodes.get(nodeId);
    if (!nodeMetrics) return [];
    
    const histData = nodeMetrics.histogramMetrics.get(metricName);
    if (!histData) return [];
    
    const rangeMs = this.getTimeRangeMs(timeRange);
    const cutoff = Date.now() - rangeMs;
    
    return histData
      .filter(dp => dp.timestamp >= cutoff)
      .map(dp => ({
        timestamp: dp.timestamp,
        value: dp.quantiles[quantile],
      }));
  }

  private getTimeRangeMs(timeRange: string): number {
    const ranges: Record<string, number> = {
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
    };
    return ranges[timeRange] || ranges['1h'];
  }
}

export const metricsEngine = new MetricsEngine();

