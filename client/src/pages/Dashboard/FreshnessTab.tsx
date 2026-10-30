import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusTag } from '@/components/common/StatusTag';

export const FreshnessTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Temporal & Freshness Warnings</CardTitle>
            <StatusTag status="stale" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-seed-muted text-sm leading-relaxed">
            Sources flagged as undated, older than 18 months, or belonging to earlier cycles.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
