import React from 'react';
import { T } from '../styles/tokens';
import type { SummaryResponse } from '../types/pnl';

const REGIONS = ['AMER', 'EMEA', 'APAC', 'LATAM'];
const REGION_COLORS: Record<string, string> = {
  AMER: T.accent, EMEA: T.purple, APAC: T.success, LATAM: T.warn,
};

interface Props {
  summary: SummaryResponse | null;
}

export default function RegionChart({ summary }: Props) {
  if (!summary) return null;
  const byRegion = summary.by_region;
  const maxVal = Math.max(...REGIONS.map(r => byRegion[r]?.total ?? 0), 1);

  return (
    <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: T.radius, padding: 22, boxShadow: T.shadow }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, marginBottom: 18 }}>
        Volume &amp; SLA Breaches by Region
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: 110, padding: '0 4px' }}>
        {REGIONS.map(r => {
          const stats = byRegion[r] ?? { total: 0, flagged: 0 };
          const pct = (stats.total / maxVal) * 100;
          const fpct = (stats.flagged / maxVal) * 100;
          const breachRate = stats.total > 0 ? Math.round((stats.flagged / stats.total) * 100) : 0;
          return (
            <div key={r} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ display: 'flex', gap: 3, justifyContent: 'center', alignItems: 'flex-end', height: 70 }}>
                <div style={{ width: 22, height: `${pct}%`, minHeight: 3, background: REGION_COLORS[r], borderRadius: '4px 4px 0 0', opacity: 0.8 }} />
                <div style={{ width: 22, height: `${fpct}%`, minHeight: stats.flagged ? 3 : 0, background: T.danger, borderRadius: '4px 4px 0 0', opacity: 0.7 }} />
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textSecondary, marginTop: 8, letterSpacing: '0.05em' }}>{r}</div>
              <div style={{ fontSize: 17, fontWeight: 800, fontFamily: T.fontMono, color: T.textPrimary }}>{stats.total}</div>
              <div style={{ fontSize: 9, color: breachRate > 40 ? T.danger : T.textMuted, fontWeight: 600 }}>{breachRate}% breach</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 12 }}>
        <span style={{ fontSize: 10, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: T.accent, display: 'inline-block' }} /> Total
        </span>
        <span style={{ fontSize: 10, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: T.danger, display: 'inline-block' }} /> Breach (&gt;5h)
        </span>
      </div>
    </div>
  );
}
