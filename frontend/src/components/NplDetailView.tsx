import React from 'react';
import { T } from '../styles/tokens';
import type { NplDetailResponse, FeedLineageResponse } from '../types/pnl';
import TimestampChart from './TimestampChart';
import DurationChart from './DurationChart';
import FeedLineageTable from './FeedLineageTable';

interface Props {
  detail: NplDetailResponse | null;
  feeds: FeedLineageResponse | null;
  activeTab: 'timestamps' | 'durations' | 'feeds';
  onTabChange: (tab: 'timestamps' | 'durations' | 'feeds') => void;
  loading: boolean;
  onBack: () => void;
}

const TABS: { key: 'timestamps' | 'durations' | 'feeds'; label: string }[] = [
  { key: 'durations', label: 'Duration Breakdown' },
  { key: 'timestamps', label: 'Timestamp Timeline' },
  { key: 'feeds', label: 'Feed Lineage' },
];

export default function NplDetailView({ detail, feeds, activeTab, onTabChange, loading, onBack }: Props) {
  if (loading && !detail) {
    return <div style={{ textAlign: 'center', padding: 40, color: T.textMuted }}>Loading NPL details...</div>;
  }

  if (!detail) return null;

  // Compute on-time stats
  const totalDates = detail.durations.length;
  const onTimeDates = detail.durations.filter(d => d.bofc_to_pc <= 5).length;
  const onTimePct = totalDates > 0 ? (onTimeDates / totalDates * 100) : 0;
  const status = onTimePct >= 98 ? 'green' : onTimePct >= 80 ? 'amber' : 'red';
  const statusColor = status === 'green' ? T.success : status === 'red' ? T.danger : T.warn;

  return (
    <div>
      {/* Header card */}
      <div style={{
        background: T.card, borderRadius: T.radius, border: `1px solid ${T.cardBorder}`,
        padding: '16px 20px', boxShadow: T.shadow, marginBottom: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.textPrimary }}>{detail.npl_name}</div>
          <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 2 }}>
            {detail.npl_id} &middot; {detail.business_area} &middot; {totalDates} business dates
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: T.fontMono, color: statusColor }}>
            {onTimePct.toFixed(1)}%
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            On-Time ({onTimeDates}/{totalDates})
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 2, background: T.bg, borderRadius: 10, padding: 3,
        border: `1px solid ${T.cardBorder}`, marginBottom: 16, width: 'fit-content',
      }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            style={{
              padding: '7px 18px', borderRadius: 8, border: 'none',
              background: activeTab === t.key ? T.accent : 'transparent',
              color: activeTab === t.key ? '#fff' : T.textSecondary,
              fontFamily: T.font, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'durations' && (
        <DurationChart durations={detail.durations} timestamps={detail.timestamps} />
      )}
      {activeTab === 'timestamps' && (
        <TimestampChart timestamps={detail.timestamps} />
      )}
      {activeTab === 'feeds' && (
        <FeedLineageTable feeds={feeds} loading={loading} />
      )}
    </div>
  );
}
