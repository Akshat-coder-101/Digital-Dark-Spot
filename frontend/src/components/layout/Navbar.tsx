import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SeedIcon } from '../common/Icons';
import { Sun, Moon, Sparkles, HelpCircle, Search } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const [isScrolled, setIsScrolled] = useState(false);

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
    } catch {}
    return false; // Light mode is the default canvas
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showAiStatus = (import.meta as any).env?.VITE_SHOW_AI_STATUS === 'true';

  const baseNavLinks = [
    { to: '/', label: 'Investigate', icon: Search },
    { to: '/how-it-works', label: 'How it Works', icon: HelpCircle },
  ];

  const navLinks = showAiStatus
    ? [...baseNavLinks, { to: '/settings/ai', label: 'AI Status', icon: Sparkles }]
    : baseNavLinks;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-200 border-b",
        isScrolled
          ? "border-seed/15 bg-pith/95 backdrop-blur-md shadow-xs py-0"
          : "border-seed/10 bg-pith/80 backdrop-blur-sm py-0"
      )}
    >
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 h-13 sm:h-14 flex items-center justify-between">
        {/* Brand Wordmark with small seed mark & tiny glow on logo hover */}
        <Link
          to="/"
          className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-structure-text rounded-xs shrink-0"
        >
          <div className="w-5 h-5 rounded-xs bg-structure flex items-center justify-center text-white transition-all duration-200 group-hover:scale-105 shrink-0">
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
                    'relative px-2.5 py-1.5 rounded-xs text-xs font-medium transition-colors inline-flex items-center gap-1.5 group',
                    isActive
                      ? 'text-seed font-semibold'
                      : 'text-seed-muted hover:text-seed hover:bg-seed/5'
                  )}
                  title={link.label}
                >
                  {link.icon && (
                    <motion.span
                      whileHover={shouldReduceMotion ? {} : { y: -1 }}
                      transition={{ duration: 0.15 }}
                      className="inline-flex items-center"
                    >
                      <link.icon className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" />
                    </motion.span>
                  )}
                  <span className="hidden sm:inline">{link.label}</span>

                  {/* Active indicator with shared layoutId animation (0.2s) */}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active-indicator"
                      className="absolute bottom-0 left-1 right-1 h-[2px] bg-structure-text rounded-full"
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sun / Moon crossfade on the theme toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-1.5 rounded-xs text-seed-muted hover:text-seed hover:bg-seed/5 transition-colors cursor-pointer ml-1 relative w-8 h-8 flex items-center justify-center"
            aria-label="Toggle dark and light theme"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isDark ? 'dark' : 'light'}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, rotate: -40, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, rotate: 40, scale: 0.8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="flex items-center justify-center"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-crack" />
                ) : (
                  <Moon className="w-4 h-4 text-seed" />
                )}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>
    </header>
  );
};
