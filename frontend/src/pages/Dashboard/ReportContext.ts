import { createContext, useContext } from 'react';
import { FullAnalysisReport } from '@/lib/types';

export interface ReportContextType {
  report: FullAnalysisReport;
  selectedAttribute: string | null;
  setSelectedAttribute: (attr: string | null) => void;
  refetchReport: () => Promise<void>;
}

export const ReportContext = createContext<ReportContextType | null>(null);

export function useReport(): ReportContextType {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReport must be used within a ReportContext.Provider');
  }
  return context;
}

