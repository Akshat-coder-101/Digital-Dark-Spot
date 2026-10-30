import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-border bg-pith-card/50 py-8 px-4 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-flesh flex items-center justify-center md:justify-start gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-flesh animate-pulse" />
            Potential signals, not verified facts.
          </p>
          <p className="text-xs text-seed-muted max-w-md">
            This platform highlights gaps and possible contradictions to guide human verification. Always inspect primary sources before making decisions.
          </p>
        </div>

        <div className="flex flex-col md:items-end gap-1 text-xs text-seed-muted">
          <div className="flex items-center gap-1.5">
            <span>Powered by</span>
            <span className="font-semibold text-seed">Watermelon UI</span>
            <span>&</span>
            <span className="font-semibold text-seed">Motion</span>
          </div>
          <p className="text-[11px] text-seed-muted/80">
            Digital Dark Spot • Shinchan Online Hackathon 2026
          </p>
        </div>
      </div>
    </footer>
  );
};
