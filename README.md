# BlockDAG Core Monitoring Dashboard

A Grafana-style monitoring dashboard for BlockDAG blockchain core nodes (GhostDAG/PHANTOM-style DAG consensus family). This is a frontend-only application that generates realistic Prometheus-style metrics in the browser.

## Features

- **Grafana-like UI**: Dark theme with professional monitoring dashboard aesthetics
- **Mock Prometheus Metrics**: Browser-based metrics engine generating realistic BlockDAG node metrics
- **Multiple Nodes**: Monitor Node A, Node B, Node C, or all nodes simultaneously
- **Time Range Selection**: 5m, 15m, 1h, 6h time windows
- **Anomaly Injection**: Test scenarios including node downtime, peer collapse, propagation slowdown, mempool overload, disk pressure, RPC flood, and consensus stress
- **Alert System**: Real-time alerting with severity levels (warning/critical)
- **8 Dashboard Pages**: Comprehensive monitoring across all aspects of BlockDAG node health
- **Automated Testing**: Tests run automatically on build, commit, and push

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## Dashboard Pages

### 1. Overview (Ops Summary)
- Node status (UP/DOWN)
- Chain/DAG tip age
- Virtual selected parent height
- Finality lag
- DAG tips count
- Peers connected
- Mempool size
- TPS (committed)
- Time series charts for key metrics

### 2. DAG Health
- DAG tips count and width estimate
- Merge latency
- Conflict rate
- Orphan/stale blocks rate
- Blue score / DAA-like score
- Virtual selected parent switches
- Block acceptance vs rejection rates

### 3. Propagation & P2P
- Connected peers (inbound/outbound)
- Block propagation latency (p50/p95/p99)
- Tx propagation latency (p50/p95/p99)
- Gossip messages rate
- Disconnect reasons
- Dial failures

### 4. Consensus & Finality
- Virtual height vs finalized height
- Finality lag blocks
- Reorg count / virtual ordering rewrites
- Consensus processing time (p95)

### 5. Transaction Pipeline
- Mempool size + bytes
- Incoming tx rate
- Dropped/evicted tx rate
- Included tx per block
- Tx execution latency

### 6. RPC / API
- RPC request rate per method
- RPC latency (p50/p95/p99)
- RPC error rate %
- Active connections

### 7. Storage & DB
- Disk free bytes
- DB size bytes
- DB read/write latency (p95)
- Compaction time
- State growth rate

### 8. Security / Abuse
- Invalid blocks rate
- Invalid tx rate
- Banned peers
- Rate-limited peers
- Malformed messages rate

## Mock Metrics Engine

The metrics engine generates data every 2 seconds and maintains up to 6 hours of history in memory. It produces three types of Prometheus-style metrics:

### Metric Types

1. **Gauges**: Fluctuating values (tips count, peers, mempool, disk free)
2. **Counters**: Incrementing values (tx received, blocks accepted, RPC requests)
3. **Histograms**: Quantile-based metrics (propagation latency, RPC latency, DB latency)

### Metric Names

All metrics follow Prometheus naming conventions with the `blockdag_` prefix:

- `blockdag_node_up` (gauge)
- `blockdag_virtual_height` (gauge)
- `blockdag_tip_age_seconds` (gauge)
- `blockdag_dag_tips_count` (gauge)
- `blockdag_peers_connected` (gauge)
- `blockdag_mempool_size` (gauge)
- `blockdag_tx_received_total` (counter)
- `blockdag_block_propagation_latency_seconds` (histogram)
- `blockdag_rpc_duration_seconds` (histogram)
- ... and many more

See the code in `src/mockMetrics/metricsEngine.ts` for the complete list.

## Anomaly Injection

The dashboard includes toggleable anomaly scenarios for testing:

- **Node Downtime**: Node A goes DOWN, metrics freeze, tip age rises
- **Peer Collapse**: Peers drop, tips count spikes, stale blocks increase
- **Propagation Slowdown**: p95/p99 latency spikes; stale/orphans rise
- **Mempool Overload**: Mempool grows, tx drops/evictions rise
- **Disk Pressure**: Disk free decreases, db latency increases
- **RPC Flood**: RPC requests spike, errors rise, latency worsens
- **Consensus Stress**: Finality lag increases, merge latency rises

Toggle these from the top bar to see how the dashboard responds to various failure scenarios.

## Alert Rules

The alert system monitors:

- Tip age > 60s for > 2 minutes (critical)
- DAG tips count > 25 sustained (warning)
- Peers connected < 6 (warning)
- Propagation latency p95 > 2s (warning)
- Finality lag > 50 blocks (critical)
- RPC error rate > 2% (warning)
- Disk free < 10GB (critical)
- Invalid blocks rate > baseline (warning)
- Node is DOWN (critical)

