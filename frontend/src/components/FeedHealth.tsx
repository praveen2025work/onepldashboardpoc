import React from 'react';
import { T } from '../styles/tokens';
import type { SummaryResponse } from '../types/pnl';

interface Props {
  summary: SummaryResponse | null;
}

export default function FeedHealth({ summary }: Props) {
  if (!summary) return null;
  const byFeed = summary.by_feed;
  const sorted = Object.entries(byFeed).sort((a, b) => b[1].flagged - a[1].flagged);
  const maxT = Math.max(...sorted.map(([, v]) => v.total), 1);

  return (
    <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: T.radius, padding: 22, boxShadow: T.shadow }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, marginBottom: 14 }}>
        Feed Health — Avg Duration (Delivery PC − BOFC)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {sorted.map(([name, v]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 62, fontSize: 11, fontWeight: 600, color: T.textSecondary, flexShrink: 0 }}>{name}</div>
            <div style={{ flex: 1, height: 20, background: T.bg, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
              <div style={{
                height: '100%', width: `${(v.total / maxT) * 100}%`,
                background: `linear-gradient(90deg, ${T.accent}28, ${T.accent}10)`,
                borderRadius: 6,
              }} />
              {v.flagged > 0 && <div style={{
                position: 'absolute', top: 0, left: 0, height: '100%',
                width: `${(v.flagged / maxT) * 100}%`,
                background: `${T.danger}18`, borderRadius: 6,
              }} />}
            </div>
            <div style={{ fontFamily: T.fontMono, fontSize: 11, fontWeight: 700, color: T.textPrimary, width: 26, textAlign: 'right' }}>{v.total}</div>
            <span style={{
              display: 'inline-block', padding: '3px 10px', borderRadius: 12,
              fontSize: 10, fontWeight: 700,
              background: v.flagged > 0 ? T.dangerLight : T.successLight,
              color: v.flagged > 0 ? T.danger : T.success,
            }}>
              {v.flagged} breach{v.flagged !== 1 ? 'es' : ''}
            </span>
            <div style={{
              fontFamily: T.fontMono, fontSize: 11, fontWeight: 700, width: 42,
              color: v.avg_duration > 5 ? T.danger : T.success,
            }}>{v.avg_duration}h</div>
          </div>
        ))}
      </div>
    </div>
  );
}
