import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Loader2 } from 'lucide-react';

// Lazy-loaded routes
const Home = lazy(() => import('@/pages/Home').then(m => ({ default: m.Home })));
const Discover = lazy(() => import('@/pages/Discover').then(m => ({ default: m.Discover })));
const Analyzing = lazy(() => import('@/pages/Analyzing').then(m => ({ default: m.Analyzing })));
const DashboardLayout = lazy(() => import('@/pages/Dashboard/DashboardLayout').then(m => ({ default: m.DashboardLayout })));
const SummaryTab = lazy(() => import('@/pages/Dashboard/SummaryTab').then(m => ({ default: m.SummaryTab })));
const GapsTab = lazy(() => import('@/pages/Dashboard/GapsTab').then(m => ({ default: m.GapsTab })));
const ConflictsTab = lazy(() => import('@/pages/Dashboard/ConflictsTab').then(m => ({ default: m.ConflictsTab })));
const FreshnessTab = lazy(() => import('@/pages/Dashboard/FreshnessTab').then(m => ({ default: m.FreshnessTab })));
const ChecklistTab = lazy(() => import('@/pages/Dashboard/ChecklistTab').then(m => ({ default: m.ChecklistTab })));
const SourcesTab = lazy(() => import('@/pages/Dashboard/SourcesTab').then(m => ({ default: m.SourcesTab })));
const EvidenceDrawerSubRoute = lazy(() => import('@/pages/Dashboard/EvidenceDrawerSubRoute').then(m => ({ default: m.EvidenceDrawerSubRoute })));
const HowItWorks = lazy(() => import('@/pages/HowItWorks').then(m => ({ default: m.HowItWorks })));
const SettingsAi = lazy(() => import('@/pages/SettingsAi').then(m => ({ default: m.SettingsAi })));
const Styleguide = lazy(() => import('@/pages/Styleguide').then(m => ({ default: m.Styleguide })));
const NotFound = lazy(() => import('@/pages/NotFound').then(m => ({ default: m.NotFound })));

const RouteLoading: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-seed-muted">
    <Loader2 className="w-8 h-8 animate-spin text-rind" />
    <span className="text-xs font-medium uppercase tracking-wider">Loading slice...</span>
  </div>
);

export const App: React.FC = () => {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/discover/:id" element={<Discover />} />
          <Route path="/analyzing/:id" element={<Analyzing />} />
          
          {/* Dashboard nested tab routes */}
          <Route path="/report/:id" element={<DashboardLayout />}>
            <Route index element={<Navigate to="summary" replace />} />
            <Route path="summary" element={<SummaryTab />} />
            <Route path="gaps" element={<GapsTab />} />
            <Route path="conflicts" element={<ConflictsTab />} />
            <Route path="freshness" element={<FreshnessTab />} />
            <Route path="checklist" element={<ChecklistTab />} />
            <Route path="sources" element={<SourcesTab />} />
            <Route path="evidence/:claimId" element={<EvidenceDrawerSubRoute />} />
          </Route>

          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/settings/ai" element={<SettingsAi />} />
          <Route path="/styleguide" element={<Styleguide />} />

          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