Alerts are displayed in the Overview page and show severity, current value, threshold, and time active.

## Testing

The project includes a comprehensive test suite with **68 tests** that run automatically:

### Automatic Test Execution

Tests run automatically in the following scenarios:
- **Before build**: `npm run build` runs tests first
- **Before commit**: Git pre-commit hook runs tests
- **Before push**: Git pre-push hook runs tests
- **On install**: `npm install` sets up Git hooks

### Running Tests Manually

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

The test suite includes:

1. **Metrics Engine Tests** (16 tests)
   - Initialization and node setup
   - Metric updates (gauges, counters, histograms)
   - Anomaly injection scenarios
   - Data retrieval and filtering
   - Data cleanup and retention
   - Subscription system

2. **Alert System Tests** (12 tests)
   - Alert rule definitions
   - Alert evaluation logic
   - Condition detection (node down, high tip age, low peers, etc.)
   - Histogram-based alert evaluation

3. **Utility Function Tests** (19 tests)
   - Formatting utilities (bytes, duration, numbers, timestamps)
   - Time range utilities

4. **Component Tests** (9 tests)
   - KPI card rendering and styling
   - Component props and behavior

5. **Integration Tests** (7 tests)
   - End-to-end workflows
   - Metrics engine + alert system integration
   - Metrics engine + formatting integration
   - Anomaly injection workflows

6. **View Tests** (5 tests)
   - Dashboard page rendering
   - Component integration

### Writing New Tests

When adding new functionality:

1. Create test files in `__tests__` directories next to the source files
2. Use Vitest's `describe` and `it` blocks
3. Test both happy paths and edge cases
4. Use `vi.fn()` for mocking when needed
5. Use `@testing-library/react` for component tests

Example test structure:
```typescript
import { describe, it, expect } from 'vitest';

describe('MyComponent', () => {
  it('should do something', () => {
    // Test implementation
    expect(result).toBe(expected);
  });
});
```

## Adding a New Metric

1. **Add to metrics engine** (`src/mockMetrics/metricsEngine.ts`):
   - Initialize the metric in `initializeNodes()`
   - Update the metric in `updateGaugeMetrics()`, `updateCounterMetrics()`, or `updateHistogramMetrics()`

2. **Add to a dashboard page** (`src/views/`):
   - Import the metric data using `metricsEngine.getMetricData()` or `metricsEngine.getHistogramData()`
   - Display in a KPI card or chart component

3. **Add alert rule** (optional, `src/alerts/alertRules.ts`):
   - Define condition function
   - Add to `alertRules` array

4. **Add tests** (required):
   - Create test file in `__tests__` directory
   - Test metric generation and retrieval
   - Test alert evaluation if applicable

## Project Structure

```
src/
├── mockMetrics/          # Metrics engine and data generation
│   └── metricsEngine.ts
├── alerts/               # Alert rules and evaluation
│   └── alertRules.ts
├── components/           # Reusable UI components
│   ├── Sidebar.tsx
│   ├── TopBar.tsx
│   ├── KPICard.tsx
│   ├── TimeSeriesChart.tsx
│   ├── HistogramChart.tsx
│   ├── InspectModal.tsx
│   └── AlertPanel.tsx
├── views/                # Dashboard pages
│   ├── Overview.tsx
│   ├── DAGHealth.tsx
│   ├── Propagation.tsx
│   ├── Consensus.tsx
│   ├── Transactions.tsx
│   ├── RPC.tsx
│   ├── Storage.tsx
│   └── Security.tsx
├── types/                # TypeScript type definitions
│   ├── metrics.ts
│   └── alerts.ts
├── utils/                # Utility functions
│   ├── formatting.ts
│   └── timeRange.ts
├── test/                 # Test setup
│   └── setup.ts
├── App.tsx               # Main app component with routing
└── main.tsx              # Entry point
```

## Technology Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** for styling
- **Recharts** for charting
- **React Router** for navigation
- **Lucide React** for icons
- **Vitest** for testing
- **Husky** for Git hooks

## Building for Production

```bash
npm run build
```

The build process will:
1. Run all tests (must pass)
2. Type check with TypeScript
3. Build the production bundle

The built files will be in the `dist/` directory.

## Deployment

This application is ready to deploy to any static hosting platform. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Options:

**Vercel (Recommended):**
```bash
npm i -g vercel
vercel
```

**Netlify:**
```bash
npm i -g netlify-cli
netlify deploy --prod
```

**GitHub Pages:**
- Push to GitHub
- Enable GitHub Pages in repository settings
- Automatic deployment via GitHub Actions (configured)

All deployment configurations are included in the repository.

## License

This is a demonstration project for BlockDAG node monitoring.
