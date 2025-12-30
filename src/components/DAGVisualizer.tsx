import { useEffect, useRef, useState } from 'react';
import { metricsEngine } from '../mockMetrics/metricsEngine';
import { formatNumber } from '../utils/formatting';
import { Network, GitBranch } from 'lucide-react';

interface DAGNode {
  id: string;
  x: number;
  y: number;
  height: number;
  parents: string[];
  isTip: boolean;
  isVirtual: boolean;
  color: string;
}

interface DAGVisualizerProps {
  selectedNode: string;
  width?: number;
  height?: number;
}

export function DAGVisualizer({ selectedNode, width = 800, height = 400 }: DAGVisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<DAGNode[]>([]);
  const [tips, setTips] = useState<number>(0);
  const [virtualHeight, setVirtualHeight] = useState<number>(0);

  useEffect(() => {
    const updateDAG = () => {
      const nodeMetrics = metricsEngine.getNodeMetrics(selectedNode === 'All' ? 'Node A' : selectedNode);
      if (!nodeMetrics) return;

      // Get current metrics
      const tipsCount = nodeMetrics.metrics.get('blockdag_dag_tips_count')?.dataPoints[0]?.value || 0;
      const vHeight = nodeMetrics.metrics.get('blockdag_virtual_height')?.dataPoints[0]?.value || 0;
      const dagWidth = nodeMetrics.metrics.get('blockdag_dag_width')?.dataPoints[0]?.value || 2;

      setTips(tipsCount);
      setVirtualHeight(vHeight);

      // Generate DAG structure visualization
      const dagNodes: DAGNode[] = [];
      const numLayers = 8;
      const nodesPerLayer = Math.max(3, Math.ceil(dagWidth));
      const layerHeight = height / (numLayers + 1);
      const nodeSpacing = width / (nodesPerLayer + 1);

      // Create layers from bottom to top (oldest to newest)
      for (let layer = 0; layer < numLayers; layer++) {
        const layerY = height - (layer * layerHeight) - 50;
        const isTopLayer = layer === 0;
        const isVirtualLayer = layer <= 2;

        for (let i = 0; i < nodesPerLayer; i++) {
          const nodeId = `node-${layer}-${i}`;
          const nodeX = (i + 1) * nodeSpacing;
          const isTip = isTopLayer && i < tipsCount;
          const isVirtual = isVirtualLayer && i === Math.floor(nodesPerLayer / 2);

          // Determine color
          let color = '#5794f2'; // Default blue
          if (isTip) color = '#f79420'; // Orange for tips
          if (isVirtual) color = '#73bf69'; // Green for virtual selected parent
          if (isTip && isVirtual) color = '#e24d42'; // Red for virtual tip

          const parents: string[] = [];
          if (layer < numLayers - 1) {
            // Connect to nodes in previous layer
            const parentLayer = layer + 1;
            const parentCount = Math.min(2, nodesPerLayer);
            for (let p = 0; p < parentCount; p++) {
              const parentIdx = Math.floor((i / nodesPerLayer) * nodesPerLayer) + p;
              if (parentIdx < nodesPerLayer) {
                parents.push(`node-${parentLayer}-${parentIdx}`);
              }
            }
          }

          dagNodes.push({
            id: nodeId,
            x: nodeX,
            y: layerY,
            height: vHeight - (numLayers - layer) * 10,
            parents,
            isTip,
            isVirtual,
            color,
          });
        }
      }

      setNodes(dagNodes);
    };

    updateDAG();
    const interval = setInterval(updateDAG, 2000);
    return () => clearInterval(interval);
  }, [selectedNode, width, height]);

  return (
    <div className="grafana-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-grafana-primary" />
          <h3 className="text-sm font-semibold text-grafana-text">DAG Structure</h3>
        </div>
        <div className="flex items-center gap-4 text-xs text-grafana-textSecondary">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-grafana-primary"></div>
            <span>Block</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-grafana-warning"></div>
            <span>Tip</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-grafana-success"></div>
            <span>Virtual</span>
          </div>
        </div>
      </div>

      <div className="relative bg-grafana-darker rounded border border-grafana-border p-4">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="w-full h-auto"
          viewBox={`0 0 ${width} ${height}`}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3, 0 6"
                fill="#5794f2"
                opacity="0.4"
              />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Draw edges first (so they appear behind nodes) */}
          {nodes.map((node) =>
            node.parents.map((parentId) => {
              const parent = nodes.find((n) => n.id === parentId);
              if (!parent) return null;

              const isVirtualEdge = node.isVirtual && parent.isVirtual;
              const strokeColor = isVirtualEdge ? '#73bf69' : '#5794f2';
              const strokeWidth = isVirtualEdge ? 2 : 1;

              return (
                <line
                  key={`${node.id}-${parentId}`}
                  x1={node.x}
                  y1={node.y}
                  x2={parent.x}
                  y2={parent.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  opacity="0.3"
                  markerEnd="url(#arrowhead)"
                />
              );
            })
          )}

          {/* Draw nodes */}
          {nodes.map((node) => (
            <g key={node.id}>
              {/* Node circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.isVirtual ? 8 : node.isTip ? 6 : 5}
                fill={node.color}
                stroke={node.isVirtual ? '#73bf69' : node.isTip ? '#f79420' : '#5794f2'}
                strokeWidth={node.isVirtual ? 2 : 1}
                opacity={node.isVirtual ? 1 : 0.8}
                filter={node.isVirtual ? 'url(#glow)' : undefined}
                className="transition-all duration-300"
              />
              {/* Height label for virtual nodes */}
              {node.isVirtual && (
                <text
                  x={node.x}
                  y={node.y - 15}
                  textAnchor="middle"
                  className="text-xs fill-grafana-textSecondary"
                  fontSize="10"
                >
                  {formatNumber(node.height, 0)}
                </text>
              )}
            </g>
          ))}

          {/* Legend overlay */}
          <g>
            <rect
              x={width - 150}
              y={10}
              width={140}
              height={80}
              fill="#1f1f23"
              stroke="#2d2d33"
              rx="4"
              opacity="0.9"
            />
            <text
              x={width - 70}
              y={30}
              textAnchor="middle"
              className="text-xs fill-grafana-text font-semibold"
              fontSize="11"
            >
              DAG Stats
            </text>
            <text
              x={width - 140}
              y={50}
              className="text-xs fill-grafana-textSecondary"
              fontSize="10"
            >
              Tips: <tspan className="fill-grafana-warning">{formatNumber(tips, 1)}</tspan>
            </text>
            <text
              x={width - 140}
              y={70}
              className="text-xs fill-grafana-textSecondary"
              fontSize="10"
            >
              Height: <tspan className="fill-grafana-success">{formatNumber(virtualHeight, 0)}</tspan>
            </text>
          </g>
        </svg>

        {/* Bottom info bar */}
        <div className="mt-4 flex items-center justify-between text-xs text-grafana-textSecondary border-t border-grafana-border pt-3">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            <span>Showing {nodes.length} blocks across {Math.ceil(nodes.length / Math.max(3, Math.ceil(tips))) || 8} layers</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Virtual Chain: <span className="text-grafana-success font-semibold">Active</span></span>
            <span>Tips: <span className="text-grafana-warning font-semibold">{formatNumber(tips, 1)}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}

