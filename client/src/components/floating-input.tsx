import { cn } from "@/lib/utils";
import { useState } from "react";

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function FloatingInput({ label, className, ...props }: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  return (
    <div className="relative">
      <input
        className={cn(
          "peer w-full px-4 py-3 border rounded-xl bg-pith-card text-seed outline-none font-sans text-sm",
          "border-pith-border focus:border-rind focus:ring-2 focus:ring-rind/20 transition-all shadow-xs",
          className
        )}
        placeholder=" "
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          setFocused(false);
          setHasValue(e.target.value !== "");
        }}
        onChange={(e) => setHasValue(e.target.value !== "")}
        {...props}
      />
      <label
        className={cn(
          "absolute left-4 top-3 text-seed-muted text-sm transition-all duration-200 pointer-events-none font-medium",
          "peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-xs peer-focus:bg-pith-card peer-focus:px-1.5 peer-focus:rounded",
          "peer-focus:text-rind",
          (focused || hasValue) && "-top-2.5 left-3 text-xs bg-pith-card px-1.5 rounded text-rind font-semibold"
        )}
      >
        {label}
      </label>
    </div>
  );
}
