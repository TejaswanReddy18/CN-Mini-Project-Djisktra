import React, { useState, useEffect } from 'react';
import type { DVRound } from '../types/network';
import { 
  CheckCircle2, 
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  Play, 
  Pause, 
  Info,
  TrendingDown
} from 'lucide-react';

interface DVRoundViewerProps {
  rounds: DVRound[];
  convergedRound: number;
  currentRoundIndex: number;
  onRoundChange: (index: number) => void;
  onClose: () => void;
}

export const DVRoundViewer: React.FC<DVRoundViewerProps> = ({
  rounds,
  convergedRound,
  currentRoundIndex,
  onRoundChange,
  onClose
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        if (currentRoundIndex < rounds.length - 1) {
          onRoundChange(currentRoundIndex + 1);
        } else {
          setIsPlaying(false);
        }
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, rounds.length, currentRoundIndex, onRoundChange]);

  const round = rounds[currentRoundIndex] || rounds[0];
  if (!round) return null;

  const routerIds = Object.keys(round.tables).sort();

  return (
    <div className="glass-panel" style={{
      border: '1px solid rgba(16, 185, 129, 0.3)',
      boxShadow: 'var(--shadow-lg), 0 0 20px rgba(16, 185, 129, 0.15)',
      padding: '16px 20px',
      marginTop: '16px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            padding: '3px 8px',
            borderRadius: '4px',
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            fontWeight: 700
          }}>
            DISTANCE-VECTOR ROUNDS
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
            Round {round.roundNumber} of {rounds.length - 1}
          </span>
          {round.converged ? (
            <span className="badge badge-active">
              <CheckCircle2 size={12} />
              Converged in Round {convergedRound}
            </span>
          ) : (
            <span className="badge badge-amber">
              Iterating Updates...
            </span>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="btn btn-outline btn-sm btn-icon-only"
            onClick={() => {
              setIsPlaying(false);
              onRoundChange(0);
            }}
            title="Reset to Round 0"
          >
            <RotateCcw size={14} />
          </button>

          <button
            className="btn btn-outline btn-sm btn-icon-only"
            disabled={currentRoundIndex === 0}
            onClick={() => {
              setIsPlaying(false);
              onRoundChange(Math.max(0, currentRoundIndex - 1));
            }}
            title="Previous Round"
          >
            <SkipBack size={14} />
          </button>

          <button
            className={`btn btn-sm ${isPlaying ? 'btn-danger' : 'btn-success'}`}
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause" : "Play rounds"}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            className="btn btn-outline btn-sm btn-icon-only"
            disabled={currentRoundIndex === rounds.length - 1}
            onClick={() => {
              setIsPlaying(false);
              onRoundChange(Math.min(rounds.length - 1, currentRoundIndex + 1));
            }}
            title="Next Round"
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

      {/* Description */}
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
        <div style={{ marginTop: '2px', color: '#34d399' }}>
          <Info size={16} />
        </div>
        <div>
          <div style={{ fontWeight: 600, color: '#34d399', marginBottom: '2px' }}>
            Bellman-Ford Convergence Dynamics:
          </div>
          <div>{round.description}</div>
        </div>
      </div>

      {/* Changes list in this round if any */}
      {round.changes.length > 0 && (
        <div style={{
          marginBottom: '14px',
          padding: '10px 14px',
          background: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: 'var(--radius-sm)'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingDown size={14} />
            Route Distance Reductions Learned This Round:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {round.changes.map((ch, idx) => (
              <span key={idx} style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                padding: '3px 8px',
                borderRadius: '4px',
                background: 'rgba(7, 10, 18, 0.8)',
                border: '1px solid var(--border-subtle)',
                color: '#e2e8f0'
              }}>
                <strong>{ch.routerId}</strong> to <strong>{ch.destId}</strong>: {ch.oldCost === Infinity ? '∞' : ch.oldCost} ➔ <span style={{ color: '#34d399', fontWeight: 700 }}>{ch.newCost}</span> (via {ch.newNextHop})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Distance Vectors Matrix across all Routers at this round */}
      <div style={{ overflowX: 'auto' }}>
        <table className="styled-table" style={{ fontSize: '12px' }}>
          <thead>
            <tr>
              <th>Router Vector</th>
              {routerIds.map(destId => (
                <th key={destId} style={{ textAlign: 'center' }}>
                  To {destId}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {routerIds.map(rId => {
              const vector = round.tables[rId] || {};
              return (
                <tr key={rId}>
                  <td style={{ fontWeight: 700, color: '#fff' }}>
                    {rId} Vector
                  </td>
                  {routerIds.map(dId => {
                    const entry = vector[dId];
                    const isSelf = rId === dId;
                    return (
                      <td key={dId} style={{ textAlign: 'center' }}>
                        {isSelf ? (
                          <span style={{ color: 'var(--text-dim)' }}>0 (Self)</span>
                        ) : entry ? (
                          entry.cost === Infinity ? (
                            <span style={{ color: 'var(--text-dim)' }}>∞</span>
                          ) : (
                            <span>
                              <strong style={{ color: '#38bdf8' }}>{entry.cost}</strong>{' '}
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                ({entry.nextHop})
                              </span>
                            </span>
                          )
                        ) : (
                          '-'
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
