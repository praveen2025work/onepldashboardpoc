import React from 'react';
import { T } from '../styles/tokens';
import type { SummaryResponse } from '../types/pnl';

interface Props {
  summary: SummaryResponse | null;
}

function KpiCard({ label, value, suffix, color, sub }: {
  label: string; value: string | number; suffix?: string; color: string; sub?: string;
}) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: T.radius,
      padding: '18px 20px', boxShadow: T.shadow, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 4, height: '100%',
        background: color, borderRadius: '0 4px 4px 0',
      }} />
      <div style={{
        fontSize: 10, fontWeight: 700, color: T.textMuted,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
      }}>{label}</div>
      <div style={{
        fontSize: 28, fontWeight: 800, color, fontFamily: T.fontMono,
        letterSpacing: '-0.03em', lineHeight: 1.1,
      }}>
        {value}
        {suffix && <span style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary, marginLeft: 3 }}>{suffix}</span>}
      </div>
      {sub && <div style={{ fontSize: 10, color: T.textMuted, marginTop: 3, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

export default function KpiCards({ summary }: Props) {
  if (!summary) return null;
  const avgDur = summary.avg_duration_hours;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: 12 }}>
      <KpiCard label="Total Records" value={summary.filtered_records.toLocaleString()} color={T.accent} />
      <KpiCard
        label="SLA Breaches (>5h)"
        value={summary.sla_breaches}
        suffix={` (${summary.breach_percentage}%)`}
        color={T.danger}
        sub="DurationAvg exceeds 5 hours"
      />
      <KpiCard
        label="Avg Duration"
        value={avgDur}
        suffix="hours"
        color={avgDur > 5 ? T.danger : T.success}
        sub="Delivery PC − BOFC CompletedOn"
      />
      <KpiCard label="Named P&Ls" value={summary.unique_npls} color={T.accent} />
      <KpiCard label="Master Books" value={summary.unique_master_books} color={T.purple} />
    </div>
  );
}
