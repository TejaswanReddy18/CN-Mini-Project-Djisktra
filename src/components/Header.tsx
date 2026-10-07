import React from 'react';
import { 
  Network, 
  RotateCcw, 
  PlusCircle, 
  Link as LinkIcon, 
  BarChart3, 
  Table, 
  Layers, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { TOPOLOGY_PRESETS } from '../presets/topologies';

interface HeaderProps {
  onSelectPreset: (presetId: string) => void;
  onAddRouter: () => void;
  isAddLinkMode: boolean;
  onToggleAddLinkMode: () => void;
  onOpenComparison: () => void;
  onOpenAllTables: () => void;
  onResetTopology: () => void;
  totalRouters: number;
  activeRouters: number;
  totalLinks: number;
  activeLinks: number;
  failedLinks: number;
  isConverged: boolean;
  activePresetId: string;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectPreset,
  onAddRouter,
  isAddLinkMode,
  onToggleAddLinkMode,
  onOpenComparison,
  onOpenAllTables,
  onResetTopology,
  totalRouters,
  activeRouters,
  totalLinks,
  activeLinks,
  failedLinks,
  isConverged,
  activePresetId
}) => {
  return (
    <header style={{
      background: 'rgba(11, 15, 25, 0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      flexWrap: 'wrap',
      zIndex: 50
    }}>
      {/* Brand & Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px rgba(6, 182, 212, 0.35)'
        }}>
          <Network size={24} color="#06b6d4" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              RouteLab
            </h1>
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(6, 182, 212, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(6, 182, 212, 0.3)'
            }}>
              v2.0 • NETSIM
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Interactive Network Routing & Failure Simulation System
          </p>
        </div>
      </div>

      {/* Network Health & Topology Stats Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          fontSize: '12px',
          fontFamily: 'var(--font-mono)'
        }}>
          <span style={{ color: 'var(--text-dim)' }}>Routers:</span>
          <span style={{ color: '#38bdf8', fontWeight: 600 }}>{activeRouters}/{totalRouters}</span>
          <span style={{ color: 'var(--border-medium)', margin: '0 2px' }}>|</span>
          <span style={{ color: 'var(--text-dim)' }}>Links:</span>
          <span style={{ color: '#34d399', fontWeight: 600 }}>{activeLinks}/{totalLinks}</span>
          {failedLinks > 0 && (
            <>
              <span style={{ color: 'var(--border-medium)', margin: '0 2px' }}>|</span>
              <span style={{ color: '#fb7185', fontWeight: 600 }}>{failedLinks} failed</span>
            </>
          )}
        </div>

        {/* Convergence Badge */}
        <div className={`badge ${isConverged ? 'badge-active' : 'badge-amber'}`}>
          {isConverged ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
          <span>{isConverged ? 'Network Converged' : 'Recalculating...'}</span>
        </div>
      </div>

      {/* Topology Presets & Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Preset Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Layers size={14} /> Presets:
          </span>
          <select 
            value={activePresetId}
            onChange={(e) => onSelectPreset(e.target.value)}
            style={{
              background: 'rgba(16, 23, 41, 0.85)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 10px',
              fontSize: '12px',
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {TOPOLOGY_PRESETS.map(preset => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
            <option value="custom">Custom / Modified</option>
          </select>
        </div>

        {/* Add Router */}
        <button 
          className="btn btn-outline btn-sm"
          onClick={onAddRouter}
          title="Add a new router to the canvas"
        >
          <PlusCircle size={15} color="#38bdf8" />
          <span>Add Router</span>
        </button>

        {/* Add Link */}
        <button 
          className={`btn btn-sm ${isAddLinkMode ? 'btn-primary' : 'btn-outline'}`}
          onClick={onToggleAddLinkMode}
          title={isAddLinkMode ? "Click router A then router B to link" : "Toggle Link Creation Mode"}
          style={isAddLinkMode ? { animation: 'pulseBorder 2s infinite' } : {}}
        >
          <LinkIcon size={15} />
          <span>{isAddLinkMode ? 'Click 2 Routers...' : 'Connect Link'}</span>
        </button>

        {/* Routing Tables Matrix */}
        <button 
          className="btn btn-outline btn-sm"
          onClick={onOpenAllTables}
          title="Inspect global routing tables for all nodes"
        >
          <Table size={15} color="#a78bfa" />
          <span>Routing Tables</span>
        </button>

        {/* Algorithm Comparison */}
        <button 
          className="btn btn-outline btn-sm"
          onClick={onOpenComparison}
          title="Compare Link-State (Dijkstra) vs Distance-Vector (Bellman-Ford)"
        >
          <BarChart3 size={15} color="#34d399" />
          <span>Compare Algorithms</span>
        </button>

        {/* Reset Topology */}
        <button 
          className="btn btn-outline btn-sm"
          onClick={onResetTopology}
          title="Reset to default topology"
        >
          <RotateCcw size={14} color="#94a3b8" />
          <span>Reset</span>
        </button>
      </div>
    </header>
  );
};
