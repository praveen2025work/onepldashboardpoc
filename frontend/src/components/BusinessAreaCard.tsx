import React from 'react';
import { T } from '../styles/tokens';
import type { BusinessAreaCard as CardType } from '../types/pnl';

interface Props {
  card: CardType;
  onClick: () => void;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  green: { bg: T.successLight, border: T.success + '40', text: T.success, badge: T.success },
  amber: { bg: T.warnLight, border: T.warn + '40', text: T.warn, badge: T.warn },
  red: { bg: T.dangerLight, border: T.danger + '40', text: T.danger, badge: T.danger },
};

export default function BusinessAreaCardComponent({ card, onClick }: Props) {
  const colors = STATUS_COLORS[card.status] || STATUS_COLORS.amber;

  return (
    <div
      onClick={onClick}
      style={{
        background: T.card,
        border: `2px solid ${colors.border}`,
        borderRadius: T.radius,
        padding: '18px 20px',
        cursor: 'pointer',
        boxShadow: T.shadow,
        transition: 'transform 0.15s, box-shadow 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = T.shadow;
      }}
    >
      {/* Status indicator bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: colors.badge,
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 4 }}>
        <div>
          <div style={{
            fontSize: 14, fontWeight: 700, color: T.textPrimary,
            fontFamily: T.font, marginBottom: 6,
          }}>
            {card.area_name}
          </div>
          <div style={{ fontSize: 11, color: T.textSecondary, fontFamily: T.font }}>
            {card.total_npls} Named PNL{card.total_npls !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{
          textAlign: 'right',
        }}>
          <div style={{
            fontSize: 28, fontWeight: 800, color: colors.text,
            fontFamily: T.fontMono, lineHeight: 1,
          }}>
            {card.on_time_pct.toFixed(1)}%
          </div>
          <div style={{
            fontSize: 9, fontWeight: 600, color: colors.badge,
            textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4,
          }}>
            On-Time
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        marginTop: 14, height: 6, borderRadius: 3,
        background: T.bg, overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.min(100, card.on_time_pct)}%`,
          height: '100%', borderRadius: 3,
          background: colors.badge,
          transition: 'width 0.3s ease',
        }} />
      </div>

      <div style={{
        marginTop: 8, fontSize: 10, color: T.textMuted,
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>{card.on_time_count} on-time</span>
        <span>Click to drill down &rarr;</span>
      </div>
    </div>
  );
}
