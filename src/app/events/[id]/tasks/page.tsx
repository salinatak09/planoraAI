"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  CheckCircle2,
  Sparkles,
  Calendar,
  ListFilter,
  Pencil,
  Trash2,
  Clock,
  AlertCircle,
  RotateCcw,
  ShieldAlert,
  HelpCircle,
  Tag,
  User,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EventWorkspaceHeader } from "@/components/events/EventWorkspaceHeader";
import { Button } from "@/components/ui/Button";
import { Badge, TaskPriorityBadge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { isTaskOverdue, isTaskUpcoming, type GeneratedChecklistTask } from "@/lib/domain/tasks";
import type { TaskPriority, TaskStatus, EventType, EventStatus } from "@/lib/types";

interface PersistedTask {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EventMetadata {
  id: string;
  title: string;
  type: EventType;
  status: EventStatus;
  date: string;
  timezone: string;
  location: string;
  guestCount: number;
  totalBudget: number;
  currency: string;
}

const CATEGORY_OPTIONS = [
  "Venue",
  "Catering",
  "Decor",
  "Photography",
  "Entertainment",
  "Permits",
  "Logistics",
  "Favors",
  "Attire",
  "Safety",
  "General",
];

export default function EventTasksPage() {
  const params = useParams();
  const eventId = (params?.id as string) || "evt-aarav-meera";

  const [event, setEvent] = React.useState<EventMetadata | null>(null);
  const [tasks, setTasks] = React.useState<PersistedTask[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  // View & Filter States
  const [activeView, setActiveView] = React.useState<"checklist" | "timeline">("checklist");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [filterPriority, setFilterPriority] = React.useState<string>("all");

  // Add Task Modal
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [addForm, setAddForm] = React.useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium" as TaskPriority,
    status: "pending" as TaskStatus,
    assignedTo: "",
    category: "Venue",
  });
  const [isSubmittingAdd, setIsSubmittingAdd] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);

  // Edit Task Modal
  const [editingTask, setEditingTask] = React.useState<PersistedTask | null>(null);
  const [editForm, setEditForm] = React.useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium" as TaskPriority,
    status: "pending" as TaskStatus,
    assignedTo: "",
    category: "Venue",
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  // Delete Task Modal
  const [deletingTask, setDeletingTask] = React.useState<PersistedTask | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Checklist Generator Modal
  const [showGenerateModal, setShowGenerateModal] = React.useState(false);
  const [generatedPreview, setGeneratedPreview] = React.useState<GeneratedChecklistTask[]>([]);
  const [isLoadingGen, setIsLoadingGen] = React.useState(false);
  const [isApplyingGen, setIsApplyingGen] = React.useState(false);
  const [genSuccessMsg, setGenSuccessMsg] = React.useState<string | null>(null);

  // Process Raw API Task Response
  const handleTaskResponse = React.useCallback(
    (data: { event?: Record<string, unknown>; tasks: Record<string, unknown>[] }) => {
      if (data.event) {
        setEvent({
          id: (data.event.id as string) || eventId,
          title: (data.event.title as string) || "Event Workspace",
          type: (data.event.type as EventType) || "wedding",
          status: (data.event.status as EventStatus) || "planning",
          date: (data.event.date as string) || "2026-12-14",
          timezone: (data.event.timezone as string) || "Asia/Kolkata",
          location: (data.event.location as string) || "Venue Pending",
          guestCount: Number(data.event.guestCount || 100),
          totalBudget: Number(data.event.totalBudget || 0),
          currency: (data.event.currency as string) || "₹",
        });
      }

      const parsedTasks: PersistedTask[] = data.tasks.map((t) => ({
        id: (t._id || t.id) as string,
        _id: (t._id || t.id) as string,
        title: (t.title as string) || "Untitled Task",
        description: (t.description as string) || "",
        dueDate: (t.dueDate as string) || "",
        priority: (t.priority as TaskPriority) || "medium",
        status: (t.status as TaskStatus) || "pending",
        assignedTo: (t.assignedTo as string) || "",
        category: (t.category as string) || "General",
        createdAt: (t.createdAt as string) || "",
        updatedAt: (t.updatedAt as string) || "",
      }));

      setTasks(parsedTasks);
    },
    [eventId]
  );

  // Initial Data Load
  React.useEffect(() => {
    let isMounted = true;
    async function fetchInitial() {
      try {
        const res = await fetch(`/api/events/${eventId}/tasks`);
        const data = await res.json();
        if (!isMounted) return;

        if (!res.ok) {
          if (eventId === "evt-aarav-meera") {
            // Demo fallback
            setEvent({
              id: "evt-aarav-meera",
              title: "Aarav & Meera Wedding Celebration",
              type: "wedding",
              status: "confirmed",
              date: "2026-12-14",
              timezone: "Asia/Kolkata",
              location: "Jaipur Royal Palace & Grounds, Rajasthan",
              guestCount: 350,
              totalBudget: 3850000,
              currency: "₹",
            });
            setTasks([
              { id: "t-1", title: "Finalize menu tasting with Royal Saffron head chef", description: "Multi-course banquet tasting for 350 guests", category: "Catering", priority: "urgent", status: "completed", dueDate: "2026-11-02", assignedTo: "Priya Sharma" },
              { id: "t-2", title: "Submit sound clearance permit to Jaipur Police Headquarters", description: "Outdoor acoustic curfew exemption", category: "Permits", priority: "urgent", status: "in_progress", dueDate: "2026-11-06", assignedTo: "Aditya Verma" },
              { id: "t-3", title: "Approve floral mandap canopy and brass lighting mockups", description: "Royal Amber Palette preview", category: "Decor", priority: "high", status: "in_progress", dueDate: "2026-11-12", assignedTo: "Priya Sharma" },
              { id: "t-4", title: "Confirm guest hospitality coach logistics from Jaipur Airport", description: "Airport arrival manifests and shuttles", category: "Logistics", priority: "high", status: "pending", dueDate: "2026-11-18", assignedTo: "Rohit Das" },
              { id: "t-5", title: "Order artisan marigold seed favor boxes", description: "Eco-friendly keepsake gifts for guests", category: "Favors", priority: "medium", status: "pending", dueDate: "2026-11-25", assignedTo: "Sneha Kapur" },
              { id: "t-6", title: "Finalize rehearsal choreography schedule for Sangeet", description: "Run-through with DJ and folk artists", category: "Entertainment", priority: "medium", status: "completed", dueDate: "2026-11-30", assignedTo: "Meera & Aarav" },
            ]);
            return;
          }
          setFetchError(data?.error?.message || "Failed to load tasks");
        } else {
          handleTaskResponse(data.data);
        }
      } catch (err: unknown) {
        if (isMounted) setFetchError(err instanceof Error ? err.message : "Error connecting to tasks service");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchInitial();
    return () => {
      isMounted = false;
    };
  }, [eventId, handleTaskResponse]);

  // Refresh Tasks
  const refreshTasks = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/tasks`);
      const data = await res.json();
      if (res.ok) {
        handleTaskResponse(data.data);
      }
    } catch {
      // background
    }
  }, [eventId, handleTaskResponse]);

  // Toggle Task Completion / Reopen
  async function handleToggleTaskStatus(task: PersistedTask) {
    const nextStatus: TaskStatus = task.status === "completed" ? "pending" : "completed";
    const taskId = task._id || task.id;

    if (eventId === "evt-aarav-meera") {
      setTasks((prev) =>
        prev.map((t) => ((t._id || t.id) === taskId ? { ...t, status: nextStatus } : t))
      );
      return;
    }

    try {
      const res = await fetch(`/api/events/${eventId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        await refreshTasks();
      }
    } catch {
      // Revert if error
    }
  }

  // Handle Add Task
  async function handleAddTaskSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmittingAdd(true);
    setAddError(null);

    const payload = {
      title: addForm.title.trim(),
      description: addForm.description.trim() || undefined,
      dueDate: addForm.dueDate,
      priority: addForm.priority,
      status: addForm.status,
      assignedTo: addForm.assignedTo.trim() || undefined,
      category: addForm.category,
    };

    try {
      if (eventId === "evt-aarav-meera") {
        const newTask: PersistedTask = {
          id: `t-${Date.now()}`,
          ...payload,
        };
        setTasks((prev) => [newTask, ...prev]);
        setShowAddModal(false);
        setAddForm({
          title: "",
          description: "",
          dueDate: "",
          priority: "medium",
          status: "pending",
          assignedTo: "",
          category: "Venue",
        });
        setIsSubmittingAdd(false);
        return;
      }

      const res = await fetch(`/api/events/${eventId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to create task");
      }

      await refreshTasks();
      setShowAddModal(false);
      setAddForm({
        title: "",
        description: "",
        dueDate: "",
        priority: "medium",
        status: "pending",
        assignedTo: "",
        category: "Venue",
      });
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "Error creating task");
    } finally {
      setIsSubmittingAdd(false);
    }
  }

  // Open Edit Modal
  function handleOpenEdit(task: PersistedTask) {
    setEditingTask(task);
    setEditError(null);
    setEditForm({
      title: task.title,
      description: task.description || "",
      dueDate: task.dueDate,
      priority: task.priority,
      status: task.status,
      assignedTo: task.assignedTo || "",
      category: task.category || "Venue",
    });
  }

  // Handle Edit Submit
  async function handleEditTaskSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTask) return;
    setIsSubmittingEdit(true);
    setEditError(null);

    const taskId = editingTask._id || editingTask.id;
    const payload = {
      title: editForm.title.trim(),
      description: editForm.description.trim() || undefined,
      dueDate: editForm.dueDate,
      priority: editForm.priority,
      status: editForm.status,
      assignedTo: editForm.assignedTo.trim() || undefined,
      category: editForm.category,
    };

    try {
      if (eventId === "evt-aarav-meera") {
        setTasks((prev) =>
          prev.map((t) => ((t._id || t.id) === taskId ? { ...t, ...payload } : t))
        );
        setEditingTask(null);
        setIsSubmittingEdit(false);
        return;
      }

      const res = await fetch(`/api/events/${eventId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to update task");
      }

      await refreshTasks();
      setEditingTask(null);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Error updating task");
    } finally {
      setIsSubmittingEdit(false);
    }
  }

  // Handle Delete Confirm
  async function handleDeleteConfirm() {
    if (!deletingTask) return;
    setIsDeleting(true);

    const taskId = deletingTask._id || deletingTask.id;

    try {
      if (eventId === "evt-aarav-meera") {
        setTasks((prev) => prev.filter((t) => (t._id || t.id) !== taskId));
        setDeletingTask(null);
        setIsDeleting(false);
        return;
      }

      const res = await fetch(`/api/events/${eventId}/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete task");
      }

      await refreshTasks();
      setDeletingTask(null);
    } catch {
      alert("Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  }

  // Open Generate Checklist Modal
  async function handleOpenGenerateChecklist() {
    setShowGenerateModal(true);
    setIsLoadingGen(true);
    setGenSuccessMsg(null);

    try {
      const res = await fetch(`/api/events/${eventId}/tasks/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apply: false }),
      });
      const data = await res.json();
      if (res.ok && data?.data?.tasks) {
        setGeneratedPreview(data.data.tasks);
      }
    } catch {
      // fallback
    } finally {
      setIsLoadingGen(false);
    }
  }

  // Apply Generated Checklist
  async function handleApplyChecklist() {
    setIsApplyingGen(true);

    try {
      if (eventId === "evt-aarav-meera") {
        const newTasks: PersistedTask[] = generatedPreview.map((t, idx) => ({
          id: `t-gen-${Date.now()}-${idx}`,
          title: t.title,
          description: t.description,
          dueDate: t.dueDate,
          priority: t.priority,
          status: "pending", // Strict requirement
          category: t.category,
          assignedTo: t.assignedTo,
        }));
        setTasks((prev) => [...prev, ...newTasks]);
        setGenSuccessMsg("Checklist added to your event tasks (all marked Pending)!");
        setTimeout(() => setShowGenerateModal(false), 1200);
        return;
      }

      const res = await fetch(`/api/events/${eventId}/tasks/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apply: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to apply checklist");
      }

      await refreshTasks();
      setGenSuccessMsg("Checklist added to your event tasks (all marked Pending)!");
      setTimeout(() => setShowGenerateModal(false), 1200);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to apply checklist");
    } finally {
      setIsApplyingGen(false);
    }
  }

  // Days remaining until event
  let daysRemaining = 0;
  if (event?.date) {
    try {
      const target = new Date(event.date);
      const now = new Date();
      const diffMs = target.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    } catch {
      daysRemaining = 0;
    }
  }

  // Metrics
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.status === "completed").length;
  const overdueTasks = tasks.filter((t) => isTaskOverdue(t.dueDate, t.status));
  const upcomingDeadlines = tasks.filter((t) => isTaskUpcoming(t.dueDate, t.status, 14));
  const completionPercentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Filtered Tasks
  const filteredTasks = React.useMemo(() => {
    return tasks.filter((t) => {
      // Status filter
      if (filterStatus === "completed" && t.status !== "completed") return false;
      if (filterStatus === "pending" && t.status !== "pending") return false;
      if (filterStatus === "in_progress" && t.status !== "in_progress") return false;
      if (filterStatus === "overdue" && !isTaskOverdue(t.dueDate, t.status)) return false;

      // Priority filter
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;

      return true;
    });
  }, [tasks, filterStatus, filterPriority]);

  // Chronological Grouping for Timeline / Calendar View
  const timelineGroups = React.useMemo(() => {
    const groups = new Map<string, PersistedTask[]>();
    // Sort tasks by dueDate ascending
    const sorted = [...filteredTasks].sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1));

    sorted.forEach((task) => {
      const dateKey = task.dueDate || "Unscheduled";
      const existing = groups.get(dateKey) || [];
      existing.push(task);
      groups.set(dateKey, existing);
    });

    return Array.from(groups.entries()).map(([dateStr, items]) => ({
      dateStr,
      items,
    }));
  }, [filteredTasks]);

  if (isLoading) {
    return (
      <AppShell activeEventTitle="Loading Tasks..." activeEventLocation="Synchronizing" eventId={eventId}>
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-28 bg-white rounded-3xl border border-[#eae6df] p-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-white rounded-3xl border border-[#eae6df]" />
            ))}
          </div>
          <div className="h-96 bg-white rounded-3xl border border-[#eae6df]" />
        </div>
      </AppShell>
    );
  }

  if (fetchError && !event) {
    return (
      <AppShell activeEventTitle="Error" activeEventLocation="" eventId={eventId}>
        <div className="max-w-xl mx-auto py-16 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-[#ba1a1a] mx-auto" />
          <h2 className="text-xl font-heading font-bold text-[#181c23]">Unable to load event tasks</h2>
          <p className="text-sm text-[#797583]">{fetchError}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      activeEventTitle={event?.title || "Event Workspace"}
      activeEventLocation={event?.location || "Jaipur, Dec 2026"}
      eventId={eventId}
    >
      <div className="space-y-6">
        {event && (
          <EventWorkspaceHeader
            id={eventId}
            title={event.title}
            type={event.type}
            status={event.status}
            date={event.date}
            daysRemaining={daysRemaining}
            location={event.location}
            guestCount={event.guestCount}
            budgetTotal={event.totalBudget}
            currency={event.currency || "₹"}
          />
        )}

        {/* 4 Task Health KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <span className="text-xs font-heading font-semibold text-[#797583]">Completion Progress</span>
            <div className="text-2xl font-heading font-extrabold text-[#181c23] mt-1">
              {completionPercentage}%
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-[#797583]">
              <span>{completedTasksCount} completed</span>
              <span>{totalTasksCount} total</span>
            </div>
            <div className="w-full bg-[#f0eee9] h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-[#466557] rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-semibold text-[#797583]">Overdue Deadlines</span>
              {overdueTasks.length > 0 && (
                <span className="text-[10px] bg-rose-100 text-[#ba1a1a] font-bold px-1.5 py-0.5 rounded-full">
                  Action Required
                </span>
              )}
            </div>
            <div
              className={`text-2xl font-heading font-extrabold mt-1 ${
                overdueTasks.length > 0 ? "text-[#ba1a1a]" : "text-[#181c23]"
              }`}
            >
              {overdueTasks.length}
            </div>
            <p className="text-[11px] text-[#797583] mt-2">
              {overdueTasks.length > 0 ? "Tasks past scheduled due date" : "All deliverables on schedule"}
            </p>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-heading font-semibold text-[#797583]">Upcoming in 14 Days</span>
            <div className="text-2xl font-heading font-extrabold text-[#884a0f] mt-1">
              {upcomingDeadlines.length}
            </div>
            <p className="text-[11px] text-[#797583] mt-2">Milestones approaching soon</p>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-heading font-semibold text-[#797583]">Event Target Countdown</span>
            <div className="text-2xl font-heading font-extrabold text-[#5a4bac] mt-1">
              {daysRemaining} Days
            </div>
            <p className="text-[11px] text-[#797583] mt-2">
              Timezone: {event?.timezone || "Asia/Kolkata"}
            </p>
          </Card>
        </div>

        {/* Action Bar & View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* View Toggle Tabs */}
          <div className="flex items-center p-1 bg-[#f0eee9] rounded-2xl w-fit">
            <button
              onClick={() => setActiveView("checklist")}
              className={`px-4 py-1.5 text-xs font-heading font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === "checklist"
                  ? "bg-white text-[#181c23] shadow-xs"
                  : "text-[#797583] hover:text-[#181c23]"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Checklist View</span>
            </button>
            <button
              onClick={() => setActiveView("timeline")}
              className={`px-4 py-1.5 text-xs font-heading font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === "timeline"
                  ? "bg-white text-[#181c23] shadow-xs"
                  : "text-[#797583] hover:text-[#181c23]"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Timeline / Calendar</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenGenerateChecklist}
              className="px-3.5 py-2 rounded-full border border-[#7364c7]/30 bg-[#7364c7]/10 text-xs font-heading font-bold text-[#5a4bac] hover:bg-[#7364c7]/20 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#5a4bac]" />
              <span>Generate Event Checklist</span>
            </button>
            <Button
              size="sm"
              onClick={() => {
                setAddError(null);
                setAddForm({
                  title: "",
                  description: "",
                  dueDate: event?.date || "2026-12-01",
                  priority: "medium",
                  status: "pending",
                  assignedTo: "",
                  category: "Venue",
                });
                setShowAddModal(true);
              }}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Task
            </Button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-2xl border border-[#eae6df] shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs text-[#797583] font-heading font-medium">
            <ListFilter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { key: "all", label: `All (${tasks.length})` },
              { key: "pending", label: "Pending" },
              { key: "in_progress", label: "In Progress" },
              { key: "completed", label: `Completed (${completedTasksCount})` },
              { key: "overdue", label: `Overdue (${overdueTasks.length})` },
            ].map((st) => (
              <button
                key={st.key}
                onClick={() => setFilterStatus(st.key)}
                className={`px-2.5 py-1 rounded-full text-xs font-heading font-semibold transition-colors cursor-pointer ${
                  filterStatus === st.key
                    ? "bg-[#181c23] text-white"
                    : "bg-[#faf9f6] text-[#797583] hover:bg-[#eae6df]"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-[#eae6df] hidden sm:block" />

          {/* Priority Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-[#797583]">Priority:</span>
            {["all", "urgent", "high", "medium", "low"].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-heading font-semibold capitalize transition-colors cursor-pointer ${
                  filterPriority === p
                    ? "bg-[#5a4bac] text-white"
                    : "bg-[#faf9f6] text-[#797583] hover:bg-[#eae6df]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode 1: Checklist View */}
        {activeView === "checklist" && (
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-heading font-bold text-[#181c23]">
                  Actionable Event Checklist
                </CardTitle>
                <CardDescription>
                  Milestone execution tracking with authoritative due dates
                </CardDescription>
              </div>
              <span className="text-xs text-[#797583] font-semibold">
                {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
              </span>
            </CardHeader>
            <CardContent className="p-0">
              {filteredTasks.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[#797583] mx-auto opacity-50" />
                  <p className="text-xs text-[#797583] font-medium">No tasks found matching these filters.</p>
                  <Button size="sm" variant="outline" onClick={() => setShowAddModal(true)}>
                    Create First Task
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-[#f5f4f0]">
                  {filteredTasks.map((task) => {
                    const isOverdue = isTaskOverdue(task.dueDate, task.status);
                    const isCompleted = task.status === "completed";

                    return (
                      <div
                        key={task._id || task.id}
                        className={`p-4 hover:bg-[#faf9f6]/70 transition-colors flex items-start justify-between gap-4 ${
                          isCompleted ? "opacity-75 bg-[#faf9f6]/40" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {/* Toggle Checkbox */}
                          <button
                            onClick={() => handleToggleTaskStatus(task)}
                            className="mt-0.5 text-[#797583] hover:text-[#466557] transition-colors cursor-pointer shrink-0"
                            title={isCompleted ? "Reopen task" : "Mark as completed"}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-[#466557] fill-[#e8f0ec]" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-[#d0cbbf] hover:border-[#466557] transition-colors" />
                            )}
                          </button>

                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4
                                className={`text-xs font-heading font-bold text-[#181c23] ${
                                  isCompleted ? "line-through text-[#797583]" : ""
                                }`}
                              >
                                {task.title}
                              </h4>
                              <TaskPriorityBadge priority={task.priority} size="sm" />
                              {task.category && (
                                <Badge variant="default" size="sm">
                                  {task.category}
                                </Badge>
                              )}
                              {isOverdue && (
                                <Badge variant="danger" size="sm">
                                  Overdue
                                </Badge>
                              )}
                              {task.status === "in_progress" && (
                                <Badge variant="warning" size="sm">
                                  In Progress
                                </Badge>
                              )}
                            </div>

                            {task.description && (
                              <p className="text-[11px] text-[#484552] line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#797583] pt-0.5">
                              <span className="flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3 text-[#797583]" />
                                Due: {task.dueDate || "No deadline"}
                              </span>
                              {task.assignedTo && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3 text-[#797583]" />
                                  Assignee: {task.assignedTo}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleToggleTaskStatus(task)}
                            className="p-1.5 rounded-lg text-[#797583] hover:text-[#5a4bac] hover:bg-[#faf9f6] transition-colors cursor-pointer text-xs"
                            title={isCompleted ? "Reopen Task" : "Complete Task"}
                          >
                            {isCompleted ? (
                              <RotateCcw className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(task)}
                            className="p-1.5 rounded-lg text-[#797583] hover:text-[#5a4bac] hover:bg-[#faf9f6] transition-colors cursor-pointer"
                            title="Edit Task"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingTask(task)}
                            className="p-1.5 rounded-lg text-[#797583] hover:text-[#ba1a1a] hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* View Mode 2: Timeline / Calendar View */}
        {activeView === "timeline" && (
          <div className="space-y-6">
            {/* Event Day Anchor Card */}
            <div className="rounded-3xl border border-[#7364c7]/30 bg-gradient-to-r from-[#ede9fe] to-[#f5f4f0] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#5a4bac]">
                  Target Milestone Anchor
                </span>
                <h3 className="text-base font-heading font-bold text-[#181c23]">
                  {event?.title} — Official Event Date
                </h3>
                <p className="text-xs text-[#484552]">
                  Scheduled for {event?.date} ({event?.timezone || "Asia/Kolkata"}). All milestone deadlines lead to this date.
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-heading font-extrabold text-[#5a4bac]">
                  T-{daysRemaining} Days
                </span>
              </div>
            </div>

            {/* Timeline Stream */}
            <div className="space-y-6">
              {timelineGroups.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#eae6df] p-12 text-center text-xs text-[#797583]">
                  No scheduled timeline tasks found.
                </div>
              ) : (
                timelineGroups.map((group) => (
                  <div key={group.dateStr} className="space-y-2">
                    {/* Date Heading */}
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#5a4bac]" />
                      <h4 className="text-xs font-heading font-extrabold text-[#181c23]">
                        {group.dateStr}
                      </h4>
                      <span className="text-[11px] text-[#797583]">
                        ({group.items.length} {group.items.length === 1 ? "deliverable" : "deliverables"})
                      </span>
                    </div>

                    {/* Task Cards in this date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 border-l-2 border-[#eae6df] ml-1">
                      {group.items.map((task) => {
                        const isOverdue = isTaskOverdue(task.dueDate, task.status);
                        const isCompleted = task.status === "completed";

                        return (
                          <div
                            key={task._id || task.id}
                            className={`p-4 rounded-2xl border bg-white shadow-2xs space-y-2 transition-all ${
                              isCompleted
                                ? "border-[#e8f0ec] bg-[#faf9f6]/50"
                                : isOverdue
                                ? "border-rose-200"
                                : "border-[#eae6df] hover:border-[#7364c7]/40"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h5
                                className={`text-xs font-heading font-bold text-[#181c23] ${
                                  isCompleted ? "line-through text-[#797583]" : ""
                                }`}
                              >
                                {task.title}
                              </h5>
                              <TaskPriorityBadge priority={task.priority} size="sm" />
                            </div>

                            {task.description && (
                              <p className="text-[11px] text-[#484552] line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-[#f5f4f0] text-[10px]">
                              <span className="text-[#797583] flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {task.category || "General"}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleToggleTaskStatus(task)}
                                  className="text-[11px] font-semibold text-[#5a4bac] hover:underline cursor-pointer"
                                >
                                  {isCompleted ? "Reopen" : "Mark Done"}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Add Task Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#eae6df] space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b pb-3 border-[#eae6df]">
                <div>
                  <h3 className="font-heading font-bold text-base text-[#181c23]">
                    Add Timeline Task
                  </h3>
                  <p className="text-xs text-[#797583]">Record an actionable deliverable</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-[#797583] hover:text-[#181c23] text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {addError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                  {addError}
                </div>
              )}

              <form onSubmit={handleAddTaskSubmit} className="space-y-4">
                <Input
                  label="Task Title"
                  placeholder="e.g. Confirm guest hospitality coach logistics"
                  value={addForm.title}
                  onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                  required
                />

                <Input
                  label="Description / Execution Notes (Optional)"
                  placeholder="e.g. Coordinate airport arrival manifests and coach pickup"
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Due Date (YYYY-MM-DD)"
                    type="date"
                    value={addForm.dueDate}
                    onChange={(e) => setAddForm({ ...addForm, dueDate: e.target.value })}
                    required
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-heading font-semibold text-[#181c23]">
                      Priority
                    </label>
                    <select
                      value={addForm.priority}
                      onChange={(e) =>
                        setAddForm({ ...addForm, priority: e.target.value as TaskPriority })
                      }
                      className="h-10 rounded-xl border border-[#eae6df] bg-white px-3 text-xs text-[#181c23] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-heading font-semibold text-[#181c23]">
                      Category
                    </label>
                    <select
                      value={addForm.category}
                      onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                      className="h-10 rounded-xl border border-[#eae6df] bg-white px-3 text-xs text-[#181c23] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20"
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Assignee (Optional)"
                    placeholder="e.g. Priya Sharma"
                    value={addForm.assignedTo}
                    onChange={(e) => setAddForm({ ...addForm, assignedTo: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#eae6df]">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmittingAdd}>
                    {isSubmittingAdd ? "Saving..." : "Create Task"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Task Modal */}
        {editingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#eae6df] space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b pb-3 border-[#eae6df]">
                <div>
                  <h3 className="font-heading font-bold text-base text-[#181c23]">
                    Edit Task
                  </h3>
                  <p className="text-xs text-[#797583]">Update deliverable details</p>
                </div>
                <button
                  onClick={() => setEditingTask(null)}
                  className="text-[#797583] hover:text-[#181c23] text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                  {editError}
                </div>
              )}

              <form onSubmit={handleEditTaskSubmit} className="space-y-4">
                <Input
                  label="Task Title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                />

                <Input
                  label="Description / Notes"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Due Date"
                    type="date"
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                    required
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-heading font-semibold text-[#181c23]">
                      Status
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm({ ...editForm, status: e.target.value as TaskStatus })
                      }
                      className="h-10 rounded-xl border border-[#eae6df] bg-white px-3 text-xs text-[#181c23] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-heading font-semibold text-[#181c23]">
                      Priority
                    </label>
                    <select
                      value={editForm.priority}
                      onChange={(e) =>
                        setEditForm({ ...editForm, priority: e.target.value as TaskPriority })
                      }
                      className="h-10 rounded-xl border border-[#eae6df] bg-white px-3 text-xs text-[#181c23] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <Input
                    label="Assignee"
                    value={editForm.assignedTo}
                    onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#eae6df]">
                  <Button type="button" variant="outline" onClick={() => setEditingTask(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmittingEdit}>
                    {isSubmittingEdit ? "Updating..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-[#eae6df] space-y-4 animate-in zoom-in-95 duration-150">
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-base text-[#ba1a1a] flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Delete Task?
                </h3>
                <p className="text-xs text-[#484552]">
                  Are you sure you want to remove{" "}
                  <strong className="text-[#181c23]">{deletingTask.title}</strong>? This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setDeletingTask(null)}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" onClick={handleDeleteConfirm} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Generate Checklist Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-[#eae6df] space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b pb-3 border-[#eae6df]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#7364c7]/10 flex items-center justify-center text-[#5a4bac]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#181c23]">
                      Generate Event Checklist from Requirements
                    </h3>
                    <p className="text-xs text-[#797583]">
                      Tailored milestone deliverables for your {event?.type || "wedding"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="text-[#797583] hover:text-[#181c23] text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {genSuccessMsg ? (
                <div className="p-6 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-[#466557] mx-auto animate-bounce" />
                  <h4 className="text-sm font-heading font-bold text-[#181c23]">{genSuccessMsg}</h4>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-[#faf9f6] rounded-2xl border border-[#eae6df] text-xs space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-[#181c23]">
                      <AlertCircle className="w-4 h-4 text-[#5a4bac]" />
                      <span>Transparency Guarantee:</span>
                    </div>
                    <p className="text-[11px] text-[#797583]">
                      All generated tasks are strictly initialized as <strong>Pending</strong>.
                      Planora AI assists with comprehensive planning but will never falsely mark tasks as
                      completed without human execution.
                    </p>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {isLoadingGen ? (
                      <div className="py-12 text-center text-xs text-[#797583]">
                        Generating requirements checklist...
                      </div>
                    ) : (
                      generatedPreview.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl border border-[#eae6df] bg-white space-y-1 hover:border-[#7364c7]/40 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-heading font-bold text-[#181c23]">
                              {item.title}
                            </span>
                            <TaskPriorityBadge priority={item.priority} size="sm" />
                          </div>
                          <p className="text-[11px] text-[#797583]">{item.description}</p>
                          <div className="flex items-center gap-3 text-[10px] text-[#797583] pt-1">
                            <span>Due: {item.dueDate}</span>
                            <span>Category: {item.category}</span>
                            <span className="text-[#466557] font-semibold">Status: Pending</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#eae6df]">
                    <div className="text-[11px] text-[#797583] flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-[#7364c7]" />
                      <span>{generatedPreview.length} items will be added to your checklist</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowGenerateModal(false)}>
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleApplyChecklist}
                        disabled={isApplyingGen || isLoadingGen}
                        leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                      >
                        {isApplyingGen ? "Adding Tasks..." : "Add to Event Checklist"}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
