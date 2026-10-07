import React, { useState } from 'react';
import type { RouterNode, NetworkLink, RoutingAlgorithm } from '../types/network';
import { getRouterRoutingTable } from '../algorithms/routingTable';
import { Table, X, Server } from 'lucide-react';

interface RoutingTableModalProps {
  routers: RouterNode[];
  links: NetworkLink[];
  initialRouterId: string;
  algorithm: RoutingAlgorithm;
  onClose: () => void;
}

export const RoutingTableModal: React.FC<RoutingTableModalProps> = ({
  routers,
  links,
  initialRouterId,
  algorithm,
  onClose
}) => {
  const [selectedRouterId, setSelectedRouterId] = useState<string>(initialRouterId);

  const selectedRouter = routers.find(r => r.id === selectedRouterId) || routers[0];
  const tableEntries = selectedRouter 
    ? getRouterRoutingTable(selectedRouter.id, routers, links, algorithm)
    : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '780px' }} 
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
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(6, 182, 212, 0.3)'
            }}>
              <Table size={20} color="#06b6d4" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800 }}>
                Router Forwarding & Routing Table
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Protocol: <span style={{ color: '#38bdf8', fontWeight: 600 }}>{algorithm === 'link-state' ? 'OSPF / Link-State (Dijkstra)' : 'RIP / Distance-Vector (Bellman-Ford)'}</span>
              </p>
            </div>
          </div>

          <button 
            className="btn btn-outline btn-sm btn-icon-only"
            onClick={onClose}
            title="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Router Selector Tabs */}
        <div style={{
          padding: '12px 24px',
          background: 'rgba(7, 10, 18, 0.6)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginRight: '4px' }}>
            Select Router:
          </span>
          {routers.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRouterId(r.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid',
                borderColor: selectedRouterId === r.id ? 'var(--cyan)' : 'var(--border-subtle)',
                background: selectedRouterId === r.id ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                color: selectedRouterId === r.id ? '#38bdf8' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Server size={12} />
              <span>{r.label}</span>
              {r.status === 'failed' && (
                <span style={{ color: '#fb7185', fontSize: '10px' }}>[DOWN]</span>
              )}
            </button>
          ))}
        </div>

        {/* Selected Router Overview Card */}
        {selectedRouter && (
          <div style={{
            margin: '16px 24px',
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>
                  {selectedRouter.label}
                </span>
                <span className={`badge ${selectedRouter.status === 'active' ? 'badge-active' : 'badge-failed'}`}>
                  {selectedRouter.status.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '2px' }}>
                Primary Loopback / IP: <span style={{ color: '#38bdf8' }}>{selectedRouter.ip}</span>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-dim)', maxWidth: '340px' }}>
              💡 <em>Core Concept:</em> In next-hop routing, routers store only the immediate next hop router, not the full path.
            </div>
          </div>
        )}

        {/* Routing Table Content */}
        <div style={{ padding: '0 24px 24px' }}>
          <table className="styled-table">
            <thead>
              <tr>
                <th>Destination Router</th>
                <th>Destination Subnet / IP</th>
                <th>Next Hop</th>
                <th>Metric / Cost</th>
                <th>Outgoing Interface</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tableEntries.map(entry => (
                <tr key={entry.destination}>
                  <td style={{ fontWeight: 700, color: '#fff' }}>
                    {entry.destination}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {entry.destIp}
                  </td>
                  <td>
                    {entry.nextHop === '-' ? (
                      <span style={{ color: 'var(--text-dim)' }}>Direct / Local</span>
                    ) : (
                      <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                        {entry.nextHop}
                      </span>
                    )}
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {entry.cost === Infinity ? (
                      <span style={{ color: 'var(--text-dim)' }}>∞ (Unreachable)</span>
                    ) : (
                      <span style={{ color: '#34d399' }}>{entry.cost}</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {entry.interfaceName}
                  </td>
                  <td>
                    {entry.status === 'local' ? (
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>Local</span>
                    ) : entry.status === 'reachable' ? (
                      <span className="badge badge-active">Active</span>
                    ) : (
                      <span className="badge badge-failed">Down</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
