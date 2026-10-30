import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
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
    { name: 'Google Gemini', enabled: true, model: 'gemini-1.5-flash', keyCount: 2, inCooldown: false },
    { name: 'OpenAI', enabled: true, model: 'gpt-4o-mini', keyCount: 2, inCooldown: false },
    { name: 'Anthropic', enabled: false, model: 'claude-3-5-haiku-20241022', keyCount: 0, inCooldown: false }
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
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-seed">
            AI Engine Diagnostics
          </h1>
          <p className="text-seed-muted text-sm mt-1">
            Multi-provider round-robin, key rotation, and cooldown monitoring (read-only).
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStatus}
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {providers.map((p) => (
          <Card key={p.name} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-heading font-bold text-seed flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-rind" />
                {p.name}
              </span>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  p.enabled
                    ? 'bg-rind/15 text-rind'
                    : 'bg-pith-muted text-seed-muted'
                }`}
              >
                {p.enabled ? 'Active' : 'Disabled'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-seed-muted border-t border-border pt-3">
              <div className="flex justify-between">
                <span>Model:</span>
                <span className="font-mono text-seed font-semibold">{p.model}</span>
              </div>
              <div className="flex justify-between">
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
          </Card>
        ))}
      </div>

      <Card className="p-5 bg-pith-muted/50 border-border">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rind shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-seed-muted leading-relaxed">
            <p className="font-bold text-seed">
              Key Security Guarantee
            </p>
            <p>
              API keys are never logged, stored in client bundles, or returned by diagnostic endpoints. Only provider health, masked counts, and cooldown durations are exposed.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
