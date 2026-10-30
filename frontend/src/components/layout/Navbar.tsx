import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SeedIcon } from '../common/Icons';
import { Sun, Moon, Sparkles, HelpCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
    } catch {}
    return false; // Light mode (#F4F8EE pith) is the default design canvas
  });

  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch {}
  }, [isDark]);

  const showAiStatus = (import.meta as any).env?.VITE_SHOW_AI_STATUS === 'true' || (import.meta as any).env?.DEV;

  const baseNavLinks = [
    { to: '/', label: 'Investigate', icon: Search },
    { to: '/how-it-works', label: 'How it Works', icon: HelpCircle },
    { to: '/settings/ai', label: 'AI Status', icon: Sparkles },
  ];

  const navLinks = showAiStatus ? baseNavLinks : baseNavLinks.filter(l => l.to !== '/settings/ai');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-seed/10 bg-pith/90 backdrop-blur-md transition-colors">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand Wordmark with small seed mark */}
        <Link
          to="/"
          className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rind rounded-sm shrink-0"
        >
          <div className="w-5 h-5 rounded-xs bg-rind flex items-center justify-center text-white transition-transform group-hover:scale-105 shrink-0">
            <SeedIcon className="w-3 h-3 fill-white" />
          </div>
          <span className="font-heading font-bold text-sm sm:text-base tracking-tight text-seed whitespace-nowrap">
            Digital Dark Spot
          </span>
        </Link>

        {/* Navigation links & Theme toggle */}
        <div className="flex items-center gap-1 sm:gap-2">
          <nav className="flex items-center gap-0.5 sm:gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'px-2 sm:px-2.5 py-1.5 rounded-sm text-xs font-medium transition-colors inline-flex items-center gap-1.5',
                    isActive
                      ? 'text-seed font-semibold border-b border-rind'
                      : 'text-seed-muted hover:text-seed hover:bg-seed/5'
                  )}
                  title={link.label}
                >
                  {link.icon && <link.icon className="w-3.5 h-3.5 opacity-70 shrink-0" />}
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => setIsDark(!isDark)}
            className="p-1.5 rounded-sm text-seed-muted hover:text-seed hover:bg-seed/5 transition-colors cursor-pointer ml-1"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

