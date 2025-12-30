import { describe, it, expect } from 'vitest';
import { formatBytes, formatDuration, formatNumber, formatTimestamp } from '../formatting';

describe('Formatting Utilities', () => {
  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0.00 B');
      expect(formatBytes(1024)).toBe('1.00 KB');
      expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
      expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1.00 TB');
    });

    it('should handle decimal values', () => {
      expect(formatBytes(1536)).toBe('1.50 KB');
      expect(formatBytes(512 * 1024)).toBe('512.00 KB');
    });

    it('should handle large values', () => {
      expect(formatBytes(5 * 1024 * 1024 * 1024)).toBe('5.00 GB');
      expect(formatBytes(100 * 1024 * 1024 * 1024)).toBe('100.00 GB');
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds correctly', () => {
      expect(formatDuration(0.001)).toBe('1ms');
      expect(formatDuration(0.5)).toBe('500ms');
      expect(formatDuration(0.999)).toBe('999ms');
    });

    it('should format seconds correctly', () => {
      expect(formatDuration(1)).toBe('1.00s');
      expect(formatDuration(5.5)).toBe('5.50s');
      expect(formatDuration(59.9)).toBe('59.90s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(60)).toBe('1m 0s');
      expect(formatDuration(125)).toBe('2m 5s');
      expect(formatDuration(3661)).toBe('61m 1s');
    });
  });

  describe('formatNumber', () => {
    it('should format small numbers', () => {
      expect(formatNumber(0)).toBe('0.00');
      expect(formatNumber(100)).toBe('100.00');
      expect(formatNumber(999)).toBe('999.00');
    });

    it('should format thousands', () => {
      expect(formatNumber(1000)).toBe('1.00K');
      expect(formatNumber(1500)).toBe('1.50K');
      expect(formatNumber(9999)).toBe('10.00K');
    });

    it('should format millions', () => {
      expect(formatNumber(1000000)).toBe('1.00M');
      expect(formatNumber(1500000)).toBe('1.50M');
      expect(formatNumber(9999999)).toBe('10.00M');
    });

    it('should respect decimal places', () => {
      expect(formatNumber(1234, 0)).toBe('1K');
      expect(formatNumber(1234, 1)).toBe('1.2K');
      expect(formatNumber(1234, 3)).toBe('1.234K');
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamp as time string', () => {
      const timestamp = new Date('2024-01-01T12:00:00').getTime();
      const formatted = formatTimestamp(timestamp);
      expect(formatted).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    it('should handle current timestamp', () => {
      const now = Date.now();
      const formatted = formatTimestamp(now);
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });
  });
});

