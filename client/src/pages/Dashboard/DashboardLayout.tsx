import React from 'react';
import { useParams, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Counter } from '@/components/ui/counter';
import { SeedIcon, CrackIcon, WiltIcon, VerifiedCheckIcon, BowlIcon } from '@/components/common/Icons';

export const DashboardLayout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current active tab based on route pathname
  const currentTab = location.pathname.split('/').pop() || 'summary';

  const handleTabChange = (val: string) => {
    navigate(`/report/${id}/${val}`);
  };

  return (
    <div className="space-y-6">
      {/* Metric Counter Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Counter
          value={3}
          label="Sources Reviewed"
          icon={<VerifiedCheckIcon className="w-4 h-4" />}
          variant="rind"
          subtext="Reachable"
          onClick={() => navigate(`/report/${id}/sources`)}
        />
        <Counter
          value={4}
          label="Potential Gaps"
          icon={<SeedIcon className="w-4 h-4 fill-current" />}
          variant="seed"
          subtext="Uncovered"
          onClick={() => navigate(`/report/${id}/gaps`)}
        />
        <Counter
          value={2}
          label="Possible Conflicts"
          icon={<CrackIcon className="w-4 h-4" />}
          variant="crack"
          subtext="Contradictions"
          onClick={() => navigate(`/report/${id}/conflicts`)}
        />
        <Counter
          value={1}
          label="Potentially Stale"
          icon={<WiltIcon className="w-4 h-4" />}
          variant="wilt"
          subtext="Outdated"
          onClick={() => navigate(`/report/${id}/freshness`)}
        />
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-border pb-2">
        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="gaps">
              <SeedIcon className="w-3.5 h-3.5 fill-current" />
              Gaps
            </TabsTrigger>
            <TabsTrigger value="conflicts">
              <CrackIcon className="w-3.5 h-3.5" />
              Conflicts
            </TabsTrigger>
            <TabsTrigger value="freshness">
              <WiltIcon className="w-3.5 h-3.5" />
              Freshness
            </TabsTrigger>
            <TabsTrigger value="checklist">
              <BowlIcon className="w-3.5 h-3.5" />
              Checklist
            </TabsTrigger>
            <TabsTrigger value="sources">Sources</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Nested Outlet for tab views & evidence drawer */}
      <Outlet />
    </div>
  );
};
