"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EventWorkspaceHeader } from "@/components/events/EventWorkspaceHeader";
import { Button } from "@/components/ui/Button";
import { TaskPriorityBadge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import type { TaskPriority, TaskStatus } from "@/lib/types";

interface TaskItem {
  id: string;
  title: string;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  assignedTo: string;
}

interface TimelineScheduleItem {
  time: string;
  title: string;
  location: string;
  coordinator: string;
  completed: boolean;
}

export default function EventTasksPage() {
  const params = useParams();
  const eventId = (params?.id as string) || "evt-aarav-meera";

  const [activeView, setActiveView] = React.useState<"checklist" | "timeline">("checklist");
  const [filterPriority, setFilterPriority] = React.useState<string>("all");
  const [showAddModal, setShowAddModal] = React.useState(false);

  const [tasks, setTasks] = React.useState<TaskItem[]>([
    { id: "t-1", title: "Finalize menu tasting with Royal Saffron head chef", category: "Catering", priority: "urgent", status: "completed", dueDate: "Nov 02", assignedTo: "Priya Sharma" },
    { id: "t-2", title: "Submit sound clearance permit to Jaipur Police Headquarters", category: "Permits", priority: "urgent", status: "in_progress", dueDate: "Nov 06", assignedTo: "Aditya Verma" },
    { id: "t-3", title: "Approve floral mandap canopy and brass lighting mockups", category: "Decor", priority: "high", status: "in_progress", dueDate: "Nov 12", assignedTo: "Priya Sharma" },
    { id: "t-4", title: "Confirm guest hospitality coach logistics from Jaipur Airport", category: "Logistics", priority: "high", status: "pending", dueDate: "Nov 18", assignedTo: "Rohit Das" },
    { id: "t-5", title: "Order artisan marigold seed favor boxes", category: "Favors", priority: "medium", status: "pending", dueDate: "Nov 25", assignedTo: "Sneha Kapur" },
    { id: "t-6", title: "Finalize rehearsal choreography schedule for Sangeet", category: "Entertainment", priority: "medium", status: "completed", dueDate: "Nov 30", assignedTo: "Meera & Aarav" },
  ]);

  const [timelineSchedule, setTimelineSchedule] = React.useState<TimelineScheduleItem[]>([
    { time: "14:00 - 15:30", title: "VIP Family Airport Escort & Palace Check-In", location: "Royal Gate Pavilion", coordinator: "Rohit Das", completed: true },
    { time: "16:00 - 17:15", title: "Welcome Rosewater Spritz & Shahi Sarbat Reception", location: "Courtyard of Courtesies", coordinator: "Priya Sharma", completed: false },
    { time: "17:30 - 19:30", title: "Sunset Sangeet Procession & Dhol Entry", location: "Grand Amber Terrace", coordinator: "Aditya Verma", completed: false },
    { time: "19:30 - 21:45", title: "Royal Rajasthani Banquet & Live Sufi Qawwali", location: "Marigold Ballroom", coordinator: "Priya Sharma", completed: false },
    { time: "22:00 - 23:30", title: "Acoustic After-Party & Floating Lantern Release", location: "Palace Lakefront", coordinator: "Sneha Kapur", completed: false },
  ]);

  const [newTask, setNewTask] = React.useState({
    title: "",
    category: "Decor",
    priority: "high" as TaskPriority,
    dueDate: "Dec 01",
    assignedTo: "Priya Sharma",
  });

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            status: t.status === "completed" ? "pending" : "completed",
          };
        }
        return t;
      })
    );
  }

  function toggleTimelineItem(idx: number) {
    setTimelineSchedule((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, completed: !item.completed } : item))
    );
  }

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.title) return;
    const item: TaskItem = {
      id: `t-${Date.now()}`,
      title: newTask.title,
      category: newTask.category,
      priority: newTask.priority,
      status: "pending",
      dueDate: newTask.dueDate,
      assignedTo: newTask.assignedTo,
    };
    setTasks((prev) => [item, ...prev]);
    setShowAddModal(false);
    setNewTask({ title: "", category: "Decor", priority: "high", dueDate: "Dec 01", assignedTo: "Priya Sharma" });
  }

  const filteredTasks =
    filterPriority === "all" ? tasks : tasks.filter((t) => t.priority === filterPriority);

  return (
    <AppShell
      activeEventTitle="Aarav & Meera Wedding Celebration"
      activeEventLocation="Jaipur, Dec 2026"
      eventId={eventId}
    >
      <div className="space-y-6">
        <EventWorkspaceHeader
          id={eventId}
          title="Aarav & Meera Wedding Celebration"
          type="wedding"
          status="confirmed"
          date="Dec 14, 2026"
          daysRemaining={142}
          location="Jaipur Royal Palace, Rajasthan"
          guestCount={350}
          budgetTotal={3850000}
        />

        {/* View Switcher & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-white border border-[#eae6df] p-1 rounded-full shadow-2xs">
            <button
              onClick={() => setActiveView("checklist")}
              className={`px-4 py-1.5 text-xs font-heading font-semibold rounded-full transition-all cursor-pointer ${
                activeView === "checklist"
                  ? "bg-[#5a4bac] text-white shadow-xs"
                  : "text-[#686e77] hover:text-[#181c23]"
              }`}
            >
              Task Checklist ({completedCount}/{tasks.length})
            </button>
            <button
              onClick={() => setActiveView("timeline")}
              className={`px-4 py-1.5 text-xs font-heading font-semibold rounded-full transition-all cursor-pointer ${
                activeView === "timeline"
                  ? "bg-[#5a4bac] text-white shadow-xs"
                  : "text-[#686e77] hover:text-[#181c23]"
              }`}
            >
              Day-Of Minute Schedule ({timelineSchedule.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Milestone Task
            </Button>
          </div>
        </div>

        {/* Progress Strip */}
        <div className="p-5 rounded-2xl bg-white border border-[#eae6df] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-sm text-[#181c23]">
                Milestone Execution Progress
              </span>
              <span className="text-xs font-heading font-bold px-2 py-0.5 rounded-full bg-[#c5e7d6] text-[#466557]">
                {progressPercent}% Complete
              </span>
            </div>
            <p className="text-xs text-[#797583]">
              {tasks.length - completedCount} critical milestone deliverables pending completion.
            </p>
          </div>

          <div className="w-full sm:w-64 bg-[#f5f4f0] h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#5a4bac] h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* CHECKLIST VIEW */}
        {activeView === "checklist" && (
          <div className="space-y-4">
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#797583] font-heading font-semibold mr-1">Priority:</span>
              {["all", "urgent", "high", "medium", "low"].map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPriority(p)}
                  className={`px-3 py-1 rounded-full font-heading font-semibold capitalize transition-all cursor-pointer ${
                    filterPriority === p
                      ? "bg-[#5a4bac] text-white shadow-xs"
                      : "bg-white border border-[#eae6df] text-[#686e77] hover:text-[#181c23]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3">
              {filteredTasks.map((task) => {
                const isCompleted = task.status === "completed";
                return (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isCompleted
                        ? "bg-[#faf9f6]/70 border-[#eae6df] opacity-75"
                        : "bg-white border-[#eae6df] hover:border-[#c9c4d4] shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isCompleted
                            ? "bg-[#5a4bac] text-white"
                            : "border-2 border-[#c9c4d4] bg-white hover:border-[#5a4bac]"
                        }`}
                      >
                        {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-heading font-bold text-[#181c23] truncate ${
                            isCompleted ? "line-through text-[#797583]" : ""
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-[#797583] mt-0.5">
                          <span>📁 {task.category}</span>
                          <span>📅 Due {task.dueDate}</span>
                          <span>👤 {task.assignedTo}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <TaskPriorityBadge priority={task.priority} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DAY-OF TIMELINE VIEW */}
        {activeView === "timeline" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#ede9fe] border border-[#dcd6cc] text-xs text-[#181c23] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#5a4bac] shrink-0" />
              <span>
                <strong>Day-of Coordination Mode:</strong> Check off steps as they complete live on location in Jaipur.
              </span>
            </div>

            <div className="relative pl-6 border-l-2 border-[#eae6df] space-y-6 my-4 ml-3">
              {timelineSchedule.map((item, idx) => (
                <div key={item.time} className="relative group">
                  <div
                    onClick={() => toggleTimelineItem(idx)}
                    className={`absolute -left-[31px] top-1.5 w-5 h-5 rounded-full border-2 cursor-pointer transition-all flex items-center justify-center ${
                      item.completed
                        ? "bg-[#466557] border-[#466557] text-white"
                        : "bg-white border-[#7364c7] hover:scale-110"
                    }`}
                  >
                    {item.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#eae6df] shadow-2xs hover:border-[#5a4bac] transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-heading font-extrabold text-xs text-[#5a4bac] bg-[#ede9fe] px-2.5 py-0.5 rounded-full self-start">
                        {item.time}
                      </span>
                      <span className="text-[11px] text-[#797583]">Lead: {item.coordinator}</span>
                    </div>
                    <h4
                      className={`font-heading font-bold text-sm text-[#181c23] mt-2 ${
                        item.completed ? "line-through text-[#797583]" : ""
                      }`}
                    >
                      {item.title}
                    </h4>
                    <p className="text-xs text-[#686e77] mt-0.5">📍 {item.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Task Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#eae6df] space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b pb-3 border-[#eae6df]">
                <h3 className="font-heading font-bold text-base text-[#181c23]">
                  Add Milestone Task
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-[#797583] hover:text-[#181c23] text-lg font-bold">
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddTask} className="space-y-3.5">
                <Input
                  label="Task Title"
                  placeholder="e.g. Schedule palace lighting dry run with sound team"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-heading font-semibold text-[#181c23]">
                      Priority
                    </label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                      className="h-11 rounded-full border border-[#eae6df] bg-white px-3 text-xs text-[#181c23] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20"
                    >
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <Input
                    label="Due Date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    required
                  />
                </div>

                <Input
                  label="Assigned Lead"
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                  required
                />

                <div className="flex justify-end gap-2 pt-3 border-t border-[#eae6df]">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Milestone</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
