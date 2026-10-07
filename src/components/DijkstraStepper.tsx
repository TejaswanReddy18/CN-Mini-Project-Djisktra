import React, { useState, useEffect } from 'react';
import type { DijkstraStep } from '../types/network';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  HelpCircle 
} from 'lucide-react';

interface DijkstraStepperProps {
  steps: DijkstraStep[];
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  onClose: () => void;
}

export const DijkstraStepper: React.FC<DijkstraStepperProps> = ({
  steps,
  currentStepIndex,
  onStepChange,
  onClose
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1000); // ms per step

  // Auto-play timer
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        if (currentStepIndex < steps.length - 1) {
          onStepChange(currentStepIndex + 1);
        } else {
          setIsPlaying(false);
        }
      }, playSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playSpeed, steps.length, currentStepIndex, onStepChange]);

  const step = steps[currentStepIndex] || steps[0];
  if (!step) return null;

  return (
    <div className="glass-panel" style={{
      border: '1px solid rgba(6, 182, 212, 0.3)',
      boxShadow: 'var(--shadow-lg), 0 0 20px rgba(6, 182, 212, 0.15)',
      padding: '16px 20px',
      marginTop: '16px'
    }}>
      {/* Stepper Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            padding: '3px 8px',
            borderRadius: '4px',
            background: 'rgba(6, 182, 212, 0.2)',
            color: '#38bdf8',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            fontWeight: 700
          }}>
            DIJKSTRA STEPPER
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <span className={`badge ${step.phase === 'destination_reached' || step.phase === 'completed' ? 'badge-active' : 'badge-cyan'}`}>
            {step.phase.toUpperCase()}
          </span>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Speed selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>Speed:</span>
            <select
              value={playSpeed}
              onChange={(e) => setPlaySpeed(Number(e.target.value))}
              style={{
                background: 'rgba(16, 23, 41, 0.8)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '11px',
                outline: 'none'
              }}
            >
              <option value={1800}>0.5x</option>
              <option value={1000}>1.0x</option>
              <option value={500}>2.0x</option>
            </select>
          </div>

          <button
            className="btn btn-outline btn-sm btn-icon-only"
            onClick={() => {
              setIsPlaying(false);
              onStepChange(0);
            }}
            title="Reset to initial state"
          >
            <RotateCcw size={14} />
          </button>

          <button
            className="btn btn-outline btn-sm btn-icon-only"
            disabled={currentStepIndex === 0}
            onClick={() => {
              setIsPlaying(false);
              onStepChange(Math.max(0, currentStepIndex - 1));
            }}
            title="Previous Step"
          >
            <SkipBack size={14} />
          </button>

          <button
            className={`btn btn-sm ${isPlaying ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause auto-step" : "Auto play all steps"}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            className="btn btn-outline btn-sm btn-icon-only"
            disabled={currentStepIndex === steps.length - 1}
            onClick={() => {
              setIsPlaying(false);
              onStepChange(Math.min(steps.length - 1, currentStepIndex + 1));
            }}
            title="Next Step"
          >
            <SkipForward size={14} />
          </button>

          <button
            className="btn btn-outline btn-sm"
            onClick={onClose}
            style={{ marginLeft: '6px' }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Narrative Explanation Box */}
      <div style={{
        padding: '12px 16px',
        background: 'rgba(7, 10, 18, 0.85)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '14px',
        fontSize: '13px',
        lineHeight: 1.5,
        color: '#e2e8f0',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px'
      }}>
        <div style={{ marginTop: '2px', color: '#38bdf8' }}>
          <HelpCircle size={16} />
        </div>
        <div>
          <div style={{ fontWeight: 600, color: '#38bdf8', marginBottom: '2px' }}>
            Algorithm State Trace:
          </div>
          <div>{step.description}</div>
        </div>
      </div>

      {/* Algorithm State Cards: Permanent Visited vs Unvisited */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        <div style={{
          background: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '10px 12px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '12px'
        }}>
          <div style={{ color: '#34d399', fontWeight: 600, marginBottom: '6px' }}>
            Permanent Set S (Visited):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {step.visited.length > 0 ? (
              step.visited.map(id => (
                <span key={id} style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#6ee7b7',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  {id}
                </span>
              ))
            ) : (
              <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>∅ (Empty)</span>
            )}
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-subtle)',
          padding: '10px 12px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '12px'
        }}>
          <div style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
            Unvisited Candidate Set Q:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {step.unvisited.map(id => (
              <span key={id} style={{
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--text-main)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 600
              }}>
                {id}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tentative Distance Table at this Step */}
      <div style={{ overflowX: 'auto' }}>
        <table className="styled-table" style={{ fontSize: '12px' }}>
          <thead>
            <tr>
              <th>Router</th>
              <th>Known Cost (dist[v])</th>
              <th>Predecessor (prev[v])</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(step.distances).map(nodeId => {
              const d = step.distances[nodeId];
              const p = step.previous[nodeId];
              const isPermanent = step.visited.includes(nodeId);
              const isCurrent = step.currentNode === nodeId;
              const isNeighbor = step.neighborNode === nodeId;

              return (
                <tr key={nodeId} style={{
                  background: isCurrent 
                    ? 'rgba(245, 158, 11, 0.12)' 
                    : isNeighbor 
                    ? 'rgba(6, 182, 212, 0.1)' 
                    : 'transparent'
                }}>
                  <td style={{ fontWeight: 700, color: '#fff' }}>
                    {nodeId} {isCurrent ? '★ (Active)' : isNeighbor ? '→ (Inspecting)' : ''}
                  </td>
                  <td style={{
                    color: d === Infinity ? 'var(--text-dim)' : isNeighbor && step.relaxed ? '#34d399' : '#38bdf8',
                    fontWeight: 700
                  }}>
                    {d === Infinity ? '∞' : d}
                  </td>
                  <td style={{ color: p ? '#a78bfa' : 'var(--text-dim)' }}>
                    {p || '-'}
                  </td>
                  <td>
                    {isPermanent ? (
                      <span className="badge badge-active" style={{ fontSize: '9px' }}>Permanent</span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontSize: '9px' }}>
                        Tentative
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
