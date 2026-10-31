import * as React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "soft" | "outline" | "ghost" | "danger" | "sage";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const showLoading = isLoading || loading;
    const baseStyles =
      "inline-flex items-center justify-center font-heading font-semibold rounded-full transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer active:scale-[0.98]";

    const variantStyles = {
      primary:
        "bg-[#5a4bac] text-white hover:bg-[#7364c7] shadow-sm focus-visible:ring-[#7364c7]",
      soft:
        "bg-[#ede9fe] text-[#5a4bac] hover:bg-[#e5deff] focus-visible:ring-[#7364c7]",
      sage:
        "bg-[#466557] text-white hover:bg-[#385347] shadow-sm focus-visible:ring-[#466557]",
      outline:
        "border border-[#eae6df] bg-[#ffffff] text-[#181c23] hover:bg-[#f5f4f0] shadow-xs",
      ghost:
        "bg-transparent text-[#484552] hover:bg-[#f5f4f0] hover:text-[#181c23]",
      danger:
        "bg-[#ba1a1a] text-white hover:bg-[#9a1515] shadow-sm focus-visible:ring-[#ba1a1a]",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || showLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {showLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon}
        {children}
        {!showLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
