import React, { useState } from 'react';
import { T } from '../styles/tokens';
import type { AreaDrilldownResponse, NplSummaryRow } from '../types/pnl';

interface Props {
  drilldown: AreaDrilldownResponse | null;
  loading: boolean;
  onSelectNpl: (nplId: string, nplName: string) => void;
  onBack: () => void;
}

type SortKey = 'npl_name' | 'on_time_pct' | 'total_dates';

const STATUS_DOT: Record<string, string> = {
  green: T.success,
  amber: T.warn,
  red: T.danger,
};

export default function NplListTable({ drilldown, loading, onSelectNpl, onBack }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('on_time_pct');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  if (loading && !drilldown) {
    return <div style={{ textAlign: 'center', padding: 40, color: T.textMuted }}>Loading NPLs...</div>;
  }

  if (!drilldown) return null;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'npl_name' ? 'asc' : 'asc');
    }
  };

  const sorted = [...drilldown.npls].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === 'string') {
      return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
    }
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const arrow = (key: SortKey) => sortKey === key ? (sortDir === 'asc' ? ' \u25B2' : ' \u25BC') : '';

  return (
    <div>
      <div style={{
        background: T.card, borderRadius: T.radius, border: `1px solid ${T.cardBorder}`,
        overflow: 'hidden', boxShadow: T.shadow,
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px', borderBottom: `1px solid ${T.cardBorder}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary }}>
            {drilldown.area_name}
            <span style={{ fontSize: 12, fontWeight: 500, color: T.textMuted, marginLeft: 10 }}>
              {drilldown.npls.length} Named PNLs
            </span>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.font, fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.bg }}>
                <th style={thStyle} />
                <th style={{ ...thStyle, cursor: 'pointer', textAlign: 'left' }} onClick={() => handleSort('npl_name')}>
                  Named PNL{arrow('npl_name')}
                </th>
                <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => handleSort('on_time_pct')}>
                  On-Time %{arrow('on_time_pct')}
                </th>
                <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => handleSort('total_dates')}>
                  Dates{arrow('total_dates')}
                </th>
                <th style={thStyle}>NPL ID</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(npl => (
                <tr
                  key={npl.npl_id}
                  onClick={() => onSelectNpl(npl.npl_id, npl.npl_name)}
                  style={{ cursor: 'pointer', borderBottom: `1px solid ${T.cardBorder}` }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.surfaceHover; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <td style={{ ...tdStyle, width: 30, textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                      background: STATUS_DOT[npl.status] || T.textMuted,
                    }} />
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: T.textPrimary }}>{npl.npl_name}</td>
                  <td style={{
                    ...tdStyle, textAlign: 'center', fontFamily: T.fontMono, fontWeight: 700,
                    color: npl.status === 'green' ? T.success : npl.status === 'red' ? T.danger : T.warn,
                  }}>
                    {npl.on_time_pct.toFixed(1)}%
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', color: T.textSecondary }}>{npl.total_dates}</td>
                  <td style={{ ...tdStyle, fontFamily: T.fontMono, color: T.textMuted, fontSize: 10 }}>{npl.npl_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: 10,
  fontWeight: 700,
  color: '#94A3B8',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  textAlign: 'center',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: 12,
  whiteSpace: 'nowrap',
};
