import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SeedIcon } from '../common/Icons';
import { Sun, Moon, Sparkles, HelpCircle, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [isDark, setIsDark] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const navLinks = [
    { to: '/', label: 'Detect' },
    { to: '/how-it-works', label: 'How it Works', icon: HelpCircle },
    { to: '/settings/ai', label: 'AI Status', icon: Sparkles },
    { to: '/styleguide', label: 'Styleguide', icon: Palette },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-pith/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rind rounded-lg p-1"
        >
          <div className="w-8 h-8 rounded-xl bg-rind flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <SeedIcon className="w-4 h-4 fill-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-extrabold text-base tracking-tight text-seed flex items-center gap-1.5">
              Digital Dark Spot
              <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded-full bg-flesh/15 text-flesh">
                Beta
              </span>
            </span>
            <span className="text-[11px] text-seed-muted hidden sm:inline-block leading-tight">
              Information Gap & Contradiction Detection
            </span>
          </div>
        </Link>

        {/* Navigation links & Theme toggle */}
        <div className="flex items-center gap-2 sm:gap-4">
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "px-3 py-1.5 text-xs sm:text-sm font-medium rounded-xl transition-colors select-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rind",
                    isActive
                      ? "bg-pith-card text-rind font-semibold shadow-2xs border border-border"
                      : "text-seed-muted hover:text-seed hover:bg-pith-muted/60"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-xl text-seed-muted hover:text-seed hover:bg-pith-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rind"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun className="w-4 h-4 text-crack" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

