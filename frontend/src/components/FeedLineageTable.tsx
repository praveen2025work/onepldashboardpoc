import React, { useState, useMemo } from 'react';
import { T } from '../styles/tokens';
import type { FeedLineageResponse, FeedLineageRow } from '../types/pnl';
import { formatDate } from '../utils/time';

interface Props {
  feeds: FeedLineageResponse | null;
  loading: boolean;
}

export default function FeedLineageTable({ feeds, loading }: Props) {
  const [expandedFeed, setExpandedFeed] = useState<string | null>(null);

  if (loading && !feeds) {
    return <div style={{ padding: 20, color: T.textMuted, fontSize: 12 }}>Loading feed data...</div>;
  }

  if (!feeds || feeds.feeds.length === 0) {
    return <div style={{ padding: 20, color: T.textMuted, fontSize: 12 }}>No feed lineage data</div>;
  }

  // Group by feed name
  const grouped = useMemo(() => {
    const map = new Map<string, FeedLineageRow[]>();
    for (const row of feeds.feeds) {
      const existing = map.get(row.feed_name) ?? [];
      map.set(row.feed_name, [...existing, row]);
    }
    return Array.from(map.entries()).map(([name, rows]) => ({
      name,
      rows,
      delayedCount: rows.filter(r => r.delayed).length,
      totalCount: rows.length,
    }));
  }, [feeds]);

  return (
    <div style={{
      background: T.card, borderRadius: T.radius, border: `1px solid ${T.cardBorder}`,
      boxShadow: T.shadow, overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 20px', borderBottom: `1px solid ${T.cardBorder}`,
        fontSize: 13, fontWeight: 700, color: T.textPrimary,
      }}>
        Feed Lineage
        <span style={{ fontSize: 10, fontWeight: 400, color: T.textMuted, marginLeft: 8 }}>
          {feeds.npl_name} &middot; {grouped.length} feeds &middot; {feeds.feeds.length} records
        </span>
      </div>

      {grouped.map(group => {
        const isExpanded = expandedFeed === group.name;
        const delayPct = group.totalCount > 0
          ? (group.delayedCount / group.totalCount * 100).toFixed(1)
          : '0.0';

        return (
          <div key={group.name}>
            {/* Feed header row */}
            <div
              onClick={() => setExpandedFeed(isExpanded ? null : group.name)}
              style={{
                padding: '10px 20px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: `1px solid ${T.cardBorder}`,
                background: isExpanded ? T.surfaceHover : 'transparent',
              }}
              onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = T.surfaceHover; }}
              onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 10, color: T.textMuted, width: 14 }}>
                {isExpanded ? '\u25BC' : '\u25B6'}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary, flex: 1 }}>
                {group.name}
              </span>
              <span style={{ fontSize: 11, color: T.textSecondary }}>
                {group.totalCount} records
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, fontFamily: T.fontMono,
                color: group.delayedCount > 0 ? T.danger : T.success,
              }}>
                {group.delayedCount > 0 ? `${group.delayedCount} delayed (${delayPct}%)` : 'All on-time'}
              </span>
            </div>

            {/* Expanded rows */}
            {isExpanded && (
              <div style={{ background: T.bg }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr>
                      <th style={feedTh}>Date</th>
                      <th style={feedTh}>Master Book</th>
                      <th style={feedTh}>OLA Time</th>
                      <th style={feedTh}>Arrived Time</th>
                      <th style={feedTh}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.cardBorder}40` }}>
                        <td style={feedTd}>{formatDate(row.business_date)}</td>
                        <td style={feedTd}>
                          <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textMuted }}>{row.master_book_id}</span>
                          <br />
                          <span style={{ fontSize: 10, color: T.textSecondary }}>{row.master_book_name}</span>
                        </td>
                        <td style={{ ...feedTd, fontFamily: T.fontMono }}>{row.ola_time}</td>
                        <td style={{ ...feedTd, fontFamily: T.fontMono }}>{row.arrived_time}</td>
                        <td style={{
                          ...feedTd, fontWeight: 700,
                          color: row.delayed ? T.danger : T.success,
                        }}>
                          {row.delayed ? 'DELAYED' : 'ON-TIME'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const feedTh: React.CSSProperties = {
  padding: '8px 14px', fontSize: 9, fontWeight: 700,
  color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em',
  textAlign: 'left', whiteSpace: 'nowrap',
};

const feedTd: React.CSSProperties = {
  padding: '6px 14px', fontSize: 11, whiteSpace: 'nowrap',
};
