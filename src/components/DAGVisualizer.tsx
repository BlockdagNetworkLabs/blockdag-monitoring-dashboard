import { useEffect, useRef, useState } from 'react';
import { metricsEngine } from '../mockMetrics/metricsEngine';
import { formatNumber } from '../utils/formatting';
import { Network, GitBranch, Sparkles } from 'lucide-react';

interface DAGNode {
  id: string;
  x: number;
  y: number;
  height: number;
  parents: string[];
  isTip: boolean;
  isVirtual: boolean;
  color: string;
  age: number;
  pulse: number;
  blockId: string; // Hex-like identifier
}

interface DAGVisualizerProps {
  selectedNode: string;
  width?: number;
  height?: number;
}

// Generate hex-like block ID
function generateBlockId(index: number): string {
  const hex = index.toString(16).toUpperCase().padStart(2, '0');
  return hex.length > 2 ? hex.slice(0, 2) : hex;
}

export function DAGVisualizer({ selectedNode, width = 1000, height = 500 }: DAGVisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const animationFrameRef = useRef<number>();
  const [nodes, setNodes] = useState<DAGNode[]>([]);
  const [tips, setTips] = useState<number>(0);
  const [virtualHeight, setVirtualHeight] = useState<number>(0);
  const [animationTime, setAnimationTime] = useState(0);
  const [newBlocks, setNewBlocks] = useState<Set<string>>(new Set());

  // Animation loop
  useEffect(() => {
    const animate = () => {
      setAnimationTime((prev) => prev + 0.016);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const updateDAG = () => {
      const nodeMetrics = metricsEngine.getNodeMetrics(selectedNode === 'All' ? 'Node A' : selectedNode);
      if (!nodeMetrics) return;

      const tipsCount = nodeMetrics.metrics.get('blockdag_dag_tips_count')?.dataPoints[0]?.value || 0;
      const vHeight = nodeMetrics.metrics.get('blockdag_virtual_height')?.dataPoints[0]?.value || 0;
      const dagWidth = nodeMetrics.metrics.get('blockdag_dag_width')?.dataPoints[0]?.value || 2;

      setTips(tipsCount);
      setVirtualHeight(vHeight);

      const dagNodes: DAGNode[] = [];
      const numLayers = 12;
      const baseNodesPerLayer = Math.max(5, Math.ceil(dagWidth * 2));
      const layerHeight = height / (numLayers + 2);
      const baseNodeWidth = 35;
      const baseNodeHeight = 20;
      const horizontalSpacing = 50;

      const existingNodeIds = new Set(nodes.map(n => n.id));
      const currentNewBlocks = new Set<string>();
      let globalBlockIndex = 0;

      // Create layers from bottom (oldest) to top (newest)
      for (let layer = 0; layer < numLayers; layer++) {
        const layerY = height - (layer * layerHeight) - 60;
        const isTopLayer = layer === 0;
        const isVirtualLayer = layer <= 3;
        
        // Vary nodes per layer for more realistic DAG
        const nodesInLayer = Math.floor(baseNodesPerLayer * (0.8 + Math.random() * 0.4));
        const layerWidth = nodesInLayer * horizontalSpacing;
        const startX = (width - layerWidth) / 2;

        for (let i = 0; i < nodesInLayer; i++) {
          const nodeId = `node-${layer}-${i}`;
          const nodeX = startX + i * horizontalSpacing + (Math.sin(animationTime * 0.3 + i * 0.5) * 3);
          const isTip = isTopLayer && i < tipsCount;
          const isVirtual = isVirtualLayer && i === Math.floor(nodesInLayer / 2);

          let baseColor = '#5794f2';
          if (isTip) baseColor = '#f79420';
          if (isVirtual) baseColor = '#73bf69';
          if (isTip && isVirtual) baseColor = '#e24d42';

          const parents: string[] = [];
          if (layer < numLayers - 1) {
            // Connect to 1-3 parents in previous layer (more realistic)
            const parentLayer = layer + 1;
            const numParents = Math.min(Math.floor(Math.random() * 3) + 1, 3);
            const parentStartIdx = Math.max(0, Math.floor((i / nodesInLayer) * baseNodesPerLayer) - 1);
            
            for (let p = 0; p < numParents; p++) {
              const parentIdx = Math.min(parentStartIdx + p, baseNodesPerLayer - 1);
              parents.push(`node-${parentLayer}-${parentIdx}`);
            }
          }

          if (!existingNodeIds.has(nodeId) && layer < 4) {
            currentNewBlocks.add(nodeId);
          }

          dagNodes.push({
            id: nodeId,
            x: nodeX,
            y: layerY,
            height: vHeight - (numLayers - layer) * 10,
            parents,
            isTip,
            isVirtual,
            color: baseColor,
            age: numLayers - layer,
            pulse: isTip || isVirtual ? Math.sin(animationTime * 2) * 0.2 + 0.8 : 1,
            blockId: generateBlockId(globalBlockIndex++),
          });
        }
      }

      setNewBlocks(currentNewBlocks);
      setNodes(dagNodes);
    };

    updateDAG();
    const interval = setInterval(updateDAG, 2000);
    return () => clearInterval(interval);
  }, [selectedNode, width, height, nodes, animationTime]);

  useEffect(() => {
    if (newBlocks.size > 0) {
      const timer = setTimeout(() => setNewBlocks(new Set()), 2000);
      return () => clearTimeout(timer);
    }
  }, [newBlocks]);

  return (
    <div className="grafana-card border-l-4 border-grafana-primary">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Network className="w-5 h-5 text-grafana-primary animate-pulse" />
            <Sparkles className="w-3 h-3 text-grafana-warning absolute -top-1 -right-1 animate-spin" style={{ animationDuration: '2s' }} />
          </div>
          <h3 className="text-sm font-semibold text-grafana-text">Live DAG Structure</h3>
        </div>
        <div className="flex items-center gap-4 text-xs text-grafana-textSecondary">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-grafana-primary animate-pulse"></div>
            <span>Block</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-grafana-warning animate-pulse" style={{ animationDuration: '1s' }}></div>
            <span>Tip</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-grafana-success animate-pulse" style={{ animationDuration: '1.5s' }}></div>
            <span>Virtual</span>
          </div>
        </div>
      </div>

      <div className="relative bg-grafana-darker rounded border border-grafana-border p-4 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            background: `radial-gradient(circle at ${50 + Math.sin(animationTime * 0.3) * 20}% ${50 + Math.cos(animationTime * 0.3) * 20}%, #5794f2 0%, transparent 50%)`,
          }}
        />

        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="w-full h-auto relative z-10"
          viewBox={`0 0 ${width} ${height}`}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#5794f2" opacity="0.5" />
            </marker>
            <marker
              id="arrowhead-virtual"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="4"
              orient="auto"
            >
              <polygon points="0 0, 10 4, 0 8" fill="#73bf69" opacity="0.7" />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-strong">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="newBlockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f79420" stopOpacity="1">
                <animate attributeName="stop-opacity" values="1;0.6;1" dur="1s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#e24d42" stopOpacity="1">
                <animate attributeName="stop-opacity" values="0.6;1;0.6" dur="1s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
          </defs>

          {/* Draw edges first */}
          {nodes.map((node) =>
            node.parents.map((parentId) => {
              const parent = nodes.find((n) => n.id === parentId);
              if (!parent) return null;

              const isVirtualEdge = node.isVirtual && parent.isVirtual;
              const strokeColor = isVirtualEdge ? '#73bf69' : '#5794f2';
              const strokeWidth = isVirtualEdge ? 2.5 : 1;
              const opacity = isVirtualEdge ? 0.4 : 0.25;

              return (
                <g key={`${node.id}-${parentId}`}>
                  <line
                    x1={node.x}
                    y1={node.y}
                    x2={parent.x}
                    y2={parent.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                    markerEnd={isVirtualEdge ? "url(#arrowhead-virtual)" : "url(#arrowhead)"}
                    className="transition-all duration-500"
                  />
                  {/* Animated flow for virtual chain */}
                  {isVirtualEdge && (
                    <circle r="2" fill={strokeColor} opacity="0.9">
                      <animateMotion
                        dur="3s"
                        repeatCount="indefinite"
                        path={`M ${node.x} ${node.y} L ${parent.x} ${parent.y}`}
                      />
                    </circle>
                  )}
                </g>
              );
            })
          )}

          {/* Draw block nodes (rectangles) */}
          {nodes.map((node) => {
            const isNew = newBlocks.has(node.id);
            const nodeWidth = node.isVirtual ? 40 : node.isTip ? 32 : 30;
            const nodeHeight = node.isVirtual ? 24 : node.isTip ? 20 : 18;
            const glowFilter = node.isVirtual ? 'url(#glow-strong)' : node.isTip ? 'url(#glow)' : undefined;
            const nodeOpacity = node.pulse;

            return (
              <g key={node.id}>
                {/* Glow effect for virtual nodes */}
                {node.isVirtual && (
                  <rect
                    x={node.x - nodeWidth / 2 - 3}
                    y={node.y - nodeHeight / 2 - 3}
                    width={nodeWidth + 6}
                    height={nodeHeight + 6}
                    fill={node.color}
                    opacity="0.3"
                    rx="3"
                    filter="url(#glow-strong)"
                  >
                    <animate
                      attributeName="width"
                      values={`${nodeWidth + 6};${nodeWidth + 10};${nodeWidth + 6}`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="height"
                      values={`${nodeHeight + 6};${nodeHeight + 10};${nodeHeight + 6}`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.3;0.5;0.3"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </rect>
                )}

                {/* Block rectangle */}
                <rect
                  x={node.x - nodeWidth / 2}
                  y={node.y - nodeHeight / 2}
                  width={nodeWidth}
                  height={nodeHeight}
                  fill={isNew ? "url(#newBlockGradient)" : node.color}
                  stroke={node.isVirtual ? '#73bf69' : node.isTip ? '#f79420' : '#5794f2'}
                  strokeWidth={node.isVirtual ? 2 : node.isTip ? 1.5 : 1}
                  opacity={nodeOpacity}
                  rx="2"
                  filter={glowFilter}
                  className="transition-all duration-300"
                >
                  {/* Pulse animation for tips */}
                  {node.isTip && (
                    <animate
                      attributeName="width"
                      values={`${nodeWidth};${nodeWidth + 3};${nodeWidth}`}
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="height"
                      values={`${nodeHeight};${nodeHeight + 2};${nodeHeight}`}
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  )}
                  {/* Entrance animation for new blocks */}
                  {isNew && (
                    <>
                      <animate
                        attributeName="width"
                        values="0;45;32"
                        dur="0.6s"
                        fill="freeze"
                      />
                      <animate
                        attributeName="height"
                        values="0;25;20"
                        dur="0.6s"
                        fill="freeze"
                      />
                      <animate
                        attributeName="opacity"
                        values="0;1;1"
                        dur="0.6s"
                        fill="freeze"
                      />
                    </>
                  )}
                </rect>

                {/* Block ID text */}
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  className="text-xs font-mono font-bold"
                  fill={node.isVirtual ? '#73bf69' : node.isTip ? '#f79420' : '#d8d9da'}
                  fontSize="10"
                  opacity={nodeOpacity}
                >
                  {node.blockId}
                </text>

                {/* Height label for virtual nodes */}
                {node.isVirtual && (
                  <g>
                    <rect
                      x={node.x - 28}
                      y={node.y - nodeHeight / 2 - 18}
                      width="56"
                      height="14"
                      fill="#1f1f23"
                      stroke="#73bf69"
                      strokeWidth="1"
                      rx="2"
                      opacity="0.95"
                    />
                    <text
                      x={node.x}
                      y={node.y - nodeHeight / 2 - 7}
                      textAnchor="middle"
                      className="text-xs fill-grafana-success font-bold font-mono"
                      fontSize="9"
                    >
                      H:{formatNumber(node.height, 0)}
                    </text>
                  </g>
                )}

                {/* Sparkle effect for new blocks */}
                {isNew && (
                  <g>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <line
                        key={i}
                        x1={node.x}
                        y1={node.y}
                        x2={node.x + Math.cos((i * Math.PI) / 4) * 20}
                        y2={node.y + Math.sin((i * Math.PI) / 4) * 20}
                        stroke="#f79420"
                        strokeWidth="1.5"
                        opacity="0.9"
                      >
                        <animate
                          attributeName="opacity"
                          values="0.9;0;0.9"
                          dur="0.8s"
                          begin={`${i * 0.1}s`}
                          repeatCount="2"
                        />
                        <animate
                          attributeName="x2"
                          values={`${node.x};${node.x + Math.cos((i * Math.PI) / 4) * 20};${node.x}`}
                          dur="0.8s"
                          begin={`${i * 0.1}s`}
                          repeatCount="2"
                        />
                        <animate
                          attributeName="y2"
                          values={`${node.y};${node.y + Math.sin((i * Math.PI) / 4) * 20};${node.y}`}
                          dur="0.8s"
                          begin={`${i * 0.1}s`}
                          repeatCount="2"
                        />
                      </line>
                    ))}
                  </g>
                )}
              </g>
            );
          })}

          {/* Stats overlay */}
          <g>
            <rect
              x={width - 170}
              y={10}
              width={160}
              height={100}
              fill="#1f1f23"
              stroke="#2d2d33"
              rx="4"
              opacity="0.95"
              className="backdrop-blur-sm"
            />
            <text
              x={width - 90}
              y={30}
              textAnchor="middle"
              className="text-xs fill-grafana-text font-semibold"
              fontSize="11"
            >
              DAG Statistics
            </text>
            <g>
              <rect x={width - 160} y={38} width="8" height="8" rx="1" fill="#f79420">
                <animate attributeName="width" values="8;10;8" dur="1s" repeatCount="indefinite" />
              </rect>
              <text
                x={width - 148}
                y={47}
                className="text-xs fill-grafana-textSecondary font-mono"
                fontSize="10"
              >
                Tips: <tspan className="fill-grafana-warning font-semibold">{formatNumber(tips, 1)}</tspan>
              </text>
            </g>
            <g>
              <rect x={width - 160} y={58} width="8" height="8" rx="1" fill="#73bf69">
                <animate attributeName="width" values="8;10;8" dur="1.5s" repeatCount="indefinite" />
              </rect>
              <text
                x={width - 148}
                y={67}
                className="text-xs fill-grafana-textSecondary font-mono"
                fontSize="10"
              >
                Height: <tspan className="fill-grafana-success font-semibold">{formatNumber(virtualHeight, 0)}</tspan>
              </text>
            </g>
            <g>
              <rect x={width - 160} y={78} width="8" height="8" rx="1" fill="#5794f2">
                <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />
              </rect>
              <text
                x={width - 148}
                y={87}
                className="text-xs fill-grafana-textSecondary font-mono"
                fontSize="10"
              >
                Blocks: <tspan className="fill-grafana-primary font-semibold">{nodes.length}</tspan>
              </text>
            </g>
            <g>
              <rect x={width - 160} y={98} width="8" height="8" rx="1" fill="#9e9fa2">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite" />
              </rect>
              <text
                x={width - 148}
                y={107}
                className="text-xs fill-grafana-textSecondary font-mono"
                fontSize="10"
              >
                Layers: <tspan className="fill-grafana-text font-semibold">{Math.ceil(nodes.length / Math.max(5, Math.ceil(tips * 2))) || 12}</tspan>
              </text>
            </g>
          </g>
        </svg>

        {/* Bottom info bar */}
        <div className="mt-4 flex items-center justify-between text-xs text-grafana-textSecondary border-t border-grafana-border pt-3 relative z-10">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 animate-pulse" style={{ animationDuration: '2s' }} />
            <span className="font-mono">
              <span className="text-grafana-primary font-semibold">{nodes.length}</span> blocks |{' '}
              <span className="text-grafana-primary font-semibold">
                {Math.ceil(nodes.length / Math.max(5, Math.ceil(tips * 2))) || 12}
              </span>{' '}
              layers
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-grafana-success animate-pulse"></div>
              <span className="font-mono">
                Virtual: <span className="text-grafana-success font-semibold">Active</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-grafana-warning animate-pulse" style={{ animationDuration: '1s' }}></div>
              <span className="font-mono">
                Tips: <span className="text-grafana-warning font-semibold">{formatNumber(tips, 1)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Live indicator */}
        <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-grafana-success z-20">
          <div className="w-2 h-2 rounded-full bg-grafana-success animate-ping"></div>
          <span className="font-semibold font-mono">LIVE</span>
        </div>
      </div>
    </div>
  );
}
