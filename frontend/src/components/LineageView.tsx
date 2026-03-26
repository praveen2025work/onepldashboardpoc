import React, { useState, useMemo, useEffect } from 'react';
import { T } from '../styles/tokens';
import type { LineageResponse, FeedDetail, MasterBookDetail } from '../types/pnl';
import SearchableSelect from './SearchableSelect';

interface Props {
  lineage: LineageResponse | null;
}

function nodeStyle(color: string, bgColor: string, flagged: boolean): React.CSSProperties {
  return {
    padding: '11px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
    border: `1.5px solid ${flagged ? `${T.danger}60` : `${color}40`}`,
    background: flagged ? T.dangerLight : bgColor,
    color: flagged ? T.danger : color,
  };
}

const colLabel: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.12em', color: T.textMuted, marginBottom: 10, paddingLeft: 2,
};
const arrowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 40, flexShrink: 0, paddingTop: 14, color: T.textMuted, fontSize: 16,
};
const ALL = '';

export default function LineageView({ lineage }: Props) {
  const [selectedMb, setSelectedMb] = useState<string>(ALL);
  const [selectedFeed, setSelectedFeed] = useState<string>(ALL);

  // Reset filters when lineage changes, default to first master book
  useEffect(() => {
    if (lineage && lineage.master_books.length > 0) {
      setSelectedMb(lineage.master_books[0].id);
      setSelectedFeed(ALL);
    } else {
      setSelectedMb(ALL);
      setSelectedFeed(ALL);
    }
  }, [lineage?.npl_name]);

  // Derive filtered master books and feeds
  const { filteredBooks, allFilteredFeeds, uniqueFeeds } = useMemo(() => {
    if (!lineage) return { filteredBooks: [], allFilteredFeeds: [], uniqueFeeds: [] };

    // Collect all unique feed names across all master books
    const feedSet = new Set<string>();
    lineage.master_books.forEach(mb => mb.feeds.forEach(f => feedSet.add(f.feed_name)));
    const uniqueFeeds = Array.from(feedSet).sort();

    // Filter master books
    const books = selectedMb === ALL
      ? lineage.master_books
      : lineage.master_books.filter(mb => mb.id === selectedMb);

    // Filter feeds within those books
    const filteredBooks: MasterBookDetail[] = books.map(mb => {
      const feeds = selectedFeed === ALL
        ? mb.feeds
        : mb.feeds.filter(f => f.feed_name === selectedFeed);
      return { ...mb, feeds, has_breach: feeds.some(f => f.flagged) };
    }).filter(mb => mb.feeds.length > 0);

    const allFilteredFeeds: Array<FeedDetail & { mbId: string }> = [];
    filteredBooks.forEach(mb => {
      mb.feeds.forEach(f => allFilteredFeeds.push({ ...f, mbId: mb.id }));
    });

    return { filteredBooks, allFilteredFeeds, uniqueFeeds };
  }, [lineage, selectedMb, selectedFeed]);

  if (!lineage || lineage.master_books.length === 0) {
    return (
      <div style={{
        background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: T.radius,
        padding: 48, textAlign: 'center', boxShadow: T.shadow,
      }}>
        <div style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>
          Select a Named P&L from the table to view its data lineage
        </div>
      </div>
    );
  }

  const hasVisibleBreach = allFilteredFeeds.some(f => f.flagged);

  const legendItems = [
    { label: 'Named P&L', color: T.accent },
    { label: '1 → Many Master Books', color: T.purple },
    { label: '1 → Many Feeds', color: T.success },
    { label: 'BOFC Completed (IST)', color: T.warn },
    { label: 'Delivery PC (IST)', color: T.teal },
    { label: 'Duration (Hours)', color: T.textPrimary },
  ];

  return (
    <div style={{ background: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: T.radius, padding: 24, boxShadow: T.shadow, overflowX: 'auto' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary }}>
          Data Lineage — Delivery PC − BOFC Pipeline
        </div>
        <div style={{ fontSize: 11, color: T.textMuted }}>
          {lineage.npl_name} · {filteredBooks.length}/{lineage.master_books.length} Master Book{lineage.master_books.length > 1 ? 's' : ''} · {allFilteredFeeds.length} Feed Path{allFilteredFeeds.length > 1 ? 's' : ''}
          {hasVisibleBreach && <span style={{ color: T.danger, fontWeight: 700, marginLeft: 8 }}>⚠ SLA Breach Detected (&gt;5h)</span>}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{
        display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16,
        padding: '10px 14px', background: T.bg, borderRadius: T.radiusSm,
        border: `1px solid ${T.cardBorder}`,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Filter Lineage:
        </span>

        {/* Master Book searchable select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: T.purple }}>Master Book</span>
          <SearchableSelect
            options={lineage.master_books.map(mb => ({
              value: mb.id,
              label: `${mb.name} (${mb.id})`,
              sub: `${mb.feeds.length} feed${mb.feeds.length > 1 ? 's' : ''}`,
              badge: mb.has_breach ? 'SLA' : undefined,
              badgeColor: T.danger,
            }))}
            value={selectedMb}
            onChange={setSelectedMb}
            placeholder="Search master book..."
            accentColor={T.purple}
            allLabel={`All Master Books (${lineage.master_books.length})`}
            width={260}
          />
        </div>

        {/* Feed searchable select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: T.success }}>Feed</span>
          <SearchableSelect
            options={uniqueFeeds.map(f => ({ value: f, label: f }))}
            value={selectedFeed}
            onChange={setSelectedFeed}
            placeholder="Search feed..."
            accentColor={T.success}
            allLabel={`All Feeds (${uniqueFeeds.length})`}
            width={200}
          />
        </div>

        {/* Quick actions */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {selectedMb !== ALL && (
            <button
              onClick={() => setSelectedMb(ALL)}
              style={{
                padding: '4px 10px', borderRadius: 6, border: `1px solid ${T.purple}40`,
                background: T.purpleLight, color: T.purple,
                fontFamily: T.font, fontSize: 10, fontWeight: 600, cursor: 'pointer',
              }}
            >Load ALL</button>
          )}
          {(selectedMb !== ALL || selectedFeed !== ALL) && (
            <button
              onClick={() => { setSelectedMb(lineage.master_books[0]?.id ?? ALL); setSelectedFeed(ALL); }}
              style={{
                padding: '4px 10px', borderRadius: 6, border: `1px solid ${T.cardBorder}`,
                background: T.surface, color: T.textSecondary,
                fontFamily: T.font, fontSize: 10, fontWeight: 600, cursor: 'pointer',
              }}
            >Reset</button>
          )}
        </div>
      </div>

      {/* Legend pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {legendItems.map(l => (
          <span key={l.label} style={{
            fontSize: 9, fontWeight: 600, color: l.color, padding: '3px 8px',
            borderRadius: 6, background: `${l.color}0A`, border: `1px solid ${l.color}20`,
          }}>{l.label}</span>
        ))}
      </div>

      {/* Empty state when filters exclude everything */}
      {allFilteredFeeds.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: T.textMuted, fontSize: 12 }}>
          No feed paths match the current filters. Try adjusting Master Book or Feed selection.
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: 1050 }}>
          {/* NPL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 175 }}>
            <div style={colLabel}>Named P&L</div>
            <div style={nodeStyle(T.accent, T.accentLight, hasVisibleBreach)}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{lineage.npl_name}</div>
              <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>{lineage.npl_id}</div>
            </div>
          </div>
          <div style={arrowStyle}>→</div>

          {/* Master Books */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
            <div style={colLabel}>Master Books</div>
            {filteredBooks.map(mb => (
              <div key={mb.id} style={nodeStyle(T.purple, T.purpleLight, mb.has_breach)}>
                <div style={{ fontWeight: 700 }}>{mb.name}</div>
                <div style={{ fontSize: 10, opacity: 0.6 }}>{mb.id}</div>
                <div style={{ fontSize: 9, opacity: 0.5, marginTop: 2 }}>{mb.feeds.length} feed{mb.feeds.length > 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
          <div style={arrowStyle}>→</div>

          {/* Feeds — no SLA data for feeds yet, always neutral green */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 145 }}>
            <div style={colLabel}>Feeds</div>
            {allFilteredFeeds.map((fi, i) => (
              <div key={i} style={nodeStyle(T.success, T.successLight, false)}>
                <div style={{ fontWeight: 700 }}>{fi.feed_name}</div>
                <div style={{ fontSize: 10, opacity: 0.6 }}>via {fi.mbId}</div>
              </div>
            ))}
          </div>
          <div style={arrowStyle}>→</div>

          {/* BOFC Completed — timestamp only, no SLA coloring */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 135 }}>
            <div style={colLabel}>BOFC Completed (IST)</div>
            {allFilteredFeeds.map((fi, i) => (
              <div key={i} style={nodeStyle(T.warn, T.warnLight, false)}>
                <div style={{ fontFamily: T.fontMono, fontSize: 14, fontWeight: 800 }}>{fi.bofc_avg}</div>
                <div style={{ fontSize: 9, opacity: 0.6 }}>Avg CompletedOn</div>
              </div>
            ))}
          </div>
          <div style={arrowStyle}>→</div>

          {/* Delivery — timestamp only, no SLA coloring */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 135 }}>
            <div style={colLabel}>Delivery PC (IST)</div>
            {allFilteredFeeds.map((fi, i) => (
              <div key={i} style={nodeStyle(T.teal, T.tealLight, false)}>
                <div style={{ fontFamily: T.fontMono, fontSize: 14, fontWeight: 800 }}>{fi.delivery_avg}</div>
                <div style={{ fontSize: 9, opacity: 0.6 }}>Avg DelTime</div>
              </div>
            ))}
          </div>
          <div style={arrowStyle}>→</div>

          {/* Duration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 145 }}>
            <div style={colLabel}>Duration (Del − BOFC)</div>
            {allFilteredFeeds.map((fi, i) => (
              <div key={i} title={`DurationAvg = Avg_DelTimePCLocationTime − Avg_CompletedOnTime\n${fi.delivery_avg} − ${fi.bofc_avg} = ${fi.duration_avg}h`} style={{
                padding: '11px 14px', borderRadius: 10,
                border: `2px solid ${fi.flagged ? T.danger : T.success}`,
                background: fi.flagged ? T.dangerLight : T.successLight,
                color: fi.flagged ? T.danger : T.success,
                cursor: 'default',
              }}>
                <div style={{ fontFamily: T.fontMono, fontSize: 18, fontWeight: 800 }}>
                  {fi.duration_avg}h
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2 }}>
                  {fi.flagged ? '⚠ SLA BREACH (>5h)' : '✓ Within SLA'}
                </div>
                <div style={{ fontSize: 8, fontWeight: 500, marginTop: 4, opacity: 0.7, fontFamily: T.fontMono }}>
                  Del − BOFC
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
