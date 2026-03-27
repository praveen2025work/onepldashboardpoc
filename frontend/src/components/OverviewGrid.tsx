import React from 'react';
import { T } from '../styles/tokens';
import type { OverviewResponse } from '../types/pnl';
import BusinessAreaCardComponent from './BusinessAreaCard';

interface Props {
  overview: OverviewResponse | null;
  loading: boolean;
  onSelectArea: (area: string) => void;
}

export default function OverviewGrid({ overview, loading, onSelectArea }: Props) {
  if (loading && !overview) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: T.textMuted, fontSize: 13 }}>
        Loading business areas...
      </div>
    );
  }

  const cards = overview?.cards ?? [];

  if (cards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: T.textMuted, fontSize: 13 }}>
        No data available for this month.
      </div>
    );
  }

  // Summary counts
  const greenCount = cards.filter(c => c.status === 'green').length;
  const amberCount = cards.filter(c => c.status === 'amber').length;
  const redCount = cards.filter(c => c.status === 'red').length;

  return (
    <div>
      {/* Summary bar */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 16, fontSize: 12, fontWeight: 600,
        fontFamily: T.font,
      }}>
        <span style={{ color: T.success }}>
          {greenCount} Green (&ge;98%)
        </span>
        <span style={{ color: T.warn }}>
          {amberCount} Amber (80-98%)
        </span>
        <span style={{ color: T.danger }}>
          {redCount} Red (&lt;80%)
        </span>
        <span style={{ color: T.textMuted, marginLeft: 'auto' }}>
          {cards.reduce((sum, c) => sum + c.total_npls, 0)} Total Named PNLs
        </span>
      </div>

      {/* Card grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {cards.map(card => (
          <BusinessAreaCardComponent
            key={card.area_name}
            card={card}
            onClick={() => onSelectArea(card.area_name)}
          />
        ))}
      </div>
    </div>
  );
}
