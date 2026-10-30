import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, ShieldAlert, Cpu } from 'lucide-react';

interface ProviderStatus {
  name: string;
  enabled: boolean;
  model: string;
  keyCount: number;
  inCooldown: boolean;
  cooldownSecondsRemaining?: number;
}

export const SettingsAi: React.FC = () => {
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
      // Mock / fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-seed/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-rind/10 text-rind text-xs font-sans font-medium mb-2">
            <span>Diagnostics & health</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-seed tracking-tight">
            AI Engine Diagnostics
          </h1>
          <p className="text-seed-muted text-xs sm:text-sm mt-1">
            Multi-provider round-robin, key rotation, and cooldown monitoring (server-side isolated).
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStatus}
          disabled={loading}
          className="text-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {providers.map((p) => (
          <div key={p.name} className="p-5 rounded-sm border border-seed/10 bg-pith space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-seed/10">
              <span className="font-heading font-bold text-seed flex items-center gap-1.5 text-sm">
                <Cpu className="w-4 h-4 text-rind" />
                {p.name}
              </span>
              <span
                className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.2 rounded-xs ${
                  p.enabled
                    ? 'bg-rind/10 text-rind border border-rind/20'
                    : 'bg-seed/5 text-seed-muted border border-seed/10'
                }`}
              >
                {p.enabled ? 'Active' : 'Disabled'}
              </span>
            </div>

            <div className="space-y-2 text-xs text-seed-muted font-mono">
              <div className="flex justify-between items-center">
                <span>Model:</span>
                <span className="text-seed font-semibold truncate max-w-[150px]">{p.model}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Configured Keys:</span>
                <span className="text-seed font-semibold">{p.keyCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Cooldown State:</span>
                <span
                  className={`font-semibold ${
                    p.inCooldown ? 'text-crack' : 'text-rind'
                  }`}
                >
                  {p.inCooldown ? 'Cooldown active' : 'Ready'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Key Security Guarantee */}
      <div className="p-5 rounded-sm border border-seed/10 border-l-2 border-l-rind bg-seed/[0.01]">
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
      </div>
    </div>
  );
};
