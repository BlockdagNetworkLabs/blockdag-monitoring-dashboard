import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Overview } from '../Overview';

// Mock the metrics engine
vi.mock('../../mockMetrics/metricsEngine', () => {
  const mockEngine = {
    getNodes: () => ['Node A', 'Node B', 'Node C'],
    getMetricData: vi.fn(() => [
      { timestamp: Date.now(), value: 100 },
      { timestamp: Date.now() + 1000, value: 101 },
    ]),
    getNodeMetrics: vi.fn(() => ({
      nodeId: 'Node A',
      metrics: new Map(),
      histogramMetrics: new Map(),
      lastUpdate: Date.now(),
    })),
  };
  return {
    metricsEngine: mockEngine,
  };
});

describe('Overview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderOverview = (selectedNode = 'Node A', timeRange = '1h' as const) => {
    return render(
      <BrowserRouter>
        <Overview selectedNode={selectedNode} timeRange={timeRange} />
      </BrowserRouter>
    );
  };

  it('should render overview page', () => {
    renderOverview();
    
    expect(screen.getByText(/Node Status/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Tip Age/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Virtual Height/i).length).toBeGreaterThan(0);
  });

  it('should display KPI cards', () => {
    renderOverview();
    
    expect(screen.getByText(/Node Status/i)).toBeInTheDocument();
    expect(screen.getAllByText(/DAG Tips Count/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Peers Connected/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Mempool Size/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/TPS/i).length).toBeGreaterThan(0);
  });

  it('should display time series charts', () => {
    renderOverview();
    
    expect(screen.getByText(/Virtual Height Over Time/i)).toBeInTheDocument();
    expect(screen.getByText(/Tip Age Over Time/i)).toBeInTheDocument();
    expect(screen.getByText(/DAG Tips Count Over Time/i)).toBeInTheDocument();
  });

  it('should display alert panel', () => {
    renderOverview();
    
    expect(screen.getAllByText(/Active Alerts/i).length).toBeGreaterThan(0);
  });

  it('should handle "All" node selection', () => {
    renderOverview('All');
    
    // Should still render all components
    expect(screen.getByText(/Node Status/i)).toBeInTheDocument();
  });
});

