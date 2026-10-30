import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusTag } from '@/components/common/StatusTag';

export const ConflictsTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Possible Contradictions & Conflicts</CardTitle>
            <StatusTag status="conflict" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-seed-muted text-sm leading-relaxed">
            Inconsistent claims detected across different sources for the same attribute.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
