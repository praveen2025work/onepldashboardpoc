import React, { useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { T } from '../styles/tokens';
import type { DurationPoint, TimestampPoint } from '../types/pnl';
import { formatDate } from '../utils/time';

interface Props {
  durations: DurationPoint[];
  timestamps: TimestampPoint[];
}

export default function DurationChart({ durations, timestamps }: Props) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  if (durations.length === 0) {
    return <div style={{ padding: 20, color: T.textMuted, fontSize: 12 }}>No duration data</div>;
  }

  const data = durations.map(d => ({
    date: formatDate(d.business_date),
    rawDate: d.business_date,
    bofcToManual: d.bofc_to_manual,
    manualToPC: d.manual_to_pc,
    bofcToPC: d.bofc_to_pc,
  }));

  const handleClick = (data: { rawDate?: string } | undefined) => {
    if (data?.rawDate) {
      setExpandedDate(prev => prev === data.rawDate ? null : data.rawDate!);
    }
  };

  const expandedTs = expandedDate
    ? timestamps.find(t => t.business_date === expandedDate)
    : null;

  return (
    <div style={{
      background: T.card, borderRadius: T.radius, border: `1px solid ${T.cardBorder}`,
      padding: '16px 20px', boxShadow: T.shadow,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, marginBottom: 12 }}>
        Duration Breakdown
        <span style={{ fontSize: 10, fontWeight: 400, color: T.textMuted, marginLeft: 8 }}>
          Hours per Business Date &middot; Click bar for timestamps
        </span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
          onClick={(e: any) => { if (e?.activePayload?.[0]) handleClick(e.activePayload[0].payload); }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: T.textMuted }} />
          <YAxis tick={{ fontSize: 10, fill: T.textMuted }} label={{
            value: 'Hours', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: T.textMuted },
          }} />
          <ReferenceLine y={5} stroke={T.danger} strokeDasharray="4 4" label={{
            value: '5h SLA', position: 'right', style: { fontSize: 9, fill: T.danger },
          }} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0]?.payload;
              return (
                <div style={{
                  background: T.surface, border: `1px solid ${T.cardBorder}`,
                  borderRadius: T.radiusSm, padding: '8px 12px', fontSize: 11, boxShadow: T.shadow,
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.date}</div>
                  <div style={{ color: T.purple }}>BOFC &rarr; Manual: {d.bofcToManual.toFixed(2)}h</div>
                  <div style={{ color: T.teal }}>Manual &rarr; PC: {d.manualToPC.toFixed(2)}h</div>
                  <div style={{
                    fontWeight: 700,
                    color: d.bofcToPC > 5 ? T.danger : T.success,
                  }}>
                    Total: {d.bofcToPC.toFixed(2)}h {d.bofcToPC > 5 ? '(BREACH)' : ''}
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="bofcToManual" stackId="dur" fill={T.purple} name="BOFC to Manual" />
          <Bar dataKey="manualToPC" stackId="dur" fill={T.teal} name="Manual to PC"
            radius={[3, 3, 0, 0]}
          />
          <Line type="monotone" dataKey="bofcToPC" stroke={T.danger} strokeWidth={2}
            dot={{ r: 3, fill: T.danger }} name="Total (BOFC to PC)"
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 8, fontSize: 11 }}>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: T.purple, borderRadius: 2, verticalAlign: 'middle', marginRight: 4 }} /> BOFC &rarr; Manual</span>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: T.teal, borderRadius: 2, verticalAlign: 'middle', marginRight: 4 }} /> Manual &rarr; PC</span>
        <span><span style={{ color: T.danger, fontWeight: 700 }}>&mdash;</span> Total (BOFC &rarr; PC)</span>
        <span style={{ color: T.danger }}>- - - 5h SLA</span>
      </div>

      {/* Expanded timestamp detail */}
      {expandedTs && (
        <div style={{
          marginTop: 12, padding: '10px 14px', background: T.bg,
          borderRadius: T.radiusSm, border: `1px solid ${T.cardBorder}`,
          fontSize: 11,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: T.textPrimary }}>
            Timestamps for {formatDate(expandedDate!)}
            <button
              onClick={() => setExpandedDate(null)}
              style={{
                float: 'right', background: 'none', border: 'none',
                color: T.textMuted, cursor: 'pointer', fontSize: 11,
              }}
            >
              Close
            </button>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <span><strong style={{ color: T.warn }}>BOFC:</strong> {expandedTs.bofc_time}</span>
            <span><strong style={{ color: T.purple }}>Manual:</strong> {expandedTs.manual_time}</span>
            <span><strong style={{ color: T.teal }}>Delivery:</strong> {expandedTs.delivery_time}</span>
          </div>
        </div>
      )}
    </div>
  );
}
