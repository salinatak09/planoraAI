import * as React from "react";
import { Sparkles } from "lucide-react";
import type { EventType, EventStatus, TaskPriority } from "@/lib/types";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "ai"
    | "sage"
    | "peach"
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
    default: "bg-[#f1f3fe] text-[#484552] border border-[#eae6df]",
    ai: "bg-[#ede9fe] text-[#5a4bac] font-semibold",
    sage: "bg-[#e8f0ec] text-[#466557] font-semibold",
    peach: "bg-[#fde8d7] text-[#884a0f] font-semibold",
    wedding: "bg-[#ede9fe] text-[#5a4bac] border border-[#dcd6cc]",
    birthday: "bg-[#fde8d7] text-[#a66227] border border-[#ffdcc4]",
    anniversary: "bg-[#ffdcc4] text-[#884a0f] border border-[#ffb780]",
    community: "bg-[#e8f0ec] text-[#466557] border border-[#c8ead9]",
    success: "bg-[#e8f0ec] text-[#466557]",
    warning: "bg-[#fde8d7] text-[#884a0f]",
    danger: "bg-[#ffdad6] text-[#ba1a1a]",
    info: "bg-[#f1f3fe] text-[#5a4bac]",
  };

  const sizeStyles = {
    sm: "px-2.5 py-0.5 text-[11px]",
    md: "px-3 py-1 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-heading font-medium rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export function AIBadge({ label = "Planora AI", className = "" }: { label?: string; className?: string }) {
  return (
    <Badge variant="ai" size="sm" className={className}>
      <Sparkles className="w-3 h-3 text-[#5a4bac]" />
      <span>{label}</span>
    </Badge>
  );
}

export function EventTypeBadge({ type }: { type: EventType }) {
  const labels: Record<EventType, string> = {
    wedding: "Wedding Gala",
    birthday: "Birthday Celebration",
    anniversary: "Anniversary Jubilee",
    community: "Community Gathering",
  };

  return <Badge variant={type}>{labels[type] || type}</Badge>;
}

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const map: Record<
    EventStatus,
    { label: string; variant: "default" | "success" | "warning" | "info" | "danger" }
  > = {
    planning: { label: "Planning", variant: "warning" },
    confirmed: { label: "Confirmed", variant: "success" },
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
    medium: { label: "Medium", variant: "info" },
    high: { label: "High", variant: "warning" },
    urgent: { label: "Urgent", variant: "danger" },
  };

  const current = map[priority] || { label: priority, variant: "default" };
  return <Badge variant={current.variant}>{current.label}</Badge>;
}
