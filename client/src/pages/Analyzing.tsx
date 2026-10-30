import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Stepper } from '@/components/ui/stepper';
import { Button } from '@/components/ui/button';

export const Analyzing: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Analyzing Information Space</CardTitle>
          <CardDescription>Job ID: {id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Stepper
            activeStepIndex={1}
            steps={[
              { id: '1', label: 'Fetching', description: 'SSRF verification & text extraction' },
              { id: '2', label: 'Reading', description: 'LLM claim extraction & quote verify' },
              { id: '3', label: 'Comparing', description: 'Deterministic gap & conflict detection' },
              { id: '4', label: 'Checking dates', description: 'Temporal cycle & freshness audit' },
              { id: '5', label: 'Building checklist', description: 'Prioritized verification matrix' }
            ]}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
