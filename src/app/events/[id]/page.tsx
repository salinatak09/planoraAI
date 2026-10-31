"use client";

import {useEffect, useState, useCallback, FormEvent} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Sparkles,
  AlertCircle,
  ArrowLeft,
  X,
  Trash2,
  Save,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EventWorkspaceHeader } from "@/components/events/EventWorkspaceHeader";
import { ChangeImpactModal } from "@/components/events/ChangeImpactModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { EventType, EventStatus } from "@/lib/types";

interface PersistedEvent {
  id?: string;
  _id?: string;
  title: string;
  type: EventType;
  status: EventStatus;
  date: string;
  location: string;
  guestCount: number;
  totalBudget: number;
  currency: string;
  theme: string;
  version?: number;
  preferences?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export default function EventOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = (params?.id as string);

  const [event, setEvent] = useState<PersistedEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editGuestCount, setEditGuestCount] = useState<number>(100);
  const [editBudgetTotal, setEditBudgetTotal] = useState<number>(1000000);
  const [editStatus, setEditStatus] = useState<EventStatus>("planning");
  const [editTheme, setEditTheme] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Replanning Modal State
  const [isReplanningOpen, setIsReplanningOpen] = useState(false);

  // Load Event from MongoDB
  const fetchEvent = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();

      if (!res.ok) {
        console.log(res, data);
        // Fallback for demo ID if not in DB
        // if (eventId === "evt-aarav-meera") {
        //   setEvent({
        //     id: "evt-aarav-meera",
        //     _id: "evt-aarav-meera",
        //     title: "Aarav & Meera Wedding Celebration",
        //     type: "wedding",
        //     status: "confirmed",
        //     date: "2026-12-14",
        //     location: "Jaipur Royal Palace & Grounds, Rajasthan",
        //     guestCount: 350,
        //     totalBudget: 3850000,
        //     currency: "₹",
        //     theme: "Royal Palace Heritage & Candlelit Amber",
        //   });
        //   setIsLoading(false);
        //   return;
        // }
        setFetchError(data?.error?.message || "Failed to load event");
        setIsLoading(false);
        return;
      }

      setEvent(data.data);
    } catch {
      setFetchError("Network error while connecting to server");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        const data = await res.json();
        if (!isMounted) return;

        if (!res.ok) {
          if (eventId === "evt-aarav-meera") {
            setEvent({
              id: "evt-aarav-meera",
              _id: "evt-aarav-meera",
              title: "Aarav & Meera Wedding Celebration",
              type: "wedding",
              status: "confirmed",
              date: "2026-12-14",
              location: "Jaipur Royal Palace & Grounds, Rajasthan",
              guestCount: 350,
              totalBudget: 3850000,
              currency: "₹",
              theme: "Royal Palace Heritage & Candlelit Amber",
            });
          } else {
            setFetchError(data?.error?.message || "Failed to load event");
          }
        } else {
          setEvent(data.data);
        }
      } catch {
        if (isMounted) setFetchError("Network error while connecting to server");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  // Open Edit Modal with current values
  function handleOpenEdit() {
    if (!event) return;
    setEditTitle(event.title);
    setEditDate(event.date);
    setEditLocation(event.location);
    setEditGuestCount(event.guestCount);
    setEditBudgetTotal(event.totalBudget);
    setEditStatus(event.status);
    setEditTheme(event.theme);
    setEditError(null);
    setIsEditOpen(true);
  }

  // Save Edit Updates
  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    setIsSavingEdit(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          date: editDate,
          location: editLocation,
          guestCount: Number(editGuestCount),
          budgetTotal: Number(editBudgetTotal),
          totalBudget: Number(editBudgetTotal),
          status: editStatus,
          theme: editTheme,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditError(data?.error?.message || "Failed to update celebration details");
        setIsSavingEdit(false);
        return;
      }

      setEvent(data.data);
      setIsEditOpen(false);
      router.refresh();
    } catch {
      setEditError("Network error while updating event");
    } finally {
      setIsSavingEdit(false);
    }
  }

  // Confirm and Execute Cascade Deletion
  async function handleExecuteDelete() {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/events/${eventId}?confirm=true`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data?.error?.message || "Failed to delete event");
        setIsDeleting(false);
        return;
      }

      // Redirect back to dashboard after deletion
      setIsDeleteOpen(false);
      router.push("/dashboard");
      router.refresh();
    } catch {
      setDeleteError("Network error during event deletion");
      setIsDeleting(false);
    }
  }

  // Calculate Days Remaining
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

  // Loading Skeleton State
  if (isLoading) {
    return (
      <AppShell activeEventTitle="Loading Celebration..." activeEventLocation="Synchronizing" eventId={eventId}>
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
          <div className="h-28 bg-white rounded-3xl border border-[#eae6df] p-6" />
          <div className="h-20 bg-white rounded-2xl border border-[#eae6df] p-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-80 bg-white rounded-2xl border border-[#eae6df]" />
            <div className="h-80 bg-white rounded-2xl border border-[#eae6df]" />
          </div>
        </div>
      </AppShell>
    );
  }

  // Error State
  if (fetchError || !event) {
    return (
      <AppShell activeEventTitle="Event Not Found" activeEventLocation="Error" eventId={eventId}>
        <div className="max-w-2xl mx-auto my-12 p-8 rounded-3xl bg-white border border-[#eae6df] text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-heading font-extrabold text-[#181c23]">
            Celebration Workspace Unavailable
          </h2>
          <p className="text-xs text-[#686e77] max-w-md mx-auto">
            {fetchError || "This celebration may have been removed or belongs to another organizer."}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" onClick={fetchEvent}>
              Try Again
            </Button>
            <Link href="/dashboard">
              <Button leftIcon={<ArrowLeft className="w-4 h-4" />}>Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      activeEventTitle={event.title}
      activeEventLocation={event.location}
      eventId={event._id || event.id || eventId}
    >
      <div className="space-y-6">
        {/* Workspace Header with Real Event Data, Edit & Delete actions */}
        <EventWorkspaceHeader
          id={event._id || event.id || eventId}
          title={event.title}
          type={event.type}
          status={event.status}
          date={event.date}
          daysRemaining={daysRemaining}
          location={event.location}
          guestCount={event.guestCount}
          budgetTotal={event.totalBudget}
          currency={event.currency || "₹"}
          onEdit={handleOpenEdit}
          onDelete={() => setIsDeleteOpen(true)}
          onReplanning={() => setIsReplanningOpen(true)}
        />

        {/* AI Insight Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#ede9fe] border border-[#dcd6cc] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#5a4bac] flex items-center justify-center text-white shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-heading font-bold text-[#5a4bac] uppercase tracking-wider">
                Copilot Workspace Status
              </span>
              <p className="text-xs sm:text-sm text-[#181c23] mt-0.5">
                Celebration is currently in <strong className="capitalize">{event.status}</strong> mode with{" "}
                <strong>{event.guestCount}</strong> target attendees and{" "}
                <strong>
                  {event.currency || "₹"}
                  {event.totalBudget.toLocaleString()}
                </strong>{" "}
                planned budget.
              </p>
            </div>
          </div>
          <Link href={`/events/${eventId}/assistant`} className="shrink-0">
            <Button size="sm" variant="primary">
              Review with Assistant
            </Button>
          </Link>
        </div>

        {/* 3 Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1 & 2: Budget Breakdown & Schedule */}
          <div className="lg:col-span-2 space-y-6">
            {/* Financial Health Summary */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm">Financial Health & Disbursement Allocation</CardTitle>
                  <CardDescription>Track allocated capital across vendor categories</CardDescription>
                </div>
                <Link href={`/events/${eventId}/budget`}>
                  <Button size="sm" variant="outline">
                    Open Ledger
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-[#faf9f6] border border-[#eae6df] text-center">
                  <div>
                    <span className="text-[11px] text-[#797583]">Planned Budget</span>
                    <p className="text-lg font-heading font-extrabold text-[#181c23]">
                      {event.currency || "₹"}
                      {event.totalBudget.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#797583]">Per-Guest Target</span>
                    <p className="text-lg font-heading font-extrabold text-[#5a4bac]">
                      {event.currency || "₹"}
                      {event.guestCount > 0
                        ? Math.round(event.totalBudget / event.guestCount).toLocaleString()
                        : "0"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#797583]">Event Status</span>
                    <p className="text-base font-heading font-bold text-[#466557] capitalize mt-0.5">
                      {event.status}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#eae6df] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#797583] block">Styling Concept & Theme</span>
                    <span className="font-heading font-bold text-[#181c23]">{event.theme}</span>
                  </div>
                  <Link href={`/events/${eventId}/budget`}>
                    <Button size="sm" variant="ghost">
                      Manage Allocations →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Checklist & Task Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm">Checklist & Timeline Actions</CardTitle>
                  <CardDescription>Immediate task priorities and milestone schedule</CardDescription>
                </div>
                <Link href={`/events/${eventId}/tasks`}>
                  <Button size="sm" variant="outline">
                    Open Checklist
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-[#faf9f6] border border-[#eae6df] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-full bg-white border border-[#eae6df] font-heading font-bold text-[#5a4bac]">
                        Priority
                      </span>
                      <div>
                        <p className="font-heading font-bold text-[#181c23]">
                          Lock primary venue contracts in {event.location.split(",")[0]}
                        </p>
                        <span className="text-[11px] text-[#797583]">Due before celebration date</span>
                      </div>
                    </div>
                    <Badge variant="warning" size="sm">
                      Pending
                    </Badge>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#faf9f6] border border-[#eae6df] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-full bg-white border border-[#eae6df] font-heading font-bold text-[#5a4bac]">
                        Catering
                      </span>
                      <div>
                        <p className="font-heading font-bold text-[#181c23]">
                          Curate dietary & banquet menu for {event.guestCount} guests
                        </p>
                        <span className="text-[11px] text-[#797583]">Special dietary accommodations</span>
                      </div>
                    </div>
                    <Badge variant="sage" size="sm">
                      Ready
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Col 3: Snapshot Details & Quick Tools */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm">Celebration Logistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-[#faf9f6] border border-[#eae6df] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#797583]">Host City / Estate:</span>
                    <span className="font-heading font-semibold text-[#181c23]">{event.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#797583]">Target Date:</span>
                    <span className="font-heading font-semibold text-[#181c23]">{event.date}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#797583]">RSVP Target:</span>
                    <span className="font-heading font-semibold text-[#181c23]">{event.guestCount} Guests</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Link href={`/events/${eventId}/vendors`}>
                    <Button variant="outline" size="sm" className="w-full justify-center">
                      Manage Vendor Directory
                    </Button>
                  </Link>
                  <Link href={`/events/${eventId}/ideas`}>
                    <Button variant="outline" size="sm" className="w-full justify-center">
                      Explore AI Ideas Studio
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#ede9fe]/50 to-white border-[#dcd6cc]">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-xs font-heading font-bold text-[#5a4bac]">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Copilot Active</span>
                </div>
                <CardTitle className="text-sm">Design Brief Ready</CardTitle>
                <CardDescription>
                  Tailored suggestions based on {event.theme} and {event.guestCount} attendees.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Link href={`/events/${eventId}/assistant`}>
                  <Button size="sm" variant="soft" className="w-full justify-center">
                    Open Planning Assistant Chat
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* EDIT EVENT MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#eae6df] shadow-2xl w-full max-w-lg p-6 sm:p-8 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#eae6df]">
              <div>
                <h3 className="text-lg font-heading font-bold text-[#181c23]">
                  Edit Celebration Details
                </h3>
                <p className="text-xs text-[#797583]">Update core event parameters in MongoDB</p>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-2 rounded-full text-[#797583] hover:bg-[#faf9f6] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] text-xs font-heading font-semibold">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <Input
                label="Event Title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Input
                  label="Date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-heading font-semibold text-[#181c23]">
                    Celebration Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as EventStatus)}
                    className="h-11 rounded-full border border-[#eae6df] bg-white px-4 text-xs text-[#181c23] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20 focus:border-[#5a4bac]"
                  >
                    <option value="planning">Planning</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <Input
                label="Location / Venue"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Input
                  label="Guest Count"
                  type="number"
                  value={editGuestCount}
                  onChange={(e) => setEditGuestCount(Number(e.target.value))}
                  min={1}
                  required
                />
                <Input
                  label={`Budget Amount (${event.currency || "₹"})`}
                  type="number"
                  value={editBudgetTotal}
                  onChange={(e) => setEditBudgetTotal(Number(e.target.value))}
                  min={0}
                  required
                />
              </div>

              <Input
                label="Theme & Aesthetic"
                value={editTheme}
                onChange={(e) => setEditTheme(e.target.value)}
                required
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eae6df]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  disabled={isSavingEdit}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSavingEdit} leftIcon={<Save className="w-4 h-4" />}>
                  Save Changes to Database
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#ffdad6] shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-heading font-extrabold text-[#181c23]">
                Delete &ldquo;{event.title}&rdquo;?
              </h3>
              <p className="text-xs text-[#ba1a1a] font-heading font-semibold mt-1">
                Irrevocable Cascading Deletion Warning
              </p>
              <p className="text-xs text-[#686e77] mt-2 leading-relaxed">
                Deleting this event permanently purges all associated child records from MongoDB, including
                budget ledgers, timeline tasks, vendor allocations, and AI conversations. This action cannot be
                reversed.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] text-xs font-heading font-semibold">
                {deleteError}
              </div>
            )}

            <div className="pt-2">
              <label className="text-[11px] font-heading font-semibold text-[#181c23] block mb-1">
                Type <strong className="text-[#ba1a1a]">delete</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="delete"
                className="w-full h-10 px-3 text-xs rounded-full border border-[#eae6df] bg-[#faf9f6] focus:outline-none focus:border-[#ba1a1a]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eae6df]">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteOpen(false);
                  setDeleteConfirmationText("");
                  setDeleteError(null);
                }}
                disabled={isDeleting}
              >
                Keep Event
              </Button>
              <Button
                type="button"
                className="bg-[#ba1a1a] hover:bg-[#93000a] text-white"
                onClick={handleExecuteDelete}
                isLoading={isDeleting}
                disabled={deleteConfirmationText.trim().toLowerCase() !== "delete"}
              >
                Permanently Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Change Impact & Replanning Modal */}
      {isReplanningOpen && (
        <ChangeImpactModal
          isOpen={isReplanningOpen}
          onClose={() => setIsReplanningOpen(false)}
          eventId={event._id || event.id || eventId}
          initialEvent={{
            title: event.title,
            guestCount: event.guestCount,
            totalBudget: event.totalBudget,
            currency: event.currency || "₹",
            date: event.date,
            location: event.location,
            theme: event.theme,
            version: event.version,
          }}
          onChangesApplied={() => {
            fetchEvent();
          }}
        />
      )}
    </AppShell>
  );
}
