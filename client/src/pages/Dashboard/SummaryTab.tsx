import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusTag } from '@/components/common/StatusTag';

export const SummaryTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Information Synthesis</CardTitle>
            <StatusTag status="sourced" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-seed-muted text-sm leading-relaxed">
            Summary placeholder. Verified claims and synthesized context will render here in Step 9.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
