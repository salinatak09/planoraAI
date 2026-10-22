import * as React from "react";
import type { EventType, EventStatus, TaskPriority } from "@/lib/types";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "wedding"
    | "birthday"
    | "anniversary"
    | "community"
    | "success"
    | "warning"
    | "danger"
    | "info";
  size?: "sm" | "md";
}

export function Badge({
  className = "",
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
    wedding:
      "bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/50",
    birthday:
      "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50",
    anniversary:
      "bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/50",
    community:
      "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50",
    success:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
    warning:
      "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
    danger:
      "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export function EventTypeBadge({ type }: { type: EventType }) {
  const labels: Record<EventType, string> = {
    wedding: "Wedding",
    birthday: "Birthday",
    anniversary: "Anniversary",
    community: "Community",
  };

  return <Badge variant={type}>{labels[type]}</Badge>;
}

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const map: Record<
    EventStatus,
    { label: string; variant: "default" | "success" | "warning" | "info" | "danger" }
  > = {
    planning: { label: "Planning", variant: "warning" },
    confirmed: { label: "Confirmed", variant: "info" },
    in_progress: { label: "In Progress", variant: "info" },
    completed: { label: "Completed", variant: "success" },
    cancelled: { label: "Cancelled", variant: "danger" },
  };

  const current = map[status] || { label: status, variant: "default" };
  return <Badge variant={current.variant}>{current.label}</Badge>;
}

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  const map: Record<
    TaskPriority,
    { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }
  > = {
    low: { label: "Low", variant: "default" },
    medium: { label: "Medium", variant: "info" as const },
    high: { label: "High", variant: "warning" },
    urgent: { label: "Urgent", variant: "danger" },
  };

  const current = map[priority] || { label: priority, variant: "default" };
  return <Badge variant={current.variant}>{current.label}</Badge>;
}
