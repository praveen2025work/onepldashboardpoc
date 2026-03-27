import React from 'react';
import { T } from '../styles/tokens';
import type { FiltersResponse } from '../types/pnl';
import type { ViewLevel } from '../hooks/useDashboard';
import MonthSelector from './MonthSelector';
import BusinessAreaFilter from './BusinessAreaFilter';

interface Props {
  filterOptions: FiltersResponse | null;
  selectedMonth: string;
  selectedAreas: string[];
  viewLevel: ViewLevel;
  selectedArea: string | null;
  selectedNplName: string | null;
  onMonthChange: (month: string) => void;
  onAreasChange: (areas: string[]) => void;
  onBack: () => void;
  children: React.ReactNode;
}

export default function Layout({
  filterOptions, selectedMonth, selectedAreas,
  viewLevel, selectedArea, selectedNplName,
  onMonthChange, onAreasChange, onBack, children,
}: Props) {
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
              Granular Business Date View &middot; SLA Threshold &gt; 5 Hours &middot; Timestamps in IST
            </p>
          </div>
        </div>

        <MonthSelector
          months={filterOptions?.months ?? []}
          selected={selectedMonth}
          onChange={onMonthChange}
        />
      </div>

      {/* Filter / Breadcrumb bar */}
      <div style={{
        padding: '10px 32px', background: T.surface, borderBottom: `1px solid ${T.cardBorder}`,
        display: 'flex', gap: 12, alignItems: 'center',
      }}>
        {/* Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500 }}>
          <span
            onClick={viewLevel !== 'overview' ? onBack : undefined}
            style={{
              color: viewLevel === 'overview' ? T.textPrimary : T.accent,
              cursor: viewLevel === 'overview' ? 'default' : 'pointer',
              fontWeight: viewLevel === 'overview' ? 700 : 500,
            }}
          >
            Overview
          </span>
          {(viewLevel === 'area-drilldown' || viewLevel === 'npl-detail') && selectedArea && (
            <>
              <span style={{ color: T.textMuted }}>/</span>
              <span
                onClick={viewLevel === 'npl-detail' ? onBack : undefined}
                style={{
                  color: viewLevel === 'area-drilldown' ? T.textPrimary : T.accent,
                  cursor: viewLevel === 'area-drilldown' ? 'default' : 'pointer',
                  fontWeight: viewLevel === 'area-drilldown' ? 700 : 500,
                }}
              >
                {selectedArea}
              </span>
            </>
          )}
          {viewLevel === 'npl-detail' && selectedNplName && (
            <>
              <span style={{ color: T.textMuted }}>/</span>
              <span style={{ color: T.textPrimary, fontWeight: 700 }}>{selectedNplName}</span>
            </>
          )}
        </div>

        {/* Back button */}
        {viewLevel !== 'overview' && (
          <button
            onClick={onBack}
            style={{
              padding: '5px 12px', borderRadius: 6, border: `1px solid ${T.cardBorder}`,
              background: T.surface, color: T.textSecondary, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', fontFamily: T.font, marginLeft: 8,
            }}
          >
            &larr; Back
          </button>
        )}

        {/* Area filter (only on overview) */}
        {viewLevel === 'overview' && (
          <div style={{ marginLeft: 'auto' }}>
            <BusinessAreaFilter
              areas={filterOptions?.business_areas ?? []}
              selected={selectedAreas}
              onChange={onAreasChange}
            />
          </div>
        )}
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
        <span>P&L Lineage Intelligence v2.0 — SLA Rule: BOFCToPC &gt; 5 hours = Breach &middot; All times in IST</span>
        <span>Dashboard &middot; FastAPI + React</span>
      </div>
    </div>
  );
}
