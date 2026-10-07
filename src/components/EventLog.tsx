import React, { useState } from 'react';
import type { SimulationEvent } from '../types/network';
import { Terminal, Trash2 } from 'lucide-react';

interface EventLogProps {
  events: SimulationEvent[];
  onClearEvents: () => void;
}

export const EventLog: React.FC<EventLogProps> = ({ events, onClearEvents }) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredEvents = filterType === 'all' 
    ? events 
    : events.filter(e => e.type === filterType);

  return (
    <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '260px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={15} color="#38bdf8" />
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.06em' }}>
            Network Event Stream & Syslog
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              background: 'rgba(7, 10, 18, 0.7)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '10px',
              outline: 'none'
            }}
          >
            <option value="all">All Events</option>
            <option value="routing">Routing</option>
            <option value="failure">Failures</option>
            <option value="packet">Packets</option>
            <option value="topology">Topology</option>
          </select>

          <button
            className="btn btn-outline btn-sm btn-icon-only"
            onClick={onClearEvents}
            title="Clear event logs"
            style={{ padding: '3px' }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        paddingRight: '4px'
      }}>
        {filteredEvents.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', textAlign: 'center', marginTop: '40px', fontStyle: 'italic' }}>
            No log events recorded yet.
          </div>
        ) : (
          filteredEvents.map(event => {
            const color = event.type === 'failure'
              ? '#fb7185'
              : event.type === 'routing'
              ? '#38bdf8'
              : event.type === 'packet'
              ? '#34d399'
              : '#c084fc';

            return (
              <div
                key={event.id}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderLeft: `2px solid ${color}`,
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '8px'
                }}
              >
                <span style={{ color: 'var(--text-dim)', fontSize: '10px', flexShrink: 0 }}>
                  {event.timestamp}
                </span>
                <span style={{
                  fontSize: '9px',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  {event.type}
                </span>
                <span style={{ color: '#e2e8f0', wordBreak: 'break-word' }}>
                  {event.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
