import React from 'react';
import { T } from '../styles/tokens';
import type { MonthOption } from '../types/pnl';

interface Props {
  months: MonthOption[];
  selected: string;         // key like "2026-02"
  onChange: (key: string) => void;
}

export default function MonthSelector({ months, selected, onChange }: Props) {
  if (months.length === 0) return null;

  return (
    <div style={{
      display: 'flex', gap: 3, background: T.bg, borderRadius: 10, padding: 3,
      border: `1px solid ${T.cardBorder}`, flexWrap: 'wrap',
    }}>
      {months.map(m => {
        const isSelected = m.key === selected;
        return (
          <button
            key={m.key}
            onClick={() => onChange(m.key)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              background: isSelected ? T.accent : 'transparent',
              color: isSelected ? '#fff' : T.textSecondary,
              fontFamily: T.font,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
