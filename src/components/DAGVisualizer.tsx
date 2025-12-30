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
  age: number; // Time since creation (for animation)
  pulse: number; // Pulse animation value
}

interface DAGVisualizerProps {
  selectedNode: string;
  width?: number;
  height?: number;
}

export function DAGVisualizer({ selectedNode, width = 800, height = 400 }: DAGVisualizerProps) {
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
      setAnimationTime((prev) => prev + 0.016); // ~60fps
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

      // Get current metrics
      const tipsCount = nodeMetrics.metrics.get('blockdag_dag_tips_count')?.dataPoints[0]?.value || 0;
      const vHeight = nodeMetrics.metrics.get('blockdag_virtual_height')?.dataPoints[0]?.value || 0;
      const dagWidth = nodeMetrics.metrics.get('blockdag_dag_width')?.dataPoints[0]?.value || 2;

      setTips(tipsCount);
      setVirtualHeight(vHeight);

      // Generate DAG structure visualization
      const dagNodes: DAGNode[] = [];
      const numLayers = 10;
      const nodesPerLayer = Math.max(3, Math.ceil(dagWidth));
      const layerHeight = height / (numLayers + 1);
      const nodeSpacing = width / (nodesPerLayer + 1);

      // Track existing nodes to detect new ones
      const existingNodeIds = new Set(nodes.map(n => n.id));
      const currentNewBlocks = new Set<string>();

      // Create layers from bottom to top (oldest to newest)
      for (let layer = 0; layer < numLayers; layer++) {
        const layerY = height - (layer * layerHeight) - 50;
        const isTopLayer = layer === 0;
        const isVirtualLayer = layer <= 2;
        const layerAge = numLayers - layer;

        for (let i = 0; i < nodesPerLayer; i++) {
          const nodeId = `node-${layer}-${i}`;
          const nodeX = (i + 1) * nodeSpacing + (Math.sin(animationTime * 0.5 + i) * 2); // Subtle movement
          const isTip = isTopLayer && i < tipsCount;
          const isVirtual = isVirtualLayer && i === Math.floor(nodesPerLayer / 2);

          // Determine color with animation
          let baseColor = '#5794f2'; // Default blue
          if (isTip) baseColor = '#f79420'; // Orange for tips
          if (isVirtual) baseColor = '#73bf69'; // Green for virtual selected parent
          if (isTip && isVirtual) baseColor = '#e24d42'; // Red for virtual tip

          // Add pulsing effect for tips and virtual nodes
          const pulseIntensity = isTip || isVirtual ? Math.sin(animationTime * 2) * 0.3 + 0.7 : 1;

          const parents: string[] = [];
          if (layer < numLayers - 1) {
            // Connect to nodes in previous layer with some randomness for visual interest
            const parentLayer = layer + 1;
            const parentCount = Math.min(2, nodesPerLayer);
            for (let p = 0; p < parentCount; p++) {
              const parentIdx = Math.floor((i / nodesPerLayer) * nodesPerLayer) + p;
              if (parentIdx < nodesPerLayer) {
                parents.push(`node-${parentLayer}-${parentIdx}`);
              }
            }
          }

          // Check if this is a new block
          if (!existingNodeIds.has(nodeId) && layer < 3) {
            currentNewBlocks.add(nodeId);
          }

          dagNodes.push({
            id: nodeId,
            x: nodeX,
            y: layerY,
            height: vHeight - layerAge * 10,
            parents,
            isTip,
            isVirtual,
            color: baseColor,
            age: layerAge,
            pulse: pulseIntensity,
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

  // Clear new blocks after animation
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
            <div className="w-3 h-3 rounded-full bg-grafana-primary animate-pulse"></div>
            <span>Block</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-grafana-warning animate-pulse" style={{ animationDuration: '1s' }}></div>
            <span>Tip</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-grafana-success animate-pulse" style={{ animationDuration: '1.5s' }}></div>
            <span>Virtual</span>
          </div>
        </div>
      </div>

      <div className="relative bg-grafana-darker rounded border border-grafana-border p-4 overflow-hidden">
        {/* Animated background gradient */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            background: `radial-gradient(circle at ${50 + Math.sin(animationTime * 0.3) * 20}% ${50 + Math.cos(animationTime * 0.3) * 20}%, #5794f2 0%, transparent 50%)`,
            animation: 'pulse 4s ease-in-out infinite',
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
            <marker
              id="arrowhead-virtual"
              markerWidth="12"
              markerHeight="12"
              refX="11"
              refY="4"
              orient="auto"
            >
              <polygon
                points="0 0, 12 4, 0 8"
                fill="#73bf69"
                opacity="0.6"
              />
            </marker>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-strong">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Animated gradient for new blocks */}
            <linearGradient id="newBlockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f79420" stopOpacity="1">
                <animate attributeName="stop-opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#e24d42" stopOpacity="1">
                <animate attributeName="stop-opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
          </defs>

          {/* Draw edges first (so they appear behind nodes) */}
          {nodes.map((node) =>
            node.parents.map((parentId) => {
              const parent = nodes.find((n) => n.id === parentId);
              if (!parent) return null;

              const isVirtualEdge = node.isVirtual && parent.isVirtual;
              const strokeColor = isVirtualEdge ? '#73bf69' : '#5794f2';
              const strokeWidth = isVirtualEdge ? 2.5 : 1.5;
              const opacity = isVirtualEdge ? 0.5 : 0.3;

              // Animate edge flow
              const edgeLength = Math.sqrt(
                Math.pow(node.x - parent.x, 2) + Math.pow(node.y - parent.y, 2)
              );
              const flowOffset = (animationTime * 50) % (edgeLength + 20) - 10;

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
                  {/* Animated flow along edge */}
                  {isVirtualEdge && (
                    <g>
                      <circle
                        r="3"
                        fill={strokeColor}
                        opacity="0.8"
                      >
                        <animateMotion
                          dur="2s"
                          repeatCount="indefinite"
                          path={`M ${node.x} ${node.y} L ${parent.x} ${parent.y}`}
                        />
                      </circle>
                    </g>
                  )}
                </g>
              );
            })
          )}

          {/* Draw nodes */}
          {nodes.map((node) => {
            const isNew = newBlocks.has(node.id);
            const nodeRadius = node.isVirtual ? 10 : node.isTip ? 7 : 6;
            const glowFilter = node.isVirtual ? 'url(#glow-strong)' : node.isTip ? 'url(#glow)' : undefined;
            const nodeOpacity = node.pulse;

            return (
              <g key={node.id}>
                {/* Glow effect for virtual nodes */}
                {node.isVirtual && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={nodeRadius + 5}
                    fill={node.color}
                    opacity="0.2"
                    filter="url(#glow-strong)"
                  >
                    <animate
                      attributeName="r"
                      values={`${nodeRadius + 5};${nodeRadius + 8};${nodeRadius + 5}`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.2;0.4;0.2"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Node circle with animation */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeRadius}
                  fill={isNew ? "url(#newBlockGradient)" : node.color}
                  stroke={node.isVirtual ? '#73bf69' : node.isTip ? '#f79420' : '#5794f2'}
                  strokeWidth={node.isVirtual ? 2.5 : node.isTip ? 2 : 1.5}
                  opacity={nodeOpacity}
                  filter={glowFilter}
                  className="transition-all duration-300"
                >
                  {/* Pulse animation for tips */}
                  {node.isTip && (
                    <animate
                      attributeName="r"
                      values={`${nodeRadius};${nodeRadius + 2};${nodeRadius}`}
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  )}
                  {/* Entrance animation for new blocks */}
                  {isNew && (
                    <animate
                      attributeName="r"
                      values="0;12;7"
                      dur="0.6s"
                      fill="freeze"
                    />
                    <animate
                      attributeName="opacity"
                      values="0;1;1"
                      dur="0.6s"
                      fill="freeze"
                    />
                  )}
                </circle>

                {/* Height label for virtual nodes */}
                {node.isVirtual && (
                  <g>
                    <rect
                      x={node.x - 25}
                      y={node.y - 25}
                      width="50"
                      height="15"
                      fill="#1f1f23"
                      stroke="#73bf69"
                      strokeWidth="1"
                      rx="3"
                      opacity="0.9"
                    />
                    <text
                      x={node.x}
                      y={node.y - 12}
                      textAnchor="middle"
                      className="text-xs fill-grafana-success font-bold"
                      fontSize="10"
                    >
                      {formatNumber(node.height, 0)}
                    </text>
                  </g>
                )}

                {/* Sparkle effect for new blocks */}
                {isNew && (
                  <g>
                    {[0, 1, 2, 3].map((i) => (
                      <line
                        key={i}
                        x1={node.x}
                        y1={node.y}
                        x2={node.x + Math.cos((i * Math.PI) / 2) * 15}
                        y2={node.y + Math.sin((i * Math.PI) / 2) * 15}
                        stroke="#f79420"
                        strokeWidth="2"
                        opacity="0.8"
                      >
                        <animate
                          attributeName="opacity"
                          values="0.8;0;0.8"
                          dur="0.8s"
                          begin={`${i * 0.2}s`}
                          repeatCount="2"
                        />
                        <animate
                          attributeName="x2"
                          values={`${node.x};${node.x + Math.cos((i * Math.PI) / 2) * 15};${node.x}`}
                          dur="0.8s"
                          begin={`${i * 0.2}s`}
                          repeatCount="2"
                        />
                        <animate
                          attributeName="y2"
                          values={`${node.y};${node.y + Math.sin((i * Math.PI) / 2) * 15};${node.y}`}
                          dur="0.8s"
                          begin={`${i * 0.2}s`}
                          repeatCount="2"
                        />
                      </line>
                    ))}
                  </g>
                )}
              </g>
            );
          })}

          {/* Legend overlay with animation */}
          <g>
            <rect
              x={width - 160}
              y={10}
              width={150}
              height={90}
              fill="#1f1f23"
              stroke="#2d2d33"
              rx="4"
              opacity="0.95"
              className="backdrop-blur-sm"
            />
            <text
              x={width - 85}
              y={30}
              textAnchor="middle"
              className="text-xs fill-grafana-text font-semibold"
              fontSize="11"
            >
              DAG Stats
            </text>
            <g>
              <circle cx={width - 145} cy={45} r="4" fill="#f79420">
                <animate attributeName="r" values="4;5;4" dur="1s" repeatCount="indefinite" />
              </circle>
              <text
                x={width - 135}
                y={49}
                className="text-xs fill-grafana-textSecondary"
                fontSize="10"
              >
                Tips: <tspan className="fill-grafana-warning font-semibold">{formatNumber(tips, 1)}</tspan>
              </text>
            </g>
            <g>
              <circle cx={width - 145} cy={65} r="4" fill="#73bf69">
                <animate attributeName="r" values="4;5;4" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <text
                x={width - 135}
                y={69}
                className="text-xs fill-grafana-textSecondary"
                fontSize="10"
              >
                Height: <tspan className="fill-grafana-success font-semibold">{formatNumber(virtualHeight, 0)}</tspan>
              </text>
            </g>
            <g>
              <circle cx={width - 145} cy={85} r="3" fill="#5794f2">
                <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
              </circle>
              <text
                x={width - 135}
                y={89}
                className="text-xs fill-grafana-textSecondary"
                fontSize="10"
              >
                Blocks: <tspan className="fill-grafana-primary font-semibold">{nodes.length}</tspan>
              </text>
            </g>
          </g>
        </svg>

        {/* Bottom info bar with animated elements */}
        <div className="mt-4 flex items-center justify-between text-xs text-grafana-textSecondary border-t border-grafana-border pt-3 relative z-10">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 animate-pulse" style={{ animationDuration: '2s' }} />
            <span>
              Showing <span className="text-grafana-primary font-semibold">{nodes.length}</span> blocks across{' '}
              <span className="text-grafana-primary font-semibold">
                {Math.ceil(nodes.length / Math.max(3, Math.ceil(tips))) || 10}
              </span>{' '}
              layers
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-grafana-success animate-pulse"></div>
              <span>
                Virtual Chain: <span className="text-grafana-success font-semibold">Active</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-grafana-warning animate-pulse" style={{ animationDuration: '1s' }}></div>
              <span>
                Tips: <span className="text-grafana-warning font-semibold">{formatNumber(tips, 1)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Growing indicator */}
        <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-grafana-success z-20">
          <div className="w-2 h-2 rounded-full bg-grafana-success animate-ping"></div>
          <span className="font-semibold">LIVE</span>
        </div>
      </div>
    </div>
  );
}
