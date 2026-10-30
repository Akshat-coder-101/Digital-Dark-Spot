import React from 'react';
import { ErrorOne } from '@/components/ui/error-1';

export const NotFound: React.FC = () => {
  return (
    <ErrorOne
      code="404"
      title="Potential Gap: Route Not Found"
      description="The page, report, or slice you requested could not be located in the current session."
      action={{
        label: "Return to Home",
        href: "/"
      }}
    />
  );
};

