import { TimeRange } from '../types/metrics';

export function getTimeRangeMs(timeRange: TimeRange): number {
  const ranges: Record<TimeRange, number> = {
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
  };
  return ranges[timeRange];
}

export function getTimeRangeLabels(timeRange: TimeRange, count: number = 10): string[] {
  const rangeMs = getTimeRangeMs(timeRange);
  const interval = rangeMs / count;
  const now = Date.now();
  
  return Array.from({ length: count }, (_, i) => {
    const timestamp = now - (rangeMs - i * interval);
    return new Date(timestamp).toLocaleTimeString();
  });
}

