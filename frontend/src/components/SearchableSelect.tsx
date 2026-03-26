import React, { useState, useRef, useEffect, useMemo } from 'react';
import { T } from '../styles/tokens';

interface Option {
  value: string;
  label: string;
  sub?: string;
  badge?: string;
  badgeColor?: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  accentColor?: string;
  allLabel?: string;
  width?: number | string;
}

export default function SearchableSelect({
  options, value, onChange, placeholder = 'Search...', accentColor = T.accent,
  allLabel, width = 260,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter(o =>
      o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q) ||
      (o.sub && o.sub.toLowerCase().includes(q))
    );
  }, [options, query]);

  const selectedLabel = value
    ? options.find(o => o.value === value)?.label ?? value
    : allLabel ?? placeholder;

  return (
    <div ref={ref} style={{ position: 'relative', width, flexShrink: 0 }}>
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(!open); setQuery(''); }}
        style={{
          width: '100%', padding: '7px 30px 7px 10px', borderRadius: T.radiusSm,
          border: `1.5px solid ${value ? accentColor + '60' : T.cardBorder}`,
          background: value ? accentColor + '08' : T.surface,
          color: value ? T.textPrimary : T.textMuted,
          fontFamily: T.font, fontSize: 12, fontWeight: 600,
          textAlign: 'left', cursor: 'pointer', position: 'relative',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        {selectedLabel}
        <span style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          fontSize: 10, color: T.textMuted, pointerEvents: 'none',
        }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, width: '100%', marginTop: 4,
          background: T.surface, border: `1px solid ${T.cardBorder}`,
          borderRadius: T.radiusSm, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 100, maxHeight: 320, display: 'flex', flexDirection: 'column',
        }}>
          {/* Search input */}
          <div style={{ padding: '8px 10px', borderBottom: `1px solid ${T.cardBorder}` }}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={placeholder}
              style={{
                width: '100%', padding: '6px 8px', borderRadius: 6,
                border: `1px solid ${T.cardBorder}`, background: T.bg,
                fontFamily: T.font, fontSize: 11, color: T.textPrimary,
                outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = accentColor; }}
              onBlur={e => { e.target.style.borderColor = T.cardBorder; }}
            />
          </div>

          {/* Options list */}
          <div style={{ overflowY: 'auto', maxHeight: 260 }}>
            {/* "All" option */}
            {allLabel && (
              <div
                onClick={() => { onChange(''); setOpen(false); }}
                style={{
                  padding: '8px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                  color: !value ? accentColor : T.textSecondary,
                  background: !value ? accentColor + '0A' : 'transparent',
                  borderBottom: `1px solid ${T.cardBorder}`,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.surfaceHover; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = !value ? accentColor + '0A' : 'transparent'; }}
              >
                {allLabel}
              </div>
            )}

            {filtered.length === 0 && (
              <div style={{ padding: '16px 12px', textAlign: 'center', fontSize: 11, color: T.textMuted }}>
                No matches found
              </div>
            )}

            {filtered.map(o => {
              const selected = o.value === value;
              return (
                <div
                  key={o.value}
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  style={{
                    padding: '7px 12px', cursor: 'pointer', fontSize: 11,
                    background: selected ? accentColor + '0A' : 'transparent',
                    borderLeft: selected ? `3px solid ${accentColor}` : '3px solid transparent',
                  }}
                  onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = T.surfaceHover; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = selected ? accentColor + '0A' : 'transparent'; }}
                >
                  <div style={{ fontWeight: selected ? 700 : 500, color: selected ? accentColor : T.textPrimary }}>
                    {o.label}
                  </div>
                  {o.sub && (
                    <div style={{ fontSize: 9, color: T.textMuted, marginTop: 1 }}>{o.sub}</div>
                  )}
                  {o.badge && (
                    <span style={{
                      float: 'right', marginTop: -14, fontSize: 9, fontWeight: 700,
                      padding: '1px 6px', borderRadius: 8,
                      background: o.badgeColor ? o.badgeColor + '15' : T.dangerLight,
                      color: o.badgeColor ?? T.danger,
                    }}>{o.badge}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
