import React from 'react';
import { T } from '../styles/tokens';
import type { Filters, FiltersResponse, SummaryResponse } from '../types/pnl';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  filters: Filters;
  filterOptions: FiltersResponse | null;
  summary: SummaryResponse | null;
  onRegion: (v: string) => void;
  onFeed: (v: string) => void;
  onNpl: (v: string) => void;
  onFlaggedOnly: (v: boolean) => void;
  onSearch: (v: string) => void;
  children: React.ReactNode;
}

const sel: React.CSSProperties = {
  padding: '8px 12px', borderRadius: T.radiusSm, border: `1px solid ${T.cardBorder}`,
  background: T.surface, color: T.textPrimary, fontFamily: T.font, fontSize: 12,
  outline: 'none', minWidth: 130, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
};

const TABS = [
  { key: 'dashboard', label: 'Executive View' },
  { key: 'lineage', label: 'Lineage Flow' },
  { key: 'detail', label: 'Detail Grid' },
];

export default function Layout({
  activeTab, onTabChange, filters, filterOptions, summary,
  onRegion, onFeed, onNpl, onFlaggedOnly, onSearch, children,
}: Props) {
  const totalRecords = summary?.total_records ?? 0;
  const filteredRecords = summary?.filtered_records ?? 0;

  return (
    <div style={{ fontFamily: T.font, background: T.bg, color: T.textPrimary, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: T.surface, borderBottom: `1px solid ${T.cardBorder}`,
        padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 15, color: '#fff',
          }}>PL</div>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: T.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
              P&L Lineage Intelligence
            </h1>
            <p style={{ fontSize: 11, color: T.textSecondary, margin: 0, fontWeight: 500 }}>
              Delivery PC − BOFC Duration · SLA Threshold &gt; 5 Hours · Timestamps in IST
            </p>
          </div>
        </div>
        <div style={{
          display: 'flex', gap: 2, background: T.bg, borderRadius: 10, padding: 3,
          border: `1px solid ${T.cardBorder}`,
        }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => onTabChange(t.key)} style={{
              padding: '7px 18px', borderRadius: 8, border: 'none',
              background: activeTab === t.key ? T.accent : 'transparent',
              color: activeTab === t.key ? '#fff' : T.textSecondary,
              fontFamily: T.font, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{
        padding: '12px 32px', background: T.surface, borderBottom: `1px solid ${T.cardBorder}`,
        display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <input
          style={{ ...sel, width: 190, background: T.bg }}
          placeholder="Search P&L, Book, Feed..."
          value={filters.search}
          onChange={e => onSearch(e.target.value)}
        />
        <select style={sel} value={filters.region} onChange={e => onRegion(e.target.value)}>
          <option value="">All Regions</option>
          {filterOptions?.regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select style={sel} value={filters.feed} onChange={e => onFeed(e.target.value)}>
          <option value="">All Feeds</option>
          {filterOptions?.feeds.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select style={sel} value={filters.npl} onChange={e => onNpl(e.target.value)}>
          <option value="">All Named P&Ls</option>
          {filterOptions?.npl_names.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <button onClick={() => onFlaggedOnly(!filters.flaggedOnly)} style={{
          padding: '8px 16px', borderRadius: 20,
          border: `1.5px solid ${filters.flaggedOnly ? T.danger : T.cardBorder}`,
          background: filters.flaggedOnly ? T.dangerLight : 'transparent',
          color: filters.flaggedOnly ? T.danger : T.textSecondary,
          fontFamily: T.font, fontSize: 12, fontWeight: 600, cursor: 'pointer',
        }}>
          {filters.flaggedOnly ? '✕' : '○'} SLA Breaches Only (&gt;5h)
        </button>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: T.textMuted }}>
          <span style={{ color: T.textPrimary, fontWeight: 700 }}>{filteredRecords.toLocaleString()}</span> / {totalRecords.toLocaleString()} records
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '22px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {children}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 32px', borderTop: `1px solid ${T.cardBorder}`, background: T.surface,
        display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMuted,
      }}>
        <span>P&L Lineage Intelligence v1.0 — SLA Rule: DurationAvg &gt; 5 hours = Breach · All times in IST</span>
        <span>Dashboard · FastAPI + React</span>
      </div>
    </div>
  );
}
