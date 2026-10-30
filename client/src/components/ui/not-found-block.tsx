import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { useNavigate } from 'react-router-dom';
import { CrackIcon } from '../common/Icons';

interface NotFoundBlockProps {
  className?: string;
}

export const NotFoundBlock: React.FC<NotFoundBlockProps> = ({ className }) => {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16",
        className
      )}
    >
      <div className="relative mb-6">
        {/* Visual melon icon with a crack */}
        <div className="w-24 h-24 rounded-full bg-rind/15 flex items-center justify-center border-2 border-rind/30">
          <CrackIcon className="w-12 h-12 text-crack" />
        </div>
      </div>

      <span className="text-xs font-mono font-semibold uppercase tracking-widest text-seed-muted mb-2">
        Error 404 • Missing Slice
      </span>
      <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-seed mb-3">
        Information Not Found
      </h1>
      <p className="text-sm md:text-base text-seed-muted max-w-md mb-8 leading-relaxed">
        The page or report you are looking for has fallen into a digital dark spot or does not exist.
      </p>

      <Button
        variant="rind"
        size="lg"
        onClick={() => navigate('/')}
      >
        Return to Home
      </Button>
    </div>
  );
};

