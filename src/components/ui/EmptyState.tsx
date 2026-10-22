import * as React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center rounded-2xl border border-dashed border-[#eae6df] bg-[#ffffff] shadow-xs">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ede9fe] text-[#5a4bac] mb-3">
        {icon || <Sparkles className="h-6 w-6" />}
      </div>
      <h4 className="text-sm font-heading font-bold text-[#181c23] mb-1">
        {title}
      </h4>
      <p className="text-xs text-[#686e77] max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
