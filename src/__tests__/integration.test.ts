import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MetricsEngine } from '../mockMetrics/metricsEngine';
import { evaluateAlerts } from '../alerts/alertRules';
import { formatBytes, formatDuration, formatNumber } from '../utils/formatting';

describe('Integration Tests', () => {
  let engine: MetricsEngine;

  beforeEach(() => {
    engine = new MetricsEngine();
    vi.useFakeTimers();
  });

  afterEach(() => {
    engine.stop();
    vi.useRealTimers();
  });

  describe('Metrics Engine + Alert System Integration', () => {
    it('should generate metrics and evaluate alerts together', () => {
      engine.start();
      
      // Generate some metrics
      vi.advanceTimersByTime(5000);
      
      const nodeMetrics = engine.getNodeMetrics('Node A');
      expect(nodeMetrics).toBeDefined();
      
      if (nodeMetrics) {
        const evaluations = evaluateAlerts(nodeMetrics);
        expect(evaluations).toBeDefined();
        expect(Array.isArray(evaluations)).toBe(true);
      }
    });

    it('should detect anomalies through alert system', () => {
      const config = {
        nodeDowntime: true,
        peerCollapse: false,
        propagationSlowdown: false,
        mempoolOverload: false,
        diskPressure: false,
        rpcFlood: false,
        consensusStress: false,
      };
      
      engine.setAnomalyConfig(config);
      engine.start();
      
      vi.advanceTimersByTime(2000);
      
      const nodeMetrics = engine.getNodeMetrics('Node A');
      if (nodeMetrics) {
        const evaluations = evaluateAlerts(nodeMetrics);
        const nodeDownEval = evaluations.find(e => e.rule.id === 'node_down');
        expect(nodeDownEval?.active).toBe(true);
      }
    });
  });

  describe('Metrics Engine + Formatting Integration', () => {
    it('should format metric values correctly', () => {
      engine.start();
      vi.advanceTimersByTime(2000);
      
      const mempoolData = engine.getMetricData('Node A', 'blockdag_mempool_bytes', '5m');
      if (mempoolData.length > 0) {
        const value = mempoolData[mempoolData.length - 1].value;
        const formatted = formatBytes(value);
        expect(formatted).toMatch(/\d+\.\d+ (B|KB|MB|GB|TB)/);
      }
    });

    it('should format duration values correctly', () => {
      engine.start();
      vi.advanceTimersByTime(2000);
      
      const latencyData = engine.getHistogramData('Node A', 'blockdag_block_propagation_latency_seconds', '5m', 'p95');
      if (latencyData.length > 0) {
        const value = latencyData[latencyData.length - 1].value;
        const formatted = formatDuration(value);
        expect(typeof formatted).toBe('string');
        expect(formatted.length).toBeGreaterThan(0);
      }
    });

    it('should format number values correctly', () => {
      engine.start();
      vi.advanceTimersByTime(2000);
      
      const heightData = engine.getMetricData('Node A', 'blockdag_virtual_height', '5m');
      if (heightData.length > 0) {
        const value = heightData[heightData.length - 1].value;
        const formatted = formatNumber(value);
        expect(typeof formatted).toBe('string');
      }
    });
  });

  describe('End-to-End Workflow', () => {
    it('should complete full workflow: generate -> retrieve -> format -> alert', () => {
      // 1. Start engine
      engine.start();
      
      // 2. Generate metrics
      vi.advanceTimersByTime(5000);
      
      // 3. Retrieve metrics
      const nodeMetrics = engine.getNodeMetrics('Node A');
      expect(nodeMetrics).toBeDefined();
      
      if (nodeMetrics) {
        // 4. Format values
        const tipAge = nodeMetrics.metrics.get('blockdag_tip_age_seconds');
        if (tipAge && tipAge.dataPoints.length > 0) {
          const value = tipAge.dataPoints[tipAge.dataPoints.length - 1].value;
          const formatted = formatDuration(value);
          expect(formatted).toBeDefined();
        }
        
        // 5. Evaluate alerts
        const evaluations = evaluateAlerts(nodeMetrics);
        expect(evaluations.length).toBeGreaterThan(0);
        
        // 6. Check for active alerts
        const activeAlerts = evaluations.filter(e => e.active);
        expect(Array.isArray(activeAlerts)).toBe(true);
      }
    });

    it('should handle anomaly injection workflow', () => {
      // 1. Set anomaly
      const config = {
        peerCollapse: true,
        nodeDowntime: false,
        propagationSlowdown: false,
        mempoolOverload: false,
        diskPressure: false,
        rpcFlood: false,
        consensusStress: false,
      };
      engine.setAnomalyConfig(config);
      
      // 2. Start and generate
      engine.start();
      vi.advanceTimersByTime(2000);
      
      // 3. Verify anomaly in metrics
      const peers = engine.getMetricData('Node A', 'blockdag_peers_connected', '5m');
      const latest = peers[peers.length - 1];
      expect(latest.value).toBeLessThan(6);
      
      // 4. Verify alert triggers
      const nodeMetrics = engine.getNodeMetrics('Node A');
      if (nodeMetrics) {
        const evaluations = evaluateAlerts(nodeMetrics);
        const peersAlert = evaluations.find(e => e.rule.id === 'peers_low');
        expect(peersAlert?.active).toBe(true);
      }
    });
  });
});

