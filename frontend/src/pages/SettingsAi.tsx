import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, ShieldAlert, Cpu } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

interface ProviderStatus {
  name: string;
  enabled: boolean;
  model: string;
  keyCount: number;
  inCooldown: boolean;
  cooldownSecondsRemaining?: number;
}

export const SettingsAi: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();
  const [providers, setProviders] = useState<ProviderStatus[]>([
    { name: 'Google Gemini', enabled: true, model: 'gemini-3-flash-preview', keyCount: 2, inCooldown: false },
    { name: 'Groq (Ultra-Fast Failover)', enabled: true, model: 'qwen/qwen3.8-27b', keyCount: 1, inCooldown: false },
    { name: 'OpenAI (Fallback)', enabled: false, model: 'gpt-4o-mini', keyCount: 0, inCooldown: false }
  ]);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/llm/status');
      if (res.ok) {
        const data = await res.json();
        if (data.providers) {
          setProviders(data.providers);
        }
      }
    } catch {
      // Offline fallback state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-seed/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-rind/10 text-rind text-xs font-sans font-medium mb-2">
            <span>Diagnostics & health</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-seed tracking-tight">
            AI Engine Diagnostics
          </h1>
          <p className="text-seed-muted text-xs sm:text-sm mt-1">
            Calm status monitoring for multi-provider round-robin, key rotation, and isolated server cooldowns.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStatus}
          disabled={loading}
          className="text-xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* Provider Status Cards with Staggered Entrance and Calm Indicator Dots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {providers.map((p, idx) => (
          <motion.div
            key={p.name}
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.35,
              delay: shouldReduceMotion ? 0 : idx * 0.08,
              ease: 'easeOut'
            }}
            className="p-5 rounded-xs border border-seed/10 bg-pith hover:border-seed/25 hover:bg-seed/[0.015] transition-all duration-200 space-y-4 shadow-xs"
          >
            {/* Provider Title & Active/Disabled Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-seed/10">
              <span className="font-heading font-bold text-seed flex items-center gap-1.5 text-xs sm:text-sm">
                <Cpu className="w-4 h-4 text-rind shrink-0" />
                <span className="truncate">{p.name}</span>
              </span>

              {/* Status indicator: Soft green pulse for Active, Muted dot for Disabled */}
              <div className="flex items-center gap-1.5 text-[11px] font-sans">
                {p.enabled ? (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-rind/10 border border-rind/20 text-rind">
                    <span className="relative flex h-2 w-2">
                      {!shouldReduceMotion && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rind opacity-75" />
                      )}
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rind" />
                    </span>
                    <span className="font-semibold text-[10px]">Active</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-seed/5 border border-seed/10 text-seed-muted">
                    <span className="inline-block h-2 w-2 rounded-full bg-seed-muted/40" />
                    <span className="text-[10px]">Disabled</span>
                  </div>
                )}
              </div>
            </div>

            {/* Parameter Rows */}
            <div className="space-y-2 text-xs text-seed-muted font-sans">
              <div className="flex justify-between items-center">
                <span>Model</span>
                <span className="font-mono text-seed font-medium truncate max-w-[150px]">{p.model}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Configured Keys</span>
                <span className="font-mono text-seed font-medium">{p.keyCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Cooldown State</span>
                <span
                  className={`font-sans text-[11px] font-medium ${
                    p.inCooldown ? 'text-crack' : 'text-rind'
                  }`}
                >
                  {p.inCooldown ? 'Cooldown active' : 'Ready'}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Key Security Guarantee */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35, delay: 0.25 }}
        className="p-5 rounded-xs border border-seed/10 border-l-2 border-l-rind bg-seed/[0.01]"
      >
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rind shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-seed-muted leading-relaxed">
            <p className="font-bold text-seed font-heading">
              Key Security Guarantee
            </p>
            <p>
              API keys are never logged, stored in client bundles, or returned by diagnostic endpoints. Only provider health, masked counts, and cooldown durations are exposed. All model calls execute strictly on the Node.js backend.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
