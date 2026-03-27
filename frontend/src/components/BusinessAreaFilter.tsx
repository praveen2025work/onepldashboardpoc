import React, { useState, useRef, useEffect, useMemo } from 'react';
import { T } from '../styles/tokens';

interface Props {
  areas: string[];
  selected: string[];
  onChange: (areas: string[]) => void;
}

export default function BusinessAreaFilter({ areas, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = useMemo(() => {
    if (!query) return areas;
    const q = query.toLowerCase();
    return areas.filter(a => a.toLowerCase().includes(q));
  }, [areas, query]);

  const toggle = (area: string) => {
    const next = selected.includes(area)
      ? selected.filter(a => a !== area)
      : [...selected, area];
    onChange(next);
  };

  const label = selected.length === 0
    ? `All Business Areas (${areas.length})`
    : `${selected.length} Area${selected.length > 1 ? 's' : ''} Selected`;

  return (
    <div ref={ref} style={{ position: 'relative', width: 260, flexShrink: 0 }}>
      <button
        onClick={() => { setOpen(!open); setQuery(''); }}
        style={{
          width: '100%', padding: '7px 30px 7px 10px', borderRadius: T.radiusSm,
          border: `1.5px solid ${selected.length > 0 ? T.purple + '60' : T.cardBorder}`,
          background: selected.length > 0 ? T.purple + '08' : T.surface,
          color: selected.length > 0 ? T.textPrimary : T.textMuted,
          fontFamily: T.font, fontSize: 12, fontWeight: 600,
          textAlign: 'left', cursor: 'pointer', position: 'relative',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        {label}
        <span style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          fontSize: 10, color: T.textMuted,
        }}>{open ? '\u25B2' : '\u25BC'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, width: '100%', marginTop: 4,
          background: T.surface, border: `1px solid ${T.cardBorder}`,
          borderRadius: T.radiusSm, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 100, maxHeight: 360, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '8px 10px', borderBottom: `1px solid ${T.cardBorder}` }}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search areas..."
              style={{
                width: '100%', padding: '6px 8px', borderRadius: 6,
                border: `1px solid ${T.cardBorder}`, background: T.bg,
                fontFamily: T.font, fontSize: 11, color: T.textPrimary, outline: 'none',
              }}
            />
          </div>

          <div style={{ overflowY: 'auto', maxHeight: 290 }}>
            <div
              onClick={() => onChange([])}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                color: selected.length === 0 ? T.purple : T.textSecondary,
                background: selected.length === 0 ? T.purple + '0A' : 'transparent',
                borderBottom: `1px solid ${T.cardBorder}`,
              }}
            >
              All Business Areas ({areas.length})
            </div>
            {filtered.map(area => {
              const checked = selected.includes(area);
              return (
                <div
                  key={area}
                  onClick={() => toggle(area)}
                  style={{
                    padding: '7px 12px', cursor: 'pointer', fontSize: 11,
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: checked ? T.purple + '0A' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!checked) (e.currentTarget as HTMLElement).style.background = T.surfaceHover; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = checked ? T.purple + '0A' : 'transparent'; }}
                >
                  <span style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${checked ? T.purple : T.cardBorder}`,
                    background: checked ? T.purple : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 10, fontWeight: 800,
                  }}>
                    {checked ? '\u2713' : ''}
                  </span>
                  <span style={{ fontWeight: checked ? 600 : 400, color: T.textPrimary }}>{area}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
