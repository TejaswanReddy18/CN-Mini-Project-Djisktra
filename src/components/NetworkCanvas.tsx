import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { RouterNode, NetworkLink, PacketSimulation, DijkstraStep } from '../types/network';
import { Radio, Activity, AlertOctagon, Trash2, X } from 'lucide-react';

interface NetworkCanvasProps {
  routers: RouterNode[];
  links: NetworkLink[];
  sourceId: string;
  destinationId: string;
  selectedRouterId: string | null;
  activePathNodes: string[];
  activePathLinkIds: string[];
  activeDijkstraStep: DijkstraStep | null;
  packetState: PacketSimulation | null;
  isAddLinkMode: boolean;
  onSelectRouter: (routerId: string | null) => void;
  onSetSource: (routerId: string) => void;
  onSetDestination: (routerId: string) => void;
  onToggleRouterFailure: (routerId: string) => void;
  onDeleteRouter: (routerId: string) => void;
  onUpdateRouterPosition: (routerId: string, x: number, y: number) => void;
  onToggleLinkFailure?: (linkId: string) => void;
  onEditLink: (link: NetworkLink) => void;
  onCreateLink: (sourceId: string, targetId: string, cost: number) => void;
  onSendPacket?: () => void;
}

export const NetworkCanvas: React.FC<NetworkCanvasProps> = ({
  routers,
  links,
  sourceId,
  destinationId,
  selectedRouterId,
  activePathNodes,
  activePathLinkIds,
  activeDijkstraStep,
  packetState,
  isAddLinkMode,
  onSelectRouter,
  onSetSource,
  onSetDestination,
  onToggleRouterFailure,
  onDeleteRouter,
  onUpdateRouterPosition,
  onEditLink,
  onCreateLink
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Drag state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Add Link state (selecting source node then target node)
  const [linkSourceNodeId, setLinkSourceNodeId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Floating Context Menu for router
  const [contextRouter, setContextRouter] = useState<RouterNode | null>(null);

  // Clear link source if add link mode toggled off
  useEffect(() => {
    if (!isAddLinkMode) {
      setLinkSourceNodeId(null);
    }
  }, [isAddLinkMode]);

  // Convert client coordinates to SVG viewBox coordinates
  const getSvgCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  // Handle Dragging
  const handleMouseDownNode = (e: React.MouseEvent, router: RouterNode) => {
    e.stopPropagation();

    if (isAddLinkMode) {
      if (!linkSourceNodeId) {
        setLinkSourceNodeId(router.id);
      } else if (linkSourceNodeId !== router.id) {
        // Create link
        onCreateLink(linkSourceNodeId, router.id, 3);
        setLinkSourceNodeId(null);
      }
      return;
    }

    const { x, y } = getSvgCoordinates(e.clientX, e.clientY);
    setDraggingNodeId(router.id);
    setDragOffset({ x: x - router.x, y: y - router.y });
    onSelectRouter(router.id);
    setContextRouter(router);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getSvgCoordinates(e.clientX, e.clientY);
    setMousePos({ x, y });

    if (draggingNodeId) {
      const newX = Math.max(50, Math.min(950, x - dragOffset.x));
      const newY = Math.max(50, Math.min(550, y - dragOffset.y));
      onUpdateRouterPosition(draggingNodeId, newX, newY);
    }
  };

  const handleMouseUp = () => {
    if (draggingNodeId) {
      setDraggingNodeId(null);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      onSelectRouter(null);
      setContextRouter(null);
      if (linkSourceNodeId) {
        setLinkSourceNodeId(null);
      }
    }
  };

  // Helper: map router id to object
  const routerMap = new Map<string, RouterNode>(routers.map(r => [r.id, r]));

  // Calculate packet position if in transit
  let packetPos: { x: number; y: number } | null = null;
  if (packetState && packetState.status === 'in_transit' && packetState.currentRouter && packetState.nextRouter) {
    const curr = routerMap.get(packetState.currentRouter);
    const next = routerMap.get(packetState.nextRouter);
    if (curr && next) {
      const p = packetState.progress;
      packetPos = {
        x: curr.x + (next.x - curr.x) * p,
        y: curr.y + (next.y - curr.y) * p
      };
    }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '520px', overflow: 'hidden' }}>
      {/* Visual Instruction Banner when in Add Link Mode */}
      {isAddLinkMode && (
        <div style={{
          position: 'absolute',
          top: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(6, 182, 212, 0.9)',
          backdropFilter: 'blur(10px)',
          color: '#070a12',
          padding: '8px 18px',
          borderRadius: '999px',
          fontWeight: 700,
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 20px rgba(6, 182, 212, 0.5)',
          zIndex: 40
        }}>
          <Activity size={16} />
          {linkSourceNodeId 
            ? `Source: Router ${linkSourceNodeId} selected. Now click Destination router to connect!`
            : 'Click the first router to start connection...'}
        </div>
      )}

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        viewBox="0 0 1000 600"
        style={{
          width: '100%',
          height: '100%',
          background: '#090d18',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          cursor: isAddLinkMode ? 'crosshair' : draggingNodeId ? 'grabbing' : 'default',
          userSelect: 'none'
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
      >
        <defs>
          {/* Background Grid Pattern */}
          <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1.2" fill="rgba(255, 255, 255, 0.08)" />
          </pattern>

          {/* Glowing Filters */}
          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glow-packet" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradients */}
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>

        {/* Grid Background */}
        <rect width="1000" height="600" fill="url(#grid-pattern)" />

        {/* Rubber-band line when connecting a new link */}
        {linkSourceNodeId && (
          (() => {
            const src = routerMap.get(linkSourceNodeId);
            if (!src) return null;
            return (
              <line
                x1={src.x}
                y1={src.y}
                x2={mousePos.x}
                y2={mousePos.y}
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                opacity="0.8"
              />
            );
          })()
        )}

        {/* Network Links (Edges) */}
        {links.map(link => {
          const src = routerMap.get(link.source);
          const tgt = routerMap.get(link.target);
          if (!src || !tgt) return null;

          const isPathLink = activePathLinkIds.includes(link.id);
          const isFailed = link.status === 'failed' || src.status === 'failed' || tgt.status === 'failed';

          // Dijkstra relax edge highlighting
          const isDijkstraRelaxing = activeDijkstraStep?.phase === 'relax_neighbor' &&
            ((activeDijkstraStep.currentNode === link.source && activeDijkstraStep.neighborNode === link.target) ||
             (activeDijkstraStep.currentNode === link.target && activeDijkstraStep.neighborNode === link.source));

          // Midpoint for link cost badge
          const midX = (src.x + tgt.x) / 2;
          const midY = (src.y + tgt.y) / 2;

          return (
            <g key={link.id} style={{ cursor: 'pointer' }} onClick={() => onEditLink(link)}>
              {/* Underlying broad click target */}
              <line
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke="transparent"
                strokeWidth="24"
              />

              {/* Main Line */}
              <line
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={
                  isFailed
                    ? '#f43f5e'
                    : isDijkstraRelaxing
                    ? '#f59e0b'
                    : isPathLink
                    ? '#06b6d4'
                    : 'rgba(148, 163, 184, 0.28)'
                }
                strokeWidth={isPathLink || isDijkstraRelaxing ? 4.5 : 2.5}
                strokeDasharray={isFailed ? '6 6' : isPathLink ? '8 4' : 'none'}
                filter={isPathLink ? 'url(#glow-cyan)' : 'none'}
                style={
                  isPathLink && !isFailed
                    ? { animation: 'packetDash 1.2s linear infinite' }
                    : {}
                }
              />

              {/* Link Cost Pill Badge at Midpoint */}
              <g transform={`translate(${midX}, ${midY})`}>
                <title>{`Click to edit link cost or toggle failure (Current: ${link.cost})`}</title>
                <rect
                  x="-18"
                  y="-12"
                  width="36"
                  height="24"
                  rx="12"
                  fill={isFailed ? '#311019' : isPathLink ? '#083344' : '#111827'}
                  stroke={isFailed ? '#f43f5e' : isPathLink ? '#06b6d4' : 'rgba(255, 255, 255, 0.2)'}
                  strokeWidth="1.5"
                />
                {isFailed ? (
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill="#fb7185"
                    fontSize="11"
                    fontFamily="var(--font-mono)"
                    fontWeight="700"
                  >
                    ✕
                  </text>
                ) : (
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill={isPathLink ? '#38bdf8' : '#e2e8f0'}
                    fontSize="12"
                    fontFamily="var(--font-mono)"
                    fontWeight="700"
                  >
                    {link.cost}
                  </text>
                )}
              </g>
            </g>
          );
        })}

        {/* Animated In-Transit Packet */}
        {packetPos && (
          <g transform={`translate(${packetPos.x}, ${packetPos.y})`} filter="url(#glow-packet)">
            {/* Outer expanding pulse circle */}
            <circle r="16" fill="rgba(6, 182, 212, 0.3)" />
            <circle r="9" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" />
            <text
              x="0"
              y="-14"
              textAnchor="middle"
              fill="#38bdf8"
              fontSize="10"
              fontFamily="var(--font-mono)"
              fontWeight="800"
            >
              PKT
            </text>
          </g>
        )}

        {/* Router Nodes */}
        {routers.map(router => {
          const isSelected = selectedRouterId === router.id;
          const isSource = sourceId === router.id;
          const isDest = destinationId === router.id;
          const isPath = activePathNodes.includes(router.id);
          const isFailed = router.status === 'failed';

          // Dijkstra Step Status
          const isDijkstraCurrent = activeDijkstraStep?.currentNode === router.id;
          const isDijkstraNeighbor = activeDijkstraStep?.neighborNode === router.id;
          const isDijkstraVisited = activeDijkstraStep?.visited.includes(router.id);

          return (
            <g
              key={router.id}
              transform={`translate(${router.x}, ${router.y})`}
              onMouseDown={(e) => handleMouseDownNode(e, router)}
              style={{ cursor: isAddLinkMode ? 'pointer' : 'grab' }}
            >
              {/* Outer Glow Halo for Source / Destination / Path */}
              {isSource && (
                <circle
                  r="38"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeDasharray="5 3"
                  opacity="0.8"
                />
              )}
              {isDest && (
                <circle
                  r="38"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2.5"
                  strokeDasharray="5 3"
                  opacity="0.8"
                />
              )}
              {isDijkstraCurrent && (
                <circle
                  r="36"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  filter="url(#glow-cyan)"
                />
              )}
              {isPath && !isSource && !isDest && (
                <circle
                  r="34"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  opacity="0.6"
                />
              )}

              {/* Main Router Hardware Node */}
              <circle
                r="26"
                fill={
                  isFailed
                    ? '#2a0e14'
                    : isDijkstraCurrent
                    ? '#292211'
                    : isDijkstraNeighbor
                    ? '#19263a'
                    : isSelected
                    ? '#132845'
                    : '#0d1527'
                }
                stroke={
                  isFailed
                    ? '#f43f5e'
                    : isSource
                    ? '#10b981'
                    : isDest
                    ? '#a855f7'
                    : isDijkstraCurrent
                    ? '#f59e0b'
                    : isPath
                    ? '#06b6d4'
                    : isSelected
                    ? '#38bdf8'
                    : 'rgba(255, 255, 255, 0.2)'
                }
                strokeWidth={isSelected || isSource || isDest || isDijkstraCurrent ? 3 : 2}
                filter={isPath || isSource || isDest ? 'url(#glow-cyan)' : 'none'}
              />

              {/* Router Icon Center */}
              <g transform="translate(-10, -10)">
                {isFailed ? (
                  <AlertOctagon size={20} color="#fb7185" />
                ) : (
                  <Radio
                    size={20}
                    color={
                      isSource
                        ? '#34d399'
                        : isDest
                        ? '#c084fc'
                        : isPath
                        ? '#38bdf8'
                        : '#94a3b8'
                    }
                  />
                )}
              </g>

              {/* Router Label (ID) */}
              <text
                x="0"
                y="-32"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="13"
                fontFamily="var(--font-heading)"
                fontWeight="800"
              >
                {router.label}
              </text>

              {/* IP Address Label */}
              <text
                x="0"
                y="40"
                textAnchor="middle"
                fill={isFailed ? '#fb7185' : 'var(--text-muted)'}
                fontSize="10"
                fontFamily="var(--font-mono)"
                fontWeight="500"
              >
                {router.ip}
              </text>

              {/* Source / Dest Badges */}
              {isSource && (
                <g transform="translate(18, -26)">
                  <rect x="-14" y="-8" width="28" height="16" rx="4" fill="#065f46" stroke="#10b981" strokeWidth="1" />
                  <text x="0" y="4" textAnchor="middle" fill="#34d399" fontSize="9" fontFamily="var(--font-mono)" fontWeight="700">SRC</text>
                </g>
              )}
              {isDest && (
                <g transform="translate(18, -26)">
                  <rect x="-14" y="-8" width="28" height="16" rx="4" fill="#581c87" stroke="#a855f7" strokeWidth="1" />
                  <text x="0" y="4" textAnchor="middle" fill="#d8b4fe" fontSize="9" fontFamily="var(--font-mono)" fontWeight="700">DST</text>
                </g>
              )}
              {isFailed && (
                <g transform="translate(18, -26)">
                  <rect x="-16" y="-8" width="32" height="16" rx="4" fill="#4c0519" stroke="#f43f5e" strokeWidth="1" />
                  <text x="0" y="4" textAnchor="middle" fill="#fb7185" fontSize="8" fontFamily="var(--font-mono)" fontWeight="700">DOWN</text>
                </g>
              )}

              {/* Dijkstra Tentative Distance tag */}
              {activeDijkstraStep && (
                <g transform="translate(0, -48)">
                  <rect
                    x="-24"
                    y="-10"
                    width="48"
                    height="18"
                    rx="5"
                    fill={isDijkstraVisited ? '#064e3b' : '#1e293b'}
                    stroke={isDijkstraCurrent ? '#f59e0b' : 'rgba(255, 255, 255, 0.2)'}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill={isDijkstraVisited ? '#6ee7b7' : '#94a3b8'}
                    fontSize="10"
                    fontFamily="var(--font-mono)"
                    fontWeight="700"
                  >
                    {activeDijkstraStep.distances[router.id] === Infinity ? '∞' : `d=${activeDijkstraStep.distances[router.id]}`}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating Router Context Card (When a router is clicked) */}
      {contextRouter && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            minWidth: '280px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-medium)',
            background: 'rgba(15, 23, 42, 0.95)',
            zIndex: 30
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '16px', color: '#fff' }}>
                Router {contextRouter.label}
              </span>
              <span className={`badge ${contextRouter.status === 'active' ? 'badge-active' : 'badge-failed'}`}>
                {contextRouter.status.toUpperCase()}
              </span>
            </div>
            <button
              onClick={() => setContextRouter(null)}
              style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 2 }}
            >
              <X size={15} />
            </button>
          </div>

          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            IP Address: <span style={{ color: '#38bdf8' }}>{contextRouter.ip}</span>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => onSetSource(contextRouter.id)}
              disabled={contextRouter.status === 'failed'}
              title="Set as routing source"
            >
              Set Source
            </button>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => onSetDestination(contextRouter.id)}
              disabled={contextRouter.status === 'failed'}
              title="Set as routing destination"
            >
              Set Dest
            </button>
            <button
              className={`btn btn-sm ${contextRouter.status === 'active' ? 'btn-danger' : 'btn-success'}`}
              onClick={() => {
                onToggleRouterFailure(contextRouter.id);
                setContextRouter({
                  ...contextRouter,
                  status: contextRouter.status === 'active' ? 'failed' : 'active'
                });
              }}
            >
              {contextRouter.status === 'active' ? 'Simulate Failure' : 'Restore Router'}
            </button>
            <button
              className="btn btn-sm btn-outline"
              style={{ color: '#f43f5e' }}
              onClick={() => {
                onDeleteRouter(contextRouter.id);
                setContextRouter(null);
              }}
              title="Delete Router"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
