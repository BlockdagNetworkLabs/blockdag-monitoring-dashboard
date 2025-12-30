import { describe, it, expect, beforeEach } from 'vitest';
import { alertRules, evaluateAlerts } from '../alertRules';
import { MetricsEngine } from '../../mockMetrics/metricsEngine';
import { NodeMetrics } from '../../types/metrics';

describe('Alert Rules', () => {
  let engine: MetricsEngine;
  let nodeMetrics: NodeMetrics | undefined;

  beforeEach(() => {
    engine = new MetricsEngine();
    nodeMetrics = engine.getNodeMetrics('Node A');
  });

  describe('Alert Rule Definitions', () => {
    it('should have all required alert rules', () => {
      expect(alertRules.length).toBeGreaterThan(0);
      
      const ruleIds = alertRules.map(r => r.id);
      expect(ruleIds).toContain('tip_age_high');
      expect(ruleIds).toContain('dag_tips_high');
      expect(ruleIds).toContain('peers_low');
      expect(ruleIds).toContain('node_down');
    });

    it('should have proper severity levels', () => {
      alertRules.forEach(rule => {
        expect(['warning', 'critical']).toContain(rule.severity);
      });
    });

    it('should have condition functions', () => {
      alertRules.forEach(rule => {
        expect(typeof rule.condition).toBe('function');
      });
    });
  });

  describe('Alert Evaluation', () => {
    it('should evaluate alerts for node metrics', () => {
      if (!nodeMetrics) {
        throw new Error('Node metrics not available');
      }
      
      const evaluations = evaluateAlerts(nodeMetrics);
      expect(evaluations).toBeDefined();
      expect(Array.isArray(evaluations)).toBe(true);
      expect(evaluations.length).toBe(alertRules.length);
    });

    it('should detect node down condition', () => {
      if (!nodeMetrics) {
        throw new Error('Node metrics not available');
      }
      
      // Set node to down
      const nodeUpMetric = nodeMetrics.metrics.get('blockdag_node_up');
      if (nodeUpMetric) {
        nodeUpMetric.dataPoints.push({
          timestamp: Date.now(),
          value: 0,
        });
      }
      
      const evaluations = evaluateAlerts(nodeMetrics);
      const nodeDownEval = evaluations.find(e => e.rule.id === 'node_down');
      expect(nodeDownEval).toBeDefined();
      expect(nodeDownEval?.active).toBe(true);
    });

    it('should detect high tip age', () => {
      if (!nodeMetrics) {
        throw new Error('Node metrics not available');
      }
      
      // Set tip age to high value
      const tipAgeMetric = nodeMetrics.metrics.get('blockdag_tip_age_seconds');
      if (tipAgeMetric) {
        tipAgeMetric.dataPoints.push({
          timestamp: Date.now(),
          value: 70, // Above 60 threshold
        });
      }
      
      const evaluations = evaluateAlerts(nodeMetrics);
      const tipAgeEval = evaluations.find(e => e.rule.id === 'tip_age_high');
      expect(tipAgeEval).toBeDefined();
      expect(tipAgeEval?.active).toBe(true);
    });

    it('should detect low peer count', () => {
      if (!nodeMetrics) {
        throw new Error('Node metrics not available');
      }
      
      // Set peers to low value
      const peersMetric = nodeMetrics.metrics.get('blockdag_peers_connected');
      if (peersMetric) {
        peersMetric.dataPoints.push({
          timestamp: Date.now(),
          value: 4, // Below 6 threshold
        });
      }
      
      const evaluations = evaluateAlerts(nodeMetrics);
      const peersEval = evaluations.find(e => e.rule.id === 'peers_low');
      expect(peersEval).toBeDefined();
      expect(peersEval?.active).toBe(true);
    });

    it('should detect high DAG tips count', () => {
      if (!nodeMetrics) {
        throw new Error('Node metrics not available');
      }
      
      // Set tips count to high value
      const tipsMetric = nodeMetrics.metrics.get('blockdag_dag_tips_count');
      if (tipsMetric) {
        tipsMetric.dataPoints.push({
          timestamp: Date.now(),
          value: 30, // Above 25 threshold
        });
      }
      
      const evaluations = evaluateAlerts(nodeMetrics);
      const tipsEval = evaluations.find(e => e.rule.id === 'dag_tips_high');
      expect(tipsEval).toBeDefined();
      expect(tipsEval?.active).toBe(true);
    });

    it('should detect high finality lag', () => {
      if (!nodeMetrics) {
        throw new Error('Node metrics not available');
      }
      
      // Set finality lag to high value
      const lagMetric = nodeMetrics.metrics.get('blockdag_finality_lag_blocks');
      if (lagMetric) {
        lagMetric.dataPoints.push({
          timestamp: Date.now(),
          value: 60, // Above 50 threshold
        });
      }
      
      const evaluations = evaluateAlerts(nodeMetrics);
      const lagEval = evaluations.find(e => e.rule.id === 'finality_lag_high');
      expect(lagEval).toBeDefined();
      expect(lagEval?.active).toBe(true);
    });

    it('should detect low disk space', () => {
      if (!nodeMetrics) {
        throw new Error('Node metrics not available');
      }
      
      // Set disk free to low value
      const diskMetric = nodeMetrics.metrics.get('blockdag_disk_free_bytes');
      if (diskMetric) {
        diskMetric.dataPoints.push({
          timestamp: Date.now(),
          value: 5 * 1024 * 1024 * 1024, // 5GB, below 10GB threshold
        });
      }
      
      const evaluations = evaluateAlerts(nodeMetrics);
      const diskEval = evaluations.find(e => e.rule.id === 'disk_free_low');
      expect(diskEval).toBeDefined();
      expect(diskEval?.active).toBe(true);
    });

    it('should not trigger alerts for normal values', () => {
      if (!nodeMetrics) {
        throw new Error('Node metrics not available');
      }
      
      // Set all metrics to normal values
      const tipAgeMetric = nodeMetrics.metrics.get('blockdag_tip_age_seconds');
      if (tipAgeMetric) {
        tipAgeMetric.dataPoints.push({
          timestamp: Date.now(),
          value: 5, // Normal
        });
      }
      
      const peersMetric = nodeMetrics.metrics.get('blockdag_peers_connected');
      if (peersMetric) {
        peersMetric.dataPoints.push({
          timestamp: Date.now(),
          value: 12, // Normal
        });
      }
      
      const evaluations = evaluateAlerts(nodeMetrics);
      const tipAgeEval = evaluations.find(e => e.rule.id === 'tip_age_high');
      const peersEval = evaluations.find(e => e.rule.id === 'peers_low');
      
      expect(tipAgeEval?.active).toBe(false);
      expect(peersEval?.active).toBe(false);
    });
  });

  describe('Histogram Alert Evaluation', () => {
    it('should evaluate histogram metrics for alerts', () => {
      if (!nodeMetrics) {
        throw new Error('Node metrics not available');
      }
      
      // Set high propagation latency
      const histData = nodeMetrics.histogramMetrics.get('blockdag_block_propagation_latency_seconds');
      if (histData) {
        histData.push({
          timestamp: Date.now(),
          quantiles: {
            p50: 0.1,
            p95: 2.5, // Above 2s threshold
            p99: 3.0,
          },
        });
      }
      
      const evaluations = evaluateAlerts(nodeMetrics);
      const propEval = evaluations.find(e => e.rule.id === 'propagation_latency_high');
      expect(propEval).toBeDefined();
      expect(propEval?.active).toBe(true);
    });
  });
});

