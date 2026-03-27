import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { T } from '../styles/tokens';
import type { TimestampPoint } from '../types/pnl';
import { parseTimeTo24h, formatDate } from '../utils/time';

interface Props {
  timestamps: TimestampPoint[];
}

function formatHour(h: number): string {
  const hour = Math.floor(h) % 24;
  const hr12 = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${hr12} ${ampm}`;
}

export default function TimestampChart({ timestamps }: Props) {
  if (timestamps.length === 0) {
    return <div style={{ padding: 20, color: T.textMuted, fontSize: 12 }}>No timestamp data</div>;
  }

  const data = timestamps.map(t => ({
    date: formatDate(t.business_date),
    bofc: parseTimeTo24h(t.bofc_time),
    manual: parseTimeTo24h(t.manual_time),
    delivery: parseTimeTo24h(t.delivery_time),
    bofcRaw: t.bofc_time,
    manualRaw: t.manual_time,
    deliveryRaw: t.delivery_time,
  }));

  return (
    <div style={{
      background: T.card, borderRadius: T.radius, border: `1px solid ${T.cardBorder}`,
      padding: '16px 20px', boxShadow: T.shadow,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, marginBottom: 12 }}>
        Timestamp Timeline
        <span style={{ fontSize: 10, fontWeight: 400, color: T.textMuted, marginLeft: 8 }}>
          Time of Day (IST) per Business Date
        </span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.cardBorder} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: T.textMuted }} />
          <YAxis
            domain={[0, 24]}
            ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
            tickFormatter={formatHour}
            tick={{ fontSize: 10, fill: T.textMuted }}
          />
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
                  <div style={{ color: T.warn }}>BOFC: {d.bofcRaw}</div>
                  <div style={{ color: T.purple }}>Manual: {d.manualRaw}</div>
                  <div style={{ color: T.teal }}>Delivery: {d.deliveryRaw}</div>
                </div>
              );
            }}
          />
          <Line type="monotone" dataKey="bofc" stroke={T.warn} strokeWidth={2} dot={{ r: 3 }} name="BOFC" />
          <Line type="monotone" dataKey="manual" stroke={T.purple} strokeWidth={2} dot={{ r: 3 }} name="Manual Step" />
          <Line type="monotone" dataKey="delivery" stroke={T.teal} strokeWidth={2} dot={{ r: 3 }} name="Delivery PC" />
        </LineChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 8, fontSize: 11 }}>
        <span><span style={{ color: T.warn, fontWeight: 700 }}>&mdash;</span> BOFC Completed</span>
        <span><span style={{ color: T.purple, fontWeight: 700 }}>&mdash;</span> Manual Step</span>
        <span><span style={{ color: T.teal, fontWeight: 700 }}>&mdash;</span> Delivery PC</span>
      </div>
    </div>
  );
}
