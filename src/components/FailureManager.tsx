import React from 'react';
import type { RouterNode, NetworkLink } from '../types/network';
import { 
  RotateCcw, 
  Flame, 
  Radio, 
  ShieldAlert 
} from 'lucide-react';

interface FailureManagerProps {
  routers: RouterNode[];
  links: NetworkLink[];
  onToggleLinkFailure: (linkId: string) => void;
  onToggleRouterFailure: (routerId: string) => void;
  onRestoreAll: () => void;
  onSimulateDemoScenario: () => void;
}

export const FailureManager: React.FC<FailureManagerProps> = ({
  routers,
  links,
  onToggleLinkFailure,
  onToggleRouterFailure,
  onRestoreAll,
  onSimulateDemoScenario
}) => {
  const failedLinksCount = links.filter(l => l.status === 'failed').length;
  const failedRoutersCount = routers.filter(r => r.status === 'failed').length;
  const hasFailures = failedLinksCount > 0 || failedRoutersCount > 0;

  return (
    <div className="glass-panel" style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={16} color="#fb7185" />
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.06em' }}>
            Fault Tolerance & Chaos Lab
          </span>
        </div>

        {hasFailures && (
          <button
            className="btn btn-outline btn-sm"
            onClick={onRestoreAll}
            title="Restore all failed components back to normal"
            style={{ fontSize: '11px', padding: '3px 8px' }}
          >
            <RotateCcw size={12} color="#34d399" />
            <span style={{ color: '#34d399' }}>Restore All</span>
          </button>
        )}
      </div>

      {/* Preset Demo Failure Button (Section 24) */}
      <div style={{ marginBottom: '14px' }}>
        <button
          className="btn btn-danger btn-sm"
          onClick={onSimulateDemoScenario}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px 12px' }}
          title="Disable link R2 <-> R4 to trigger alternative path calculation (Section 24 Demo)"
        >
          <Flame size={15} />
          <span>Execute Demo Failure (Kill R2 ↔ R4)</span>
        </button>
      </div>

      {/* Quick Link Toggles */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Toggle Link Failure:</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: failedLinksCount > 0 ? '#fb7185' : 'var(--text-dim)' }}>
            {failedLinksCount} Failed
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '6px' }}>
          {links.map(link => {
            const isFailed = link.status === 'failed';
            return (
              <button
                key={link.id}
                onClick={() => onToggleLinkFailure(link.id)}
                style={{
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${isFailed ? '#f43f5e' : 'var(--border-subtle)'}`,
                  background: isFailed ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: isFailed ? '#fb7185' : 'var(--text-main)',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                title={`Click to ${isFailed ? 'restore' : 'fail'} link ${link.source} <-> ${link.target} (cost: ${link.cost})`}
              >
                <span>{link.source}-{link.target}</span>
                <span style={{ fontSize: '9px', opacity: 0.8 }}>
                  {isFailed ? '✕' : link.cost}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Router Toggles */}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Toggle Router Hardware Failure:</span>
          <span style={{ fontFamily: 'var(--font-mono)', color: failedRoutersCount > 0 ? '#fb7185' : 'var(--text-dim)' }}>
            {failedRoutersCount} Failed
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '6px' }}>
          {routers.map(router => {
            const isFailed = router.status === 'failed';
            return (
              <button
                key={router.id}
                onClick={() => onToggleRouterFailure(router.id)}
                style={{
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${isFailed ? '#f43f5e' : 'var(--border-subtle)'}`,
                  background: isFailed ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: isFailed ? '#fb7185' : 'var(--text-main)',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
                title={`Click to ${isFailed ? 'restore' : 'fail'} router ${router.label}`}
              >
                <Radio size={12} color={isFailed ? '#fb7185' : '#38bdf8'} />
                <span>{router.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
