import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Drawer } from '@/components/ui/drawer';
import { StatusTag } from '@/components/common/StatusTag';
import { Button } from '@/components/ui/button';

export const EvidenceDrawerSubRoute: React.FC = () => {
  const { id, claimId } = useParams<{ id: string; claimId: string }>();
  const navigate = useNavigate();

  const handleClose = () => {
    // Navigate back to the report dashboard
    navigate(`/report/${id}/summary`);
  };

  return (
    <Drawer
      open={true}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      title="Evidence Verification"
      description={`Inspecting Claim ${claimId || ''}`}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <StatusTag status="sourced" />
          <span className="text-xs font-mono text-seed-muted">claim: {claimId}</span>
        </div>

        <div className="p-4 rounded-xl bg-pith-muted border border-border space-y-2">
          <span className="text-xs font-bold text-seed uppercase tracking-wider">
            Verbatim Source Excerpt
          </span>
          <blockquote className="p-3 rounded-lg bg-pith-card border-l-4 border-flesh text-sm italic text-seed">
            "Extracted verbatim claim quote will be rendered here with match highlighting."
          </blockquote>
        </div>

        <div className="space-y-1 text-xs text-seed-muted">
          <p><strong>Report:</strong> {id}</p>
          <p><strong>Verification:</strong> 100% Exact Substring Match</p>
        </div>

        <div className="pt-4 border-t border-border">
          <Button variant="rind" size="sm" className="w-full" onClick={handleClose}>
            Close Evidence
          </Button>
        </div>
      </div>
    </Drawer>
  );
};
