import { describe, it, expect } from 'vitest';
import { getTimeRangeMs, getTimeRangeLabels } from '../timeRange';

describe('Time Range Utilities', () => {
  describe('getTimeRangeMs', () => {
    it('should convert 5m to milliseconds', () => {
      expect(getTimeRangeMs('5m')).toBe(5 * 60 * 1000);
    });

    it('should convert 15m to milliseconds', () => {
      expect(getTimeRangeMs('15m')).toBe(15 * 60 * 1000);
    });

    it('should convert 1h to milliseconds', () => {
      expect(getTimeRangeMs('1h')).toBe(60 * 60 * 1000);
    });

    it('should convert 6h to milliseconds', () => {
      expect(getTimeRangeMs('6h')).toBe(6 * 60 * 60 * 1000);
    });
  });

  describe('getTimeRangeLabels', () => {
    it('should generate correct number of labels', () => {
      const labels = getTimeRangeLabels('5m', 10);
      expect(labels).toHaveLength(10);
    });

    it('should generate time labels', () => {
      const labels = getTimeRangeLabels('1h', 5);
      labels.forEach(label => {
        expect(typeof label).toBe('string');
        expect(label).toMatch(/\d{1,2}:\d{2}:\d{2}/);
      });
    });

    it('should handle different time ranges', () => {
      const labels5m = getTimeRangeLabels('5m', 5);
      const labels1h = getTimeRangeLabels('1h', 5);
      
      expect(labels5m).toHaveLength(5);
      expect(labels1h).toHaveLength(5);
    });
  });
});

