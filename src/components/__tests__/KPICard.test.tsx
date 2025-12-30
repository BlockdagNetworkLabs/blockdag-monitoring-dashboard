import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPICard } from '../KPICard';
import { Activity } from 'lucide-react';

describe('KPICard', () => {
  it('should render title and value', () => {
    render(<KPICard title="Test Metric" value="100" />);
    
    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('should render subtitle when provided', () => {
    render(<KPICard title="Test Metric" value="100" subtitle="Test subtitle" />);
    
    expect(screen.getByText('Test subtitle')).toBeInTheDocument();
  });

  it('should render icon when provided', () => {
    render(<KPICard title="Test Metric" value="100" icon={<Activity data-testid="icon" />} />);
    
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('should apply correct color class for primary', () => {
    const { container } = render(
      <KPICard title="Test" value="100" color="primary" />
    );
    
    const card = container.querySelector('.border-grafana-primary');
    expect(card).toBeInTheDocument();
  });

  it('should apply correct color class for success', () => {
    const { container } = render(
      <KPICard title="Test" value="100" color="success" />
    );
    
    const card = container.querySelector('.border-grafana-success');
    expect(card).toBeInTheDocument();
  });

  it('should apply correct color class for warning', () => {
    const { container } = render(
      <KPICard title="Test" value="100" color="warning" />
    );
    
    const card = container.querySelector('.border-grafana-warning');
    expect(card).toBeInTheDocument();
  });

  it('should apply correct color class for critical', () => {
    const { container } = render(
      <KPICard title="Test" value="100" color="critical" />
    );
    
    const card = container.querySelector('.border-grafana-critical');
    expect(card).toBeInTheDocument();
  });

  it('should display trend when provided', () => {
    render(<KPICard title="Test" value="100" trend={5.5} />);
    
    expect(screen.getByText('5.5%')).toBeInTheDocument();
  });

  it('should handle numeric values', () => {
    render(<KPICard title="Test" value={12345} />);
    
    expect(screen.getByText('12345')).toBeInTheDocument();
  });
});

