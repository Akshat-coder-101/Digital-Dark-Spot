import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusTag } from '@/components/common/StatusTag';

export const ChecklistTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Next-Step Verification Checklist</CardTitle>
            <StatusTag status="ai_suggested" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-seed-muted text-sm leading-relaxed">
            Prioritized verification items generated to close information gaps and resolve ambiguities.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
