import React from 'react';
import { T } from '../styles/tokens';
import type { DataResponse } from '../types/pnl';

interface Props {
  dataResp: DataResponse | null;
  selectedNpl: string;
  onSelectNpl: (name: string) => void;
  onSort: (col: string) => void;
  sortBy: string;
  sortDir: string;
  page: number;
  onPageChange: (p: number) => void;
}

const REGION_BADGE: Record<string, { bg: string; c: string }> = {
  AMER: { bg: T.accentLight, c: T.accent },
  EMEA: { bg: T.purpleLight, c: T.purple },
  APAC: { bg: T.successLight, c: T.success },
  LATAM: { bg: T.warnLight, c: T.warn },
};

const COLS = [
  { key: 'NamedPnlName', label: 'Named P&L', w: 155, mono: false },
  { key: 'MasterBookID', label: 'Master Book', w: 105, mono: true },
  { key: 'FeedName', label: 'Feed', w: 75, mono: false },
  { key: 'Region', label: 'Region', w: 65, mono: false },
  { key: 'Avg_CompletedOnTime', label: 'BOFC Avg (IST)', w: 110, mono: true },
  { key: 'Avg_DelTimePCLocationTime', label: 'Del Avg (IST)', w: 110, mono: true },
  { key: 'DurationAvg', label: 'Dur Avg (h)', w: 85, mono: true },
  { key: 'DurationMax', label: 'Dur Max (h)', w: 85, mono: true },
  { key: 'DurationMin', label: 'Dur Min (h)', w: 85, mono: true },
];

export default function DataTable({ dataResp, selectedNpl, onSelectNpl, onSort, sortBy, sortDir, page, onPageChange }: Props) {
  if (!dataResp) return null;

  const { data: rows, total_records, total_pages } = dataResp;

  return (
    <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: T.radius, boxShadow: T.shadow, overflow: 'hidden' }}>
      <div style={{
        padding: '14px 22px', borderBottom: `1px solid ${T.cardBorder}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>
          P&L Detail Grid — {total_records.toLocaleString()} records
          <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 500, marginLeft: 8 }}>
            SLA Rule: DurationAvg &gt; 5 hours = Breach
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: T.textMuted }}>
          Page {page}/{total_pages}
          <button onClick={() => onPageChange(Math.max(1, page - 1))} style={{
            padding: '4px 10px', borderRadius: 6, border: `1px solid ${T.cardBorder}`,
            background: T.surface, color: T.textSecondary, cursor: 'pointer', fontFamily: T.font, fontSize: 12,
          }}>‹</button>
          <button onClick={() => onPageChange(Math.min(total_pages, page + 1))} style={{
            padding: '4px 10px', borderRadius: 6, border: `1px solid ${T.cardBorder}`,
            background: T.surface, color: T.textSecondary, cursor: 'pointer', fontFamily: T.font, fontSize: 12,
          }}>›</button>
        </div>
      </div>
      <div style={{ overflowX: 'auto', maxHeight: 540 }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{
                padding: '10px 12px', textAlign: 'left', fontWeight: 700, fontSize: 9,
                textTransform: 'uppercase', letterSpacing: '0.08em', color: T.textMuted,
                borderBottom: `2px solid ${T.cardBorder}`, background: '#FAFBFC',
                position: 'sticky', top: 0, width: 32, zIndex: 1,
              }}>SLA</th>
              {COLS.map(c => (
                <th key={c.key} onClick={() => onSort(c.key)} style={{
                  padding: '10px 12px', textAlign: 'left', fontWeight: 700, fontSize: 9,
                  textTransform: 'uppercase', letterSpacing: '0.08em', color: T.textSecondary,
                  borderBottom: `2px solid ${T.cardBorder}`, background: '#FAFBFC',
                  position: 'sticky', top: 0, cursor: 'pointer', width: c.w,
                  whiteSpace: 'nowrap', userSelect: 'none', zIndex: 1,
                }}>
                  {c.label} {sortBy === c.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const sel = row.NamedPnlName === selectedNpl;
              const rb = REGION_BADGE[row.Region] ?? { bg: T.bg, c: T.textSecondary };
              return (
                <tr key={idx} onClick={() => onSelectNpl(row.NamedPnlName)}
                  style={{
                    cursor: 'pointer',
                    background: sel ? T.accentLight : row.flagged ? T.dangerLight : 'transparent',
                  }}
                  onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = row.flagged ? '#FEE8E8' : T.surfaceHover; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = sel ? T.accentLight : row.flagged ? T.dangerLight : 'transparent'; }}
                >
                  <td style={{ padding: '10px 12px', borderBottom: `1px solid ${T.cardBorder}`, textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block', width: 9, height: 9, borderRadius: '50%',
                      background: row.flagged ? T.danger : T.success,
                      boxShadow: row.flagged ? `0 0 6px ${T.danger}40` : 'none',
                      opacity: row.flagged ? 1 : 0.6,
                    }} />
                  </td>
                  {COLS.map(c => {
                    const val = (row as unknown as Record<string, unknown>)[c.key];
                    let content: React.ReactNode = String(val);
                    const style: React.CSSProperties = {
                      padding: '10px 12px', borderBottom: `1px solid ${T.cardBorder}`,
                      fontFamily: c.mono ? T.fontMono : T.font,
                      fontSize: c.mono ? 11 : 12,
                      color: T.textPrimary, fontWeight: 400,
                    };
                    if (c.key === 'NamedPnlName') style.fontWeight = 600;
                    if (c.key === 'Region') {
                      content = (
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 12,
                          fontSize: 10, fontWeight: 700, background: rb.bg, color: rb.c,
                        }}>{row.Region}</span>
                      );
                    }
                    if (c.key === 'DurationAvg') {
                      style.fontWeight = 700;
                      style.color = row.flagged ? T.danger : T.success;
                      content = `${row.DurationAvg}h`;
                    }
                    if (c.key === 'DurationMax') content = `${row.DurationMax}h`;
                    if (c.key === 'DurationMin') content = `${row.DurationMin}h`;
                    return <td key={c.key} style={style}>{content}</td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
