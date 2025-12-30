import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DataPoint } from '../types/metrics';
import { formatTimestamp } from '../utils/formatting';
import { InspectModal } from './InspectModal';
import { Download } from 'lucide-react';

interface TimeSeriesChartProps {
  title: string;
  data: DataPoint[];
  dataKey?: string;
  color?: string;
  yAxisLabel?: string;
  compareData?: Array<{ label: string; data: DataPoint[]; color: string }>;
  height?: number;
}

export function TimeSeriesChart({
  title,
  data,
  dataKey = 'value',
  color = '#5794f2',
  yAxisLabel,
  compareData,
  height = 300,
}: TimeSeriesChartProps) {
  const [isInspectOpen, setIsInspectOpen] = useState(false);

  // Transform data for Recharts
  const chartData = data.map((dp) => ({
    timestamp: dp.timestamp,
    time: formatTimestamp(dp.timestamp),
    [dataKey]: dp.value,
  }));

  // Add compare data if provided
  if (compareData) {
    compareData.forEach((compare) => {
      compare.data.forEach((dp) => {
        const existing = chartData.find((d) => d.timestamp === dp.timestamp);
        if (existing) {
          existing[compare.label] = dp.value;
        } else {
          chartData.push({
            timestamp: dp.timestamp,
            time: formatTimestamp(dp.timestamp),
            [compare.label]: dp.value,
          });
        }
      });
    });
    chartData.sort((a, b) => a.timestamp - b.timestamp);
  }

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
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              name={title}
            />
            {compareData?.map((compare) => (
              <Line
                key={compare.label}
                type="monotone"
                dataKey={compare.label}
                stroke={compare.color}
                strokeWidth={2}
                dot={false}
                name={compare.label}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <InspectModal
        isOpen={isInspectOpen}
        onClose={() => setIsInspectOpen(false)}
        title={title}
        data={data}
        compareData={compareData}
      />
    </>
  );
}

