import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Overview } from './views/Overview';
import { DAGHealth } from './views/DAGHealth';
import { Propagation } from './views/Propagation';
import { Consensus } from './views/Consensus';
import { Transactions } from './views/Transactions';
import { RPC } from './views/RPC';
import { Storage } from './views/Storage';
import { Security } from './views/Security';
import { metricsEngine } from './mockMetrics/metricsEngine';
import { TimeRange, AnomalyConfig } from './types/metrics';

function App() {
  const [selectedNode, setSelectedNode] = useState<string>('All');
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [anomalyConfig, setAnomalyConfig] = useState<AnomalyConfig>({
    nodeDowntime: false,
    peerCollapse: false,
    propagationSlowdown: false,
    mempoolOverload: false,
    diskPressure: false,
    rpcFlood: false,
    consensusStress: false,
  });

  useEffect(() => {
    metricsEngine.start();
    metricsEngine.setAnomalyConfig(anomalyConfig);
    return () => {
      metricsEngine.stop();
    };
  }, [anomalyConfig]);

  const handleAnomalyConfigChange = (config: AnomalyConfig) => {
    setAnomalyConfig(config);
    metricsEngine.setAnomalyConfig(config);
  };

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-grafana-darker">
        <Sidebar />
        <div className="flex-1 flex flex-col ml-64">
          <TopBar
            selectedNode={selectedNode}
            onNodeChange={setSelectedNode}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            autoRefresh={autoRefresh}
            onAutoRefreshChange={setAutoRefresh}
            anomalyConfig={anomalyConfig}
            onAnomalyConfigChange={handleAnomalyConfigChange}
          />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route
                path="/"
                element={<Overview selectedNode={selectedNode} timeRange={timeRange} />}
              />
              <Route
                path="/dag-health"
                element={<DAGHealth selectedNode={selectedNode} timeRange={timeRange} />}
              />
              <Route
                path="/propagation"
                element={<Propagation selectedNode={selectedNode} timeRange={timeRange} />}
              />
              <Route
                path="/consensus"
                element={<Consensus selectedNode={selectedNode} timeRange={timeRange} />}
              />
              <Route
                path="/transactions"
                element={<Transactions selectedNode={selectedNode} timeRange={timeRange} />}
              />
              <Route
                path="/rpc"
                element={<RPC selectedNode={selectedNode} timeRange={timeRange} />}
              />
              <Route
                path="/storage"
                element={<Storage selectedNode={selectedNode} timeRange={timeRange} />}
              />
              <Route
                path="/security"
                element={<Security selectedNode={selectedNode} timeRange={timeRange} />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;

