import React, { useState } from 'react';
import type { NetworkLink } from '../types/network';
import { X, Sliders, Trash2, ShieldAlert } from 'lucide-react';

interface EditLinkModalProps {
  link: NetworkLink;
  onUpdateCost: (linkId: string, newCost: number) => void;
  onToggleFailure: (linkId: string) => void;
  onDeleteLink: (linkId: string) => void;
  onClose: () => void;
}

export const EditLinkModal: React.FC<EditLinkModalProps> = ({
  link,
  onUpdateCost,
  onToggleFailure,
  onDeleteLink,
  onClose
}) => {
  const [cost, setCost] = useState<number>(link.cost);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cost > 0) {
      onUpdateCost(link.id, cost);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '440px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={18} color="#06b6d4" />
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>
              Configure Link {link.source} ↔ {link.target}
            </h3>
          </div>
          <button className="btn btn-outline btn-sm btn-icon-only" onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Link Metric / Cost (Weight):
            </label>
            <input
              type="number"
              min="1"
              max="99"
              value={cost}
              onChange={(e) => setCost(Math.max(1, parseInt(e.target.value) || 1))}
              style={{
                width: '100%',
                background: 'rgba(7, 10, 18, 0.8)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                color: '#fff',
                fontSize: '16px',
                fontFamily: 'var(--font-mono)',
                outline: 'none'
              }}
              autoFocus
            />
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
              Higher link cost discourages routing algorithms from selecting this path.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <button
              type="button"
              className={`btn btn-sm ${link.status === 'active' ? 'btn-danger' : 'btn-success'}`}
              onClick={() => {
                onToggleFailure(link.id);
                onClose();
              }}
              style={{ flex: 1 }}
            >
              <ShieldAlert size={14} />
              <span>{link.status === 'active' ? 'Simulate Link Failure' : 'Restore Link'}</span>
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                onDeleteLink(link.id);
                onClose();
              }}
              style={{ color: '#f43f5e' }}
              title="Delete Link"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Save Cost
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
