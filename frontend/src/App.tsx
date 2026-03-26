import React, { useState } from 'react';
import { useFilters } from './hooks/useFilters';
import { usePnlData } from './hooks/usePnlData';
import Layout from './components/Layout';
import KpiCards from './components/KpiCards';
import RegionChart from './components/RegionChart';
import FeedHealth from './components/FeedHealth';
import LineageView from './components/LineageView';
import DataTable from './components/DataTable';
import ResizableSplit from './components/ResizableSplit';
import SearchableSelect from './components/SearchableSelect';
import { T } from './styles/tokens';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { filters, setRegion, setFeed, setNpl, setFlaggedOnly, setSearch, setDurRange } = useFilters();
  const {
    summary, dataResp, lineage, filterOptions, error,
    page, setPage, sortBy, sortDir, handleSort,
    selectedNpl, setSelectedNpl,
  } = usePnlData(filters);

  const nplOptions = (filterOptions?.npl_names ?? []).map(n => ({
    value: n, label: n,
  }));

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
      onDurRange={setDurRange}
    >
      {error && (
        <div style={{
          padding: '12px 18px', borderRadius: T.radiusSm, background: '#FEF2F2',
          border: '1px solid #FECACA', color: '#DC2626', fontSize: 12, fontWeight: 600,
        }}>
          API Error: {error} — Is the backend running on port 8000?
        </div>
      )}
      <KpiCards summary={summary} />

      {activeTab === 'dashboard' && (
        <>
          <ResizableSplit
            left={<RegionChart summary={summary} />}
            right={<FeedHealth summary={summary} />}
            defaultLeftPercent={35}
            minLeftPercent={20}
            maxLeftPercent={65}
          />
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
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Named P&L:
            </span>
            <SearchableSelect
              options={nplOptions}
              value={selectedNpl}
              onChange={setSelectedNpl}
              placeholder="Search Named P&L..."
              accentColor={T.accent}
              allLabel={`All Named P&Ls (${nplOptions.length})`}
              width={320}
            />
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
