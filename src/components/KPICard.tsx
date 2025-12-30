import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number; // percentage change
  icon?: ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'critical';
}

export function KPICard({ title, value, subtitle, trend, icon, color = 'primary' }: KPICardProps) {
  const colorClasses = {
    primary: 'border-grafana-primary',
    success: 'border-grafana-success',
    warning: 'border-grafana-warning',
    critical: 'border-grafana-critical',
  };

  const trendIcon = trend !== undefined ? (
    trend > 0 ? (
      <TrendingUp className="w-4 h-4 text-grafana-success" />
    ) : trend < 0 ? (
      <TrendingDown className="w-4 h-4 text-grafana-critical" />
    ) : (
      <Minus className="w-4 h-4 text-grafana-textSecondary" />
    )
  ) : null;

  return (
    <div className={`grafana-card border-l-4 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="text-sm text-grafana-textSecondary mb-1">{title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{value}</span>
            {trend !== undefined && (
              <div className="flex items-center gap-1 text-xs">
                {trendIcon}
                <span className={trend > 0 ? 'text-grafana-success' : trend < 0 ? 'text-grafana-critical' : 'text-grafana-textSecondary'}>
                  {Math.abs(trend).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          {subtitle && <p className="text-xs text-grafana-textSecondary mt-1">{subtitle}</p>}
        </div>
        {icon && <div className="text-grafana-textSecondary">{icon}</div>}
      </div>
    </div>
  );
}

