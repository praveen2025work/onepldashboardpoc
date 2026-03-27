import React from 'react';
import { useDashboard } from './hooks/useDashboard';
import Layout from './components/Layout';
import OverviewGrid from './components/OverviewGrid';
import NplListTable from './components/NplListTable';
import NplDetailView from './components/NplDetailView';
import { T } from './styles/tokens';

export default function App() {
  const {
    filterOptions, selectedMonth, selectedAreas,
    overview, selectedArea, drilldown,
    selectedNplId, selectedNplName, nplDetail, nplFeeds,
    activeTab, viewLevel, loading, error,
    setMonth, setAreas, selectArea, selectNpl,
    setActiveTab, goBack,
  } = useDashboard();

  return (
    <Layout
      filterOptions={filterOptions}
      selectedMonth={selectedMonth}
      selectedAreas={selectedAreas}
      viewLevel={viewLevel}
      selectedArea={selectedArea}
      selectedNplName={selectedNplName}
      onMonthChange={setMonth}
      onAreasChange={setAreas}
      onBack={goBack}
    >
      {error && (
        <div style={{
          padding: '12px 18px', borderRadius: T.radiusSm, background: '#FEF2F2',
          border: '1px solid #FECACA', color: '#DC2626', fontSize: 12, fontWeight: 600,
        }}>
          API Error: {error} — Is the backend running on port 8000?
        </div>
      )}

      {viewLevel === 'overview' && (
        <OverviewGrid
          overview={overview}
          loading={loading}
          onSelectArea={selectArea}
        />
      )}

      {viewLevel === 'area-drilldown' && (
        <NplListTable
          drilldown={drilldown}
          loading={loading}
          onSelectNpl={selectNpl}
          onBack={goBack}
        />
      )}

      {viewLevel === 'npl-detail' && (
        <NplDetailView
          detail={nplDetail}
          feeds={nplFeeds}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          loading={loading}
          onBack={goBack}
        />
      )}
    </Layout>
  );
}
