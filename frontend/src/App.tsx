import React, { useState } from 'react';
import { useFilters } from './hooks/useFilters';
import { usePnlData } from './hooks/usePnlData';
import Layout from './components/Layout';
import KpiCards from './components/KpiCards';
import RegionChart from './components/RegionChart';
import FeedHealth from './components/FeedHealth';
import LineageView from './components/LineageView';
import DataTable from './components/DataTable';
import type { FiltersResponse } from './types/pnl';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { filters, setRegion, setFeed, setNpl, setFlaggedOnly, setSearch } = useFilters();
  const {
    summary, dataResp, lineage, filterOptions,
    page, setPage, sortBy, sortDir, handleSort,
    selectedNpl, setSelectedNpl,
  } = usePnlData(filters);

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      filters={filters}
      filterOptions={filterOptions}
      summary={summary}
      onRegion={setRegion}
      onFeed={setFeed}
      onNpl={setNpl}
      onFlaggedOnly={setFlaggedOnly}
      onSearch={setSearch}
    >
      <KpiCards summary={summary} />

      {activeTab === 'dashboard' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <RegionChart summary={summary} />
            <FeedHealth summary={summary} />
          </div>
          <DataTable
            dataResp={dataResp}
            selectedNpl={selectedNpl}
            onSelectNpl={setSelectedNpl}
            onSort={handleSort}
            sortBy={sortBy}
            sortDir={sortDir}
            page={page}
            onPageChange={setPage}
          />
          {selectedNpl && <LineageView lineage={lineage} />}
        </>
      )}

      {activeTab === 'lineage' && (
        <>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Select Named P&L:</span>
            <select
              style={{
                padding: '8px 12px', borderRadius: '8px', border: '1px solid #E3E8F0',
                background: '#FFFFFF', color: '#1E293B', fontSize: 12, minWidth: 260,
              }}
              value={selectedNpl}
              onChange={e => setSelectedNpl(e.target.value)}
            >
              <option value="">— Choose a P&L —</option>
              {filterOptions?.npl_names.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <LineageView lineage={lineage} />
        </>
      )}

      {activeTab === 'detail' && (
        <>
          <DataTable
            dataResp={dataResp}
            selectedNpl={selectedNpl}
            onSelectNpl={setSelectedNpl}
            onSort={handleSort}
            sortBy={sortBy}
            sortDir={sortDir}
            page={page}
            onPageChange={setPage}
          />
          {selectedNpl && <LineageView lineage={lineage} />}
        </>
      )}
    </Layout>
  );
}
