import React from 'react';
import type { RouterNode, NetworkLink } from '../types/network';
import { runDijkstra } from '../algorithms/dijkstra';
import { runDistanceVector } from '../algorithms/bellmanFord';
import { BarChart3, X, Cpu, Share2 } from 'lucide-react';

interface ComparisonModalProps {
  routers: RouterNode[];
  links: NetworkLink[];
  sourceId: string;
  destinationId: string;
  onClose: () => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  routers,
  links,
  sourceId,
  destinationId,
  onClose
}) => {
  // Execute Dijkstra and measure performance
  const t0 = performance.now();
  const dijkstraRun = runDijkstra(routers, links, sourceId, destinationId);
  const dijkstraTime = (performance.now() - t0).toFixed(3);

  // Execute Distance Vector and measure performance
  const t1 = performance.now();
  const dvRun = runDistanceVector(routers, links, sourceId, destinationId);
  const dvTime = (performance.now() - t1).toFixed(3);

  // Active routers & links count
  const activeRouters = routers.filter(r => r.status === 'active');
  const activeLinks = links.filter(l => l.status === 'active');

  // Estimate messages exchanged:
  // For LS: Flooding LSAs: ~ 2 * E per node = 2 * |E| * |V| LSA messages
  const lsMessages = activeRouters.length > 0 ? 2 * activeLinks.length * activeRouters.length : 0;
  // For DV: Total exchanges across all rounds:
  const dvMessages = dvRun.rounds.reduce((acc, r) => acc + r.exchanges.length, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '860px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <BarChart3 size={20} color="#10b981" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800 }}>
                Routing Algorithm Benchmark & Comparison
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Comparing <span style={{ color: '#38bdf8' }}>Link-State (OSPF/Dijkstra)</span> vs <span style={{ color: '#34d399' }}>Distance-Vector (RIP/Bellman-Ford)</span>
              </p>
            </div>
          </div>

          <button className="btn btn-outline btn-sm btn-icon-only" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Live Empirical Metrics on Current Topology */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.06em', marginBottom: '12px' }}>
            1. Live Simulation Metrics (From {sourceId} to {destinationId})
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '14px',
            marginBottom: '20px'
          }}>
            {/* Link-State Card */}
            <div style={{
              background: 'rgba(6, 182, 212, 0.06)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Cpu size={18} color="#38bdf8" />
                <h3 style={{ fontSize: '15px', color: '#38bdf8' }}>Link-State (Dijkstra)</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Optimal Path:</span>
                  <span style={{ color: '#fff', fontWeight: 700 }}>
                    {dijkstraRun.result.reachable ? dijkstraRun.result.path.join(' → ') : 'Unreachable'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Path Cost:</span>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>{dijkstraRun.result.totalCost}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Hop Count:</span>
                  <span style={{ color: '#fff' }}>{dijkstraRun.result.hopCount} hops</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Calculation Steps:</span>
                  <span style={{ color: '#fff' }}>{dijkstraRun.steps.length} steps</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>LSA Flood Overhead:</span>
                  <span style={{ color: '#fff' }}>~{lsMessages} messages</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Local Execution Time:</span>
                  <span style={{ color: '#34d399' }}>{dijkstraTime} ms</span>
                </div>
              </div>
            </div>

            {/* Distance-Vector Card */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.06)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Share2 size={18} color="#34d399" />
                <h3 style={{ fontSize: '15px', color: '#34d399' }}>Distance-Vector (Bellman-Ford)</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Optimal Path:</span>
                  <span style={{ color: '#fff', fontWeight: 700 }}>
                    {dvRun.result.reachable ? dvRun.result.path.join(' → ') : 'Unreachable'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Path Cost:</span>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>{dvRun.result.totalCost}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Hop Count:</span>
                  <span style={{ color: '#fff' }}>{dvRun.result.hopCount} hops</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Convergence Rounds:</span>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>{dvRun.convergedRound} rounds</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Vectors Exchanged:</span>
                  <span style={{ color: '#fff' }}>{dvMessages} messages</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Local Execution Time:</span>
                  <span style={{ color: '#34d399' }}>{dvTime} ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Theoretical Computer Networks Comparison Matrix (Section 16) */}
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.06em', marginBottom: '12px' }}>
            2. Core Computer Networks Comparison Matrix (Section 16)
          </div>

          <table className="styled-table">
            <thead>
              <tr>
                <th>Evaluation Dimension</th>
                <th>Link-State (Dijkstra)</th>
                <th>Distance-Vector (Bellman-Ford)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700, color: '#fff' }}>Routing Approach</td>
                <td style={{ color: '#38bdf8' }}>Global Topology Knowledge (LSDB)</td>
                <td style={{ color: '#34d399' }}>Local Neighbor Information Exchange</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: '#fff' }}>Core Algorithm</td>
                <td>Dijkstra Shortest Path Tree</td>
                <td>Bellman-Ford Iterative Equation</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: '#fff' }}>Convergence Speed</td>
                <td>Fast (immediate once LSAs are flooded)</td>
                <td>Slower (requires multiple iterative rounds)</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: '#fff' }}>Information Exchanged</td>
                <td>Link-State Advertisements (LSA)</td>
                <td>Distance Vectors (Routing Tables)</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: '#fff' }}>Routing Loops</td>
                <td>Immune to loops (exact global tree)</td>
                <td>Susceptible to Count-to-Infinity & loops</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: '#fff' }}>Real-World Protocols</td>
                <td>OSPF, IS-IS</td>
                <td>RIP (Routing Information Protocol), BGP</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: '#fff' }}>Time Complexity</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>O((V + E) log V)</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>O(V · E)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
