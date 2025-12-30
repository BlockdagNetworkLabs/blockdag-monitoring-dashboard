import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { HistogramDataPoint } from '../types/metrics';
import { formatTimestamp } from '../utils/formatting';
import { InspectModal } from './InspectModal';
import { Download } from 'lucide-react';

interface HistogramChartProps {
  title: string;
  data: HistogramDataPoint[];
  yAxisLabel?: string;
  height?: number;
}

export function HistogramChart({
  title,
  data,
  yAxisLabel,
  height = 300,
}: HistogramChartProps) {
  const [isInspectOpen, setIsInspectOpen] = useState(false);

  const chartData = data.map((dp) => ({
    timestamp: dp.timestamp,
    time: formatTimestamp(dp.timestamp),
    p50: dp.quantiles.p50,
    p95: dp.quantiles.p95,
    p99: dp.quantiles.p99,
  }));

  const handleExport = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="grafana-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-grafana-text">{title}</h3>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="p-1.5 hover:bg-grafana-border rounded transition-colors"
              title="Export JSON"
            >
              <Download className="w-4 h-4 text-grafana-textSecondary" />
            </button>
            <button
              onClick={() => setIsInspectOpen(true)}
              className="px-3 py-1 text-xs bg-grafana-border hover:bg-grafana-primary hover:text-white rounded transition-colors"
            >
              Inspect
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d33" />
            <XAxis
              dataKey="time"
              stroke="#9e9fa2"
              style={{ fontSize: '12px' }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#9e9fa2"
              style={{ fontSize: '12px' }}
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', style: { fill: '#9e9fa2' } } : undefined}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f1f23',
                border: '1px solid #2d2d33',
                borderRadius: '4px',
                color: '#d8d9da',
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="p50" stroke="#5794f2" strokeWidth={2} dot={false} name="p50" />
            <Line type="monotone" dataKey="p95" stroke="#f79420" strokeWidth={2} dot={false} name="p95" />
            <Line type="monotone" dataKey="p99" stroke="#e24d42" strokeWidth={2} dot={false} name="p99" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <InspectModal
        isOpen={isInspectOpen}
        onClose={() => setIsInspectOpen(false)}
        title={title}
        histogramData={data}
      />
    </>
  );
}

