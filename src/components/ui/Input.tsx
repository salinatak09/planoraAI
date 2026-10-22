import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, helperText, leftIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-heading font-semibold text-[#181c23]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <span className="absolute left-3.5 text-[#797583] pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`h-11 w-full rounded-full border bg-white px-4 py-2 text-sm text-[#181c23] placeholder:text-[#797583] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20 focus:border-[#5a4bac] disabled:cursor-not-allowed disabled:opacity-50 transition-all ${
              leftIcon ? "pl-10" : ""
            } ${
              error
                ? "border-[#ba1a1a] focus:ring-[#ba1a1a]/20"
                : "border-[#eae6df] hover:border-[#c9c4d4]"
            } ${className}`}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-[#ba1a1a]">{error}</span>}
        {!error && helperText && (
          <span className="text-xs text-[#686e77]">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
