import React from 'react';
import type { 
  RouterNode, 
  RoutingAlgorithm, 
  ShortestPathResult 
} from '../types/network';
import { 
  Send, 
  Activity, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle, 
  Cpu, 
  Share2, 
  RefreshCw 
} from 'lucide-react';

interface ControlsPanelProps {
  routers: RouterNode[];
  sourceId: string;
  destinationId: string;
  algorithm: RoutingAlgorithm;
  pathResult: ShortestPathResult | null;
  previousPath: ShortestPathResult | null;
  isStepperOpen: boolean;
  isPacketSending: boolean;
  onSelectAlgorithm: (algo: RoutingAlgorithm) => void;
  onChangeSource: (id: string) => void;
  onChangeDestination: (id: string) => void;
  onCalculateRoute: () => void;
  onToggleStepper: () => void;
  onSendPacket: () => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  routers,
  sourceId,
  destinationId,
  algorithm,
  pathResult,
  previousPath,
  isStepperOpen,
  isPacketSending,
  onSelectAlgorithm,
  onChangeSource,
  onChangeDestination,
  onCalculateRoute,
  onToggleStepper,
  onSendPacket
}) => {
  // Check if route changed due to network failure/restoration
  const hasRouteChanged = previousPath && pathResult && 
    (previousPath.path.join('-') !== pathResult.path.join('-') || previousPath.totalCost !== pathResult.totalCost);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 1. Algorithm Selector Tabs */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.06em' }}>
            Routing Engine Protocol
          </span>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>
            Layer 3 (Network)
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          background: 'rgba(7, 10, 18, 0.6)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            onClick={() => onSelectAlgorithm('link-state')}
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: algorithm === 'link-state' ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'transparent',
              color: algorithm === 'link-state' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s ease',
              boxShadow: algorithm === 'link-state' ? '0 4px 12px rgba(2, 132, 199, 0.35)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={14} />
              <span>Link-State</span>
            </div>
            <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: 400 }}>
              Dijkstra (Global LSDB)
            </span>
          </button>

          <button
            onClick={() => onSelectAlgorithm('distance-vector')}
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: algorithm === 'distance-vector' ? 'linear-gradient(135deg, #059669, #0d9488)' : 'transparent',
              color: algorithm === 'distance-vector' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s ease',
              boxShadow: algorithm === 'distance-vector' ? '0 4px 12px rgba(5, 150, 105, 0.35)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Share2 size={14} />
              <span>Distance-Vector</span>
            </div>
            <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: 400 }}>
              Bellman-Ford (Neighbors)
            </span>
          </button>
        </div>
      </div>

      {/* 2. Source & Destination Router Selection */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.06em' }}>
            Endpoints & Addressing
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            IPv4 Unicast
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#34d399', marginBottom: '6px' }}>
              Source Router (SRC)
            </label>
            <select
              value={sourceId}
              onChange={(e) => onChangeSource(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(7, 10, 18, 0.7)',
                color: '#fff',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 10px',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {routers.map(r => (
                <option key={r.id} value={r.id} disabled={r.status === 'failed'}>
                  {r.label} ({r.ip}) {r.status === 'failed' ? '[DOWN]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#c084fc', marginBottom: '6px' }}>
              Destination Router (DST)
            </label>
            <select
              value={destinationId}
              onChange={(e) => onChangeDestination(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(7, 10, 18, 0.7)',
                color: '#fff',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 10px',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {routers.map(r => (
                <option key={r.id} value={r.id} disabled={r.status === 'failed'}>
                  {r.label} ({r.ip}) {r.status === 'failed' ? '[DOWN]' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '14px' }}>
          <button
            className="btn btn-primary"
            onClick={onCalculateRoute}
            title="Recalculate shortest route"
          >
            <RefreshCw size={15} />
            <span>Recalculate</span>
          </button>

          <button
            className={`btn ${isStepperOpen ? 'btn-cyan-outline' : 'btn-outline'}`}
            onClick={onToggleStepper}
            title="Open step-by-step educational debugger"
          >
            <Activity size={15} color="#38bdf8" />
            <span>{isStepperOpen ? 'Hide Stepper' : 'Step Debugger'}</span>
          </button>
        </div>

        {/* Send Packet Button */}
        <button
          className="btn btn-success"
          onClick={onSendPacket}
          disabled={!pathResult?.reachable || isPacketSending}
          style={{ width: '100%', marginTop: '8px' }}
          title={pathResult?.reachable ? "Animate packet transit through network" : "Destination unreachable"}
        >
          <Send size={15} />
          <span>{isPacketSending ? 'Packet In Flight...' : 'Send Packet (Simulate Flow)'}</span>
        </button>
      </div>

      {/* 3. Shortest Route Result Display Card */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.06em' }}>
            Routing Engine Output
          </span>
          {pathResult?.reachable ? (
            <span className="badge badge-active">
              <CheckCircle size={11} />
              Reachable
            </span>
          ) : (
            <span className="badge badge-failed">
              <AlertCircle size={11} />
              Unreachable
            </span>
          )}
        </div>

        {/* Path Ribbon */}
        {pathResult && pathResult.reachable ? (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '6px',
              padding: '12px',
              background: 'rgba(7, 10, 18, 0.75)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '12px'
            }}>
              {pathResult.path.map((nodeId, idx) => (
                <React.Fragment key={nodeId}>
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: idx === 0 
                      ? 'rgba(16, 185, 129, 0.2)' 
                      : idx === pathResult.path.length - 1 
                      ? 'rgba(168, 85, 247, 0.2)' 
                      : 'rgba(6, 182, 212, 0.15)',
                    border: `1px solid ${
                      idx === 0 
                        ? '#10b981' 
                        : idx === pathResult.path.length - 1 
                        ? '#a855f7' 
                        : '#06b6d4'
                    }`,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {nodeId}
                  </div>
                  {idx < pathResult.path.length - 1 && (
                    <ArrowRight size={13} color="var(--text-muted)" />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Metrics Breakdown */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              fontFamily: 'var(--font-mono)'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  Total Path Cost
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8' }}>
                  {pathResult.totalCost}
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  Hop Count
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#34d399' }}>
                  {pathResult.hopCount} <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-dim)' }}>hops</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            padding: '16px',
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center'
          }}>
            <AlertCircle size={24} color="#f43f5e" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontWeight: 700, color: '#fb7185', fontSize: '14px', marginBottom: '4px' }}>
              Destination Unreachable
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              No active network route connects {sourceId} and {destinationId}. The network may be partitioned by failed links or offline routers.
            </p>
          </div>
        )}

        {/* Dynamic Recalculation Alert Banner (Section 13 & 24) */}
        {hasRouteChanged && (
          <div style={{
            marginTop: '12px',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#fbbf24', marginBottom: '4px' }}>
              <RefreshCw size={13} />
              <span>Dynamic Rerouting Active</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
              Previous: <span style={{ color: '#94a3b8' }}>{previousPath.path.join(' → ')} (Cost: {previousPath.totalCost})</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#38bdf8', marginTop: '2px' }}>
              New Route: <span style={{ fontWeight: 700 }}>{pathResult?.path.join(' → ')} (Cost: {pathResult?.totalCost})</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
