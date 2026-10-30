import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusTag } from '@/components/common/StatusTag';

export const GapsTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Identified Information Gaps</CardTitle>
            <StatusTag status="gap" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-seed-muted text-sm leading-relaxed">
            Attributes expected for a complete decision that were not found in any reviewed source.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
