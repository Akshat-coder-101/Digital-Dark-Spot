import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SeedIcon } from '@/components/common/Icons';
import { useNavigate } from 'react-router-dom';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rind/15 text-rind text-xs font-semibold">
          <SeedIcon className="w-3.5 h-3.5 fill-current" />
          <span>AI-Assisted Information Gap Detection</span>
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-seed tracking-tight">
          Uncover the Digital Dark Spots
        </h1>
        <p className="text-seed-muted text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Standard AI summarizes what is there. Digital Dark Spot reveals what is <em>missing</em>, <em>conflicting</em>, or <em>outdated</em> across your sources.
        </p>
      </div>

      <Card className="p-6">
        <CardContent className="p-0 space-y-4">
          <div className="p-4 rounded-xl bg-pith-muted border border-border">
            <p className="text-sm font-semibold text-seed mb-1">
              Scaffolding in progress (Step 1)
            </p>
            <p className="text-xs text-seed-muted">
              Check out the design system and component showcase at <strong className="text-seed">/styleguide</strong>.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="rind" onClick={() => navigate('/styleguide')}>
              Explore Styleguide
            </Button>
            <Button variant="outline" onClick={() => navigate('/how-it-works')}>
              How it works
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
