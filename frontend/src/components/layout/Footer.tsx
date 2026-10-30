import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-seed/10 bg-pith py-8 px-4 sm:px-6 transition-colors">
      <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-mono font-semibold uppercase tracking-wider text-flesh flex items-center justify-center md:justify-start gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-flesh animate-pulse" />
            Potential signals, not verified facts.
          </p>
          <p className="text-xs text-seed-muted max-w-md">
            Highlights information gaps and possible contradictions to guide human verification. Always inspect primary sources before taking decisions.
          </p>
        </div>

        <div className="flex flex-col md:items-end gap-1 text-xs text-seed-muted">
          <p className="font-heading font-semibold text-seed">
            Digital Dark Spot
          </p>
          <p className="text-[11px] font-mono text-seed-muted">
            Shinchan Online Hackathon 2026
          </p>
        </div>
      </div>
    </footer>
  );
};
