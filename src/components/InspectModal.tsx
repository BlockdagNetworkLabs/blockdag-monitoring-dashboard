import { DataPoint, HistogramDataPoint } from '../types/metrics';
import { X } from 'lucide-react';

interface InspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data?: DataPoint[];
  histogramData?: HistogramDataPoint[];
  compareData?: Array<{ label: string; data: DataPoint[]; color: string }>;
}

export function InspectModal({
  isOpen,
  onClose,
  title,
  data,
  histogramData,
  compareData,
}: InspectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-grafana-dark border border-grafana-border rounded-lg w-[90vw] h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-grafana-border">
          <h2 className="text-lg font-semibold text-white">{title} - Inspect</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-grafana-border rounded transition-colors"
          >
            <X className="w-5 h-5 text-grafana-textSecondary" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-grafana-darker rounded p-4 font-mono text-xs">
            <pre className="text-grafana-text">
              {histogramData
                ? JSON.stringify(histogramData, null, 2)
                : compareData
                ? JSON.stringify(
                    compareData.map((cd) => ({
                      label: cd.label,
                      data: cd.data,
                    })),
                    null,
                    2
                  )
                : JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

