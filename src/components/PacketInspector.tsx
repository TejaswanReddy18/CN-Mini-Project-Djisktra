import React from 'react';
import type { PacketSimulation } from '../types/network';
import { 
  Send, 
  Activity, 
  CheckCircle2, 
  AlertOctagon, 
  ArrowRight 
} from 'lucide-react';

interface PacketInspectorProps {
  packet: PacketSimulation | null;
  onSendAnother: () => void;
  onClose: () => void;
}

export const PacketInspector: React.FC<PacketInspectorProps> = ({
  packet,
  onSendAnother,
  onClose
}) => {
  if (!packet) return null;

  return (
    <div className="glass-panel" style={{
      padding: '16px 20px',
      border: '1px solid rgba(6, 182, 212, 0.35)',
      boxShadow: 'var(--shadow-lg), 0 0 25px rgba(6, 182, 212, 0.15)',
      marginTop: '16px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'rgba(6, 182, 212, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(6, 182, 212, 0.4)'
          }}>
            <Send size={15} color="#06b6d4" />
          </div>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
              Packet Telemetry Inspector
            </span>
            <span style={{ marginLeft: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
              [{packet.id}]
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`badge ${
            packet.status === 'delivered' 
              ? 'badge-active' 
              : packet.status === 'in_transit' 
              ? 'badge-cyan' 
              : 'badge-failed'
          }`}>
            {packet.status === 'delivered' ? (
              <CheckCircle2 size={11} />
            ) : packet.status === 'in_transit' ? (
              <Activity size={11} />
            ) : (
              <AlertOctagon size={11} />
            )}
            {packet.status.toUpperCase()}
          </span>

          <button className="btn btn-outline btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {/* Path Flow Track */}
      <div style={{
        padding: '10px 14px',
        background: 'rgba(7, 10, 18, 0.7)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexWrap: 'wrap'
      }}>
        {packet.path.map((routerId, index) => {
          const isPassed = index < packet.currentHopIndex;
          const isCurrent = routerId === packet.currentRouter;
          const isNext = routerId === packet.nextRouter;

          return (
            <React.Fragment key={routerId}>
              <div style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid',
                borderColor: isCurrent
                  ? '#06b6d4'
                  : isPassed
                  ? '#10b981'
                  : isNext
                  ? '#f59e0b'
                  : 'var(--border-subtle)',
                background: isCurrent
                  ? 'rgba(6, 182, 212, 0.25)'
                  : isPassed
                  ? 'rgba(16, 185, 129, 0.15)'
                  : isNext
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(255, 255, 255, 0.02)',
                color: isCurrent ? '#38bdf8' : isPassed ? '#34d399' : '#e2e8f0',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {routerId}
                {isCurrent && <span style={{ fontSize: '9px', color: '#38bdf8' }}>★</span>}
              </div>
              {index < packet.path.length - 1 && (
                <ArrowRight size={13} color="var(--text-dim)" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Packet Header Fields Matrix */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '10px',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        marginBottom: '14px'
      }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>Current Hop:</span>
          <strong style={{ color: '#38bdf8', fontSize: '13px' }}>{packet.currentRouter}</strong>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>Next Hop:</span>
          <strong style={{ color: '#f59e0b', fontSize: '13px' }}>{packet.nextRouter || 'Destination Reached'}</strong>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>TTL (Time-To-Live):</span>
          <strong style={{ color: '#34d399', fontSize: '13px' }}>{packet.ttl}</strong>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ color: 'var(--text-dim)', display: 'block', marginBottom: '2px' }}>Protocol Payload:</span>
          <strong style={{ color: '#a78bfa', fontSize: '12px' }}>{packet.protocol}</strong>
        </div>
      </div>

      {/* Replay / Send Again */}
      {packet.status === 'delivered' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16, 185, 129, 0.08)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 600 }}>
            🎉 Packet successfully delivered from {packet.source} to {packet.destination}!
          </span>
          <button className="btn btn-success btn-sm" onClick={onSendAnother}>
            <Send size={12} />
            <span>Send Again</span>
          </button>
        </div>
      )}
    </div>
  );
};
