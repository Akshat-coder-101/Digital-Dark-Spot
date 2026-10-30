/**
 * 🍉 DIGITAL DARK SPOT — Core Application & Route Map
 * 
 * Architecture Guide for Hackathon Judges:
 * -------------------------------------------------------------
 * • Router: React Router v6 with code-split lazy loading
 * • Animations: Motion (motion/react) with reduced-motion compliance
 * • Component Library: Watermelon UI (ui.watermelon.sh) + shadcn/Radix
 * • Tokens: Semantic "Watermelon Seed" system (Rind, Flesh, Pith, Seed, Crack, Wilt)
 * 
 * Route Hierarchy:
 * ├── /                     -> Home (Question input, source intake, sample demo)
 * ├── /discover/:id         -> Automatic Source Discovery (Tavily/Brave API search review)
 * ├── /analyzing/:id        -> 5-Stage Analysis Progress Stepper
 * ├── /report/:id           -> Interactive Analysis Dashboard (Half-Melon Slice View)
 * │   ├── /summary          -> Overview & Metrics Breakdown
 * │   ├── /gaps             -> Information Dark Spots (Seeds)
 * │   ├── /conflicts        -> Contradictions & Fractures (Cracks)
 * │   ├── /freshness        -> Temporal Staleness & Older Cycles (Wilted)
 * │   ├── /checklist        -> Prioritized Verification Checklist (Actionable)
 * │   ├── /sources          -> Verified Ingested Ground-Truth Sources
 * │   └── /evidence/:id     -> Slide-Over Evidence Drawer with Verbatim Quotes
 * ├── /how-it-works         -> Methodology & Architecture Guide
 * ├── /settings/ai          -> Multi-Provider LLM Status & Diagnostics (Masked Keys)
 * └── *                     -> 404 Error Block (Watermelon ErrorOne)
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AnimatePresence, motion } from 'motion/react';
import { SeedIcon } from '@/components/common/Icons';

import { DashboardLayout } from '@/pages/Dashboard/DashboardLayout';
import { SummaryTab } from '@/pages/Dashboard/SummaryTab';
import { GapsTab } from '@/pages/Dashboard/GapsTab';
import { ConflictsTab } from '@/pages/Dashboard/ConflictsTab';
import { FreshnessTab } from '@/pages/Dashboard/FreshnessTab';
import { ChecklistTab } from '@/pages/Dashboard/ChecklistTab';
import { SourcesTab } from '@/pages/Dashboard/SourcesTab';
import { EvidenceDrawerSubRoute } from '@/pages/Dashboard/EvidenceDrawerSubRoute';

// Code-split Lazy-Loaded Independent Page Routes
const Home = lazy(() => import('@/pages/Home').then(m => ({ default: m.Home })));
const Discover = lazy(() => import('@/pages/Discover').then(m => ({ default: m.Discover })));
const Analyzing = lazy(() => import('@/pages/Analyzing').then(m => ({ default: m.Analyzing })));
const HowItWorks = lazy(() => import('@/pages/HowItWorks').then(m => ({ default: m.HowItWorks })));
const SettingsAi = lazy(() => import('@/pages/SettingsAi').then(m => ({ default: m.SettingsAi })));
const NotFound = lazy(() => import('@/pages/NotFound').then(m => ({ default: m.NotFound })));

/**
 * Accessible fallback spinner styled with Watermelon tokens
 */
const RouteLoading: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-seed-muted">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
      className="p-3 rounded-2xl bg-rind/10 text-rind"
    >
      <SeedIcon className="w-6 h-6 fill-current" />
    </motion.div>
    <span className="text-xs font-semibold tracking-wider uppercase text-seed-muted font-heading">
      Slicing open route...
    </span>
  </div>
);

export const App: React.FC = () => {
  const location = useLocation();

  return (
    <Suspense fallback={<RouteLoading />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname.split('/')[1] || 'root'}>
          <Route element={<AppLayout />}>
            {/* 1. Landing & Source Intake */}
            <Route path="/" element={<Home />} />

            {/* 2. Automated Source Discovery (Step 3B) */}
            <Route path="/discover/:id" element={<Discover />} />

            {/* 3. Real-Time 5-Stage Analysis Stepper */}
            <Route path="/analyzing/:id" element={<Analyzing />} />

            {/* 4. Interactive Dashboard with Nested Tab Routes */}
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

            {/* 5. Educational Methodology */}
            <Route path="/how-it-works" element={<HowItWorks />} />

            {/* 6. AI Multi-Provider Diagnostics (gated in production) */}
            <Route
              path="/settings/ai"
              element={
                ((import.meta as any).env?.VITE_SHOW_AI_STATUS === 'true' || (import.meta as any).env?.DEV)
                  ? <SettingsAi />
                  : <NotFound />
              }
            />

            {/* 7. Catch-All 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
};
