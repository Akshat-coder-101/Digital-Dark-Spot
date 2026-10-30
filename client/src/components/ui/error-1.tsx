import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";
import { RiHome5Fill } from "react-icons/ri";

export interface ErrorOneAction {
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
}

export interface ErrorOneProps {
  /** The HTTP error code to display prominently, e.g. "404" */
  code?: string;
  /** Bold headline beneath the error code */
  title?: string;
  /** Supporting description copy */
  description?: string;
  /** Primary call-to-action */
  action?: ErrorOneAction;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function GradientCode({ code }: { code: string }) {
  return (
    <svg
      viewBox="0 0 800 300"
      className="w-full max-w-[20rem] select-none sm:max-w-md"
      aria-hidden="true"
    >
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-rind/15 stroke-rind font-black tracking-tighter"
        style={{ fontSize: "20rem" }}
        strokeWidth="3"
        strokeDasharray="40 20"
      >
        {code}
      </text>
    </svg>
  );
}

function PillButton({ label, icon, href, onClick }: ErrorOneAction) {
  const cls =
    "h-10 rounded-full px-6 text-sm font-semibold transition-all hover:bg-rind-hover bg-rind text-white mt-4 shadow-sm inline-flex items-center gap-2 cursor-pointer";

  if (href) {
    return (
      <a href={href} className={cls}>
        {icon}
        {label}
      </a>
    );
  }

  return (
    <Button onClick={onClick} className={cls}>
      {icon}
      {label}
    </Button>
  );
}

export function ErrorOne({
  code = "404",
  title = "Potential Gap: Route Not Found",
  description = "The slice or report you requested does not exist in this session.",
  action = { label: "Return to Safe Ground", href: "/" },
}: ErrorOneProps) {
  return (
    <main className="relative flex min-h-[60vh] items-center justify-center px-6 py-12">
      <section
        aria-labelledby="error-one-title"
        className="z-10 mx-auto flex w-full max-w-lg flex-col items-center text-center space-y-4"
      >
        <GradientCode code={code} />

        <div className="space-y-2">
          <h1
            id="error-one-title"
            className="text-2xl sm:text-3xl font-heading font-extrabold text-seed tracking-tight"
          >
            {title}
          </h1>
          <p className="text-sm text-seed-muted max-w-md mx-auto">
            {description}
          </p>
        </div>

        <PillButton {...action} />
      </section>
    </main>
  );
}

export const defaultErrorOneAction: ErrorOneAction = {
  label: "Return to Home",
  href: "/",
  icon: <RiHome5Fill className="ml-1.5 text-base" aria-hidden="true" />,
};

export default ErrorOne;
