import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusTag } from '@/components/common/StatusTag';

export const SourcesTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Reviewed Sources</CardTitle>
            <StatusTag status="sourced" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-seed-muted text-sm leading-relaxed">
            All ingested URLs, pasted texts, extracted metadata, and fetch statuses.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
