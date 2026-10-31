"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Download,
  AlertTriangle,
  Sparkles,
  Pencil,
  Trash2,
  ShieldAlert,
  PieChart as PieIcon,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { EventWorkspaceHeader } from "@/components/events/EventWorkspaceHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  calculateBudgetSummary,
  formatBudgetCurrency,
  suggestCategoryAllocations,
  type BudgetFinancialMetrics,
  type SuggestedCategoryAllocation,
} from "@/lib/domain/budget";
import type { EventType, EventStatus } from "@/lib/types";

interface BudgetItemRow {
  _id?: string;
  id?: string;
  category: string;
  description: string;
  estimatedAmount: number;
  actualAmount: number;
  paymentStatus: "unpaid" | "deposit_paid" | "paid";
  notes?: string;
  isContingency?: boolean;
}

interface EventMetadata {
  id: string;
  title: string;
  type: EventType;
  status: EventStatus;
  date: string;
  location: string;
  guestCount: number;
  totalBudget: number;
  currency: string;
}

const CATEGORY_OPTIONS = [
  "Venue & Palace",
  "Catering & Banquet",
  "Florals & Decor",
  "Photography & Film",
  "Music & Entertainment",
  "Attire & Beauty",
  "Favors & Hospitality",
  "Transportation & Logistics",
  "Contingency Safety Reserve",
  "Other",
];

const PIE_COLORS = ["#5a4bac", "#466557", "#884a0f", "#7364c7", "#a66227", "#3b82f6", "#ec4899", "#8b5cf6"];

export default function EventBudgetPage() {
  const params = useParams();
  const eventId = (params?.id as string) || "evt-aarav-meera";

  const [event, setEvent] = React.useState<EventMetadata | null>(null);
  const [items, setItems] = React.useState<BudgetItemRow[]>([]);
  const [summary, setSummary] = React.useState<BudgetFinancialMetrics | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  // Add Item Modal
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [addForm, setAddForm] = React.useState({
    category: "Venue & Palace",
    customCategory: "",
    description: "",
    estimatedAmount: 100000,
    actualAmount: 0,
    paymentStatus: "unpaid" as "unpaid" | "deposit_paid" | "paid",
    notes: "",
    isContingency: false,
  });
  const [isSubmittingAdd, setIsSubmittingAdd] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);

  // Edit Item Modal
  const [editingItem, setEditingItem] = React.useState<BudgetItemRow | null>(null);
  const [editForm, setEditForm] = React.useState({
    category: "",
    description: "",
    estimatedAmount: 0,
    actualAmount: 0,
    paymentStatus: "unpaid" as "unpaid" | "deposit_paid" | "paid",
    notes: "",
    isContingency: false,
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  // Delete Confirmation Modal
  const [deletingItem, setDeletingItem] = React.useState<BudgetItemRow | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // AI Suggestions Modal
  const [showAIModal, setShowAIModal] = React.useState(false);
  const [aiSuggestions, setAiSuggestions] = React.useState<SuggestedCategoryAllocation[]>([]);
  const [isLoadingAI, setIsLoadingAI] = React.useState(false);
  const [isApplyingAI, setIsApplyingAI] = React.useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = React.useState<string | null>(null);

  // Filter Category State
  const [selectedCategoryFilter, setSelectedCategoryFilter] = React.useState<string>("all");

  // Helper to process raw API response
  const handleBudgetResponse = React.useCallback(
    (data: { event: Record<string, unknown>; items: Record<string, unknown>[]; summary?: BudgetFinancialMetrics }) => {
      const eventData = data.event;
      const budgetItems: BudgetItemRow[] = data.items.map((it) => ({
        id: (it._id || it.id) as string,
        _id: (it._id || it.id) as string,
        category: (it.category as string) || "General",
        description: (it.description as string) || "",
        estimatedAmount: Number(it.estimatedAmount || 0),
        actualAmount: Number(it.actualAmount || 0),
        paymentStatus: (it.paymentStatus as BudgetItemRow["paymentStatus"]) || "unpaid",
        notes: (it.notes as string) || "",
        isContingency: Boolean(it.isContingency),
      }));

      const meta: EventMetadata = {
        id: (eventData.id || eventId) as string,
        title: (eventData.title as string) || "Event Workspace",
        type: (eventData.type as EventType) || "wedding",
        status: (eventData.status as EventStatus) || "planning",
        date: (eventData.date as string) || "2026-12-14",
        location: (eventData.location as string) || "Venue Pending",
        guestCount: Number(eventData.guestCount || 100),
        totalBudget: Number(eventData.totalBudget || 0),
        currency: (eventData.currency as string) || "₹",
      };

      setEvent(meta);
      setItems(budgetItems);
      setSummary(data.summary || calculateBudgetSummary(meta.totalBudget, budgetItems));
    },
    [eventId]
  );

  // Load Budget Data from MongoDB without synchronous setState in effect
  React.useEffect(() => {
    let isMounted = true;
    async function fetchInitial() {
      try {
        const res = await fetch(`/api/events/${eventId}/budget`);
        const data = await res.json();
        if (!isMounted) return;

        if (!res.ok) {
          if (eventId === "evt-aarav-meera") {
            const demoEvent: EventMetadata = {
              id: "evt-aarav-meera",
              title: "Aarav & Meera Wedding Celebration",
              type: "wedding",
              status: "confirmed",
              date: "2026-12-14",
              location: "Jaipur Royal Palace & Grounds, Rajasthan",
              guestCount: 350,
              totalBudget: 3850000,
              currency: "₹",
            };
            const demoItems: BudgetItemRow[] = [
              {
                id: "b-1",
                category: "Venue & Palace",
                description: "Jaipur Palace Heritage Trust - Main Lawn & Courtyard",
                estimatedAmount: 1200000,
                actualAmount: 1200000,
                paymentStatus: "deposit_paid",
                notes: "Advance 80% disbursed; balance on handover",
              },
              {
                id: "b-2",
                category: "Catering & Banquet",
                description: "Royal Saffron Catering - 3 Banquets & High Tea",
                estimatedAmount: 1100000,
                actualAmount: 1050000,
                paymentStatus: "deposit_paid",
                notes: "Tasting approved; menu locked for 350 pax",
              },
              {
                id: "b-3",
                category: "Florals & Decor",
                description: "Wildflower Botanical Studio - Royal Amber Palette",
                estimatedAmount: 650000,
                actualAmount: 580000,
                paymentStatus: "paid",
                notes: "Full payment settled upon mock setup review",
              },
              {
                id: "b-4",
                category: "Photography & Film",
                description: "Stories by Joseph Radhik - Drone & Master Album",
                estimatedAmount: 500000,
                actualAmount: 480000,
                paymentStatus: "deposit_paid",
                notes: "50% advance disbursed",
              },
              {
                id: "b-5",
                category: "Music & Entertainment",
                description: "Sangeet Brass & Folk Ensemble Collective",
                estimatedAmount: 400000,
                actualAmount: 390000,
                paymentStatus: "unpaid",
                notes: "Contract pending client signatory",
              },
              {
                id: "b-6",
                category: "Contingency Safety Reserve",
                description: "Weather & Municipal Permits Emergency Buffer",
                estimatedAmount: 200000,
                actualAmount: 0,
                paymentStatus: "unpaid",
                isContingency: true,
                notes: "Unspent planned contingency buffer",
              },
            ];

            setEvent(demoEvent);
            setItems(demoItems);
            setSummary(calculateBudgetSummary(demoEvent.totalBudget, demoItems));
            return;
          }

          setFetchError(data?.error?.message || "Failed to load budget");
        } else {
          handleBudgetResponse(data.data);
        }
      } catch (err: unknown) {
        if (isMounted) setFetchError(err instanceof Error ? err.message : "Error connecting to budget service");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchInitial();
    return () => {
      isMounted = false;
    };
  }, [eventId, handleBudgetResponse]);

  // Function to refresh budget data after mutations
  const refreshBudgetData = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/budget`);
      const data = await res.json();
      if (res.ok) {
        handleBudgetResponse(data.data);
      }
    } catch {
      // Background refresh
    }
  }, [eventId, handleBudgetResponse]);

  // Recalculate days remaining
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

  // Handle Add Item Submission
  async function handleAddItemSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmittingAdd(true);
    setAddError(null);

    const targetCategory =
      addForm.category === "Other" && addForm.customCategory.trim()
        ? addForm.customCategory.trim()
        : addForm.category;

    const payload = {
      category: targetCategory,
      description: addForm.description.trim(),
      estimatedAmount: Number(addForm.estimatedAmount),
      actualAmount: Number(addForm.actualAmount),
      paymentStatus: addForm.paymentStatus,
      notes: addForm.notes.trim() || undefined,
      isContingency:
        addForm.isContingency ||
        targetCategory.toLowerCase().includes("contingency") ||
        targetCategory.toLowerCase().includes("reserve"),
    };

    try {
      if (eventId === "evt-aarav-meera") {
        // Local demo update
        const newItem: BudgetItemRow = {
          id: `b-${Date.now()}`,
          ...payload,
        };
        const updated = [...items, newItem];
        setItems(updated);
        if (event) setSummary(calculateBudgetSummary(event.totalBudget, updated));
        setShowAddModal(false);
        setAddForm({
          category: "Venue & Palace",
          customCategory: "",
          description: "",
          estimatedAmount: 100000,
          actualAmount: 0,
          paymentStatus: "unpaid",
          notes: "",
          isContingency: false,
        });
        setIsSubmittingAdd(false);
        return;
      }

      const res = await fetch(`/api/events/${eventId}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to add budget item");
      }

      // Refresh data
      await refreshBudgetData();
      setShowAddModal(false);
      setAddForm({
        category: "Venue & Palace",
        customCategory: "",
        description: "",
        estimatedAmount: 100000,
        actualAmount: 0,
        paymentStatus: "unpaid",
        notes: "",
        isContingency: false,
      });
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "Error saving budget item");
    } finally {
      setIsSubmittingAdd(false);
    }
  }

  // Open Edit Item Modal
  function handleOpenEdit(item: BudgetItemRow) {
    setEditingItem(item);
    setEditError(null);
    setEditForm({
      category: item.category,
      description: item.description,
      estimatedAmount: item.estimatedAmount,
      actualAmount: item.actualAmount,
      paymentStatus: item.paymentStatus,
      notes: item.notes || "",
      isContingency: Boolean(item.isContingency),
    });
  }

  // Handle Edit Item Submission
  async function handleEditItemSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;
    setIsSubmittingEdit(true);
    setEditError(null);

    const itemId = editingItem._id || editingItem.id;
    const payload = {
      category: editForm.category.trim(),
      description: editForm.description.trim(),
      estimatedAmount: Number(editForm.estimatedAmount),
      actualAmount: Number(editForm.actualAmount),
      paymentStatus: editForm.paymentStatus,
      notes: editForm.notes.trim() || undefined,
      isContingency: editForm.isContingency,
    };

    try {
      if (eventId === "evt-aarav-meera") {
        const updated = items.map((it) => (it.id === itemId || it._id === itemId ? { ...it, ...payload } : it));
        setItems(updated);
        if (event) setSummary(calculateBudgetSummary(event.totalBudget, updated));
        setEditingItem(null);
        setIsSubmittingEdit(false);
        return;
      }

      const res = await fetch(`/api/events/${eventId}/budget/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to update budget item");
      }

      await refreshBudgetData();
      setEditingItem(null);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Error updating item");
    } finally {
      setIsSubmittingEdit(false);
    }
  }

  // Handle Delete Item
  async function handleDeleteConfirm() {
    if (!deletingItem) return;
    setIsDeleting(true);
    setDeleteError(null);

    const itemId = deletingItem._id || deletingItem.id;

    try {
      if (eventId === "evt-aarav-meera") {
        const updated = items.filter((it) => it.id !== itemId && it._id !== itemId);
        setItems(updated);
        if (event) setSummary(calculateBudgetSummary(event.totalBudget, updated));
        setDeletingItem(null);
        setIsDeleting(false);
        return;
      }

      const res = await fetch(`/api/events/${eventId}/budget/${itemId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to delete budget item");
      }

      await refreshBudgetData();
      setDeletingItem(null);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Error deleting item");
    } finally {
      setIsDeleting(false);
    }
  }

  // Open AI Allocation Modal & Fetch suggestions
  async function handleOpenAISuggestions() {
    setShowAIModal(true);
    setIsLoadingAI(true);
    setAiSuccessMessage(null);

    try {
      const budgetTotal = event?.totalBudget || 3850000;
      const type = event?.type || "wedding";
      // Authoritatively computed locally or fetched from endpoint
      const suggestions = suggestCategoryAllocations(budgetTotal, type);
      setAiSuggestions(suggestions);
    } catch {
      // Fallback
    } finally {
      setIsLoadingAI(false);
    }
  }

  // Apply AI Suggestions to Ledger
  async function handleApplyAISuggestions() {
    if (!aiSuggestions.length || !event) return;
    setIsApplyingAI(true);

    try {
      if (eventId === "evt-aarav-meera") {
        const newItems: BudgetItemRow[] = aiSuggestions.map((s, idx) => ({
          id: `ai-${Date.now()}-${idx}`,
          category: s.category,
          description: s.description,
          estimatedAmount: s.recommendedAmount,
          actualAmount: 0,
          paymentStatus: "unpaid",
          isContingency: s.isContingency,
          notes: `AI Recommended Envelope (${s.percentage}% allocation)`,
        }));

        const merged = [...items, ...newItems];
        setItems(merged);
        setSummary(calculateBudgetSummary(event.totalBudget, merged));
        setAiSuccessMessage("AI budget envelopes applied to ledger successfully!");
        setTimeout(() => setShowAIModal(false), 1200);
        return;
      }

      const res = await fetch(`/api/events/${eventId}/budget/ai-suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apply: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to apply AI suggestions");
      }

      await refreshBudgetData();
      setAiSuccessMessage("AI budget envelopes applied to ledger successfully!");
      setTimeout(() => setShowAIModal(false), 1200);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to apply envelopes");
    } finally {
      setIsApplyingAI(false);
    }
  }

  // Export Real CSV Ledger
  function handleExportCSV() {
    if (!items.length || !event) return;

    const headers = [
      "Category",
      "Line Item Description",
      `Planned Target (${event.currency})`,
      `Actual Disbursed (${event.currency})`,
      "Payment Status",
      "Is Contingency",
      "Notes",
    ];

    const rows = items.map((it) => [
      `"${it.category.replace(/"/g, '""')}"`,
      `"${it.description.replace(/"/g, '""')}"`,
      it.estimatedAmount,
      it.actualAmount,
      it.paymentStatus,
      it.isContingency ? "YES" : "NO",
      `"${(it.notes || "").replace(/"/g, '""')}"`,
    ]);

    // Financial summary rows at bottom
    const summaryRows = [
      [],
      ["--- AUTHORITATIVE FINANCIAL METRICS ---"],
      ["Total Authorized Ceiling", summary?.totalBudget || event.totalBudget],
      ["Total Planned Allocations", summary?.estimatedTotal || 0],
      ["Total Actual Disbursements", summary?.actualSpent || 0],
      ["Total Committed Obligations", summary?.committedCosts || 0],
      ["Planned Contingency Buffer", summary?.contingencyAllocated || 0],
      ["Remaining Planned Balance", summary?.remainingPlanned || 0],
      ["Remaining Liquid Cash", summary?.remainingCash || 0],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(",")), ...summaryRows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Planora_AI_Budget_${event.title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Filter items
  const filteredItems = React.useMemo(() => {
    if (selectedCategoryFilter === "all") return items;
    return items.filter((it) => it.category === selectedCategoryFilter);
  }, [items, selectedCategoryFilter]);

  // Unique categories for filtering
  const distinctCategories = React.useMemo(() => {
    const cats = new Set(items.map((i) => i.category));
    return Array.from(cats);
  }, [items]);

  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (!summary?.categories) return [];
    return summary.categories.map((c) => ({
      name: c.category.length > 14 ? c.category.slice(0, 13) + "…" : c.category,
      fullName: c.category,
      Planned: c.estimated,
      Committed: c.committed,
      Disbursed: c.actual,
    }));
  }, [summary]);

  const pieData = React.useMemo(() => {
    if (!summary?.categories) return [];
    return summary.categories
      .filter((c) => c.estimated > 0)
      .map((c) => ({
        name: c.category,
        value: c.estimated,
      }));
  }, [summary]);

  const activeCurrency = event?.currency || "₹";

  if (isLoading) {
    return (
      <AppShell activeEventTitle="Loading Budget..." activeEventLocation="Synchronizing" eventId={eventId}>
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-28 bg-white rounded-3xl border border-[#eae6df] p-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-white rounded-3xl border border-[#eae6df]" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-72 bg-white rounded-3xl border border-[#eae6df]" />
            <div className="h-72 bg-white rounded-3xl border border-[#eae6df]" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (fetchError && !event) {
    return (
      <AppShell activeEventTitle="Error" activeEventLocation="" eventId={eventId}>
        <div className="max-w-xl mx-auto py-16 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-[#ba1a1a] mx-auto" />
          <h2 className="text-xl font-heading font-bold text-[#181c23]">Unable to load event budget</h2>
          <p className="text-sm text-[#797583]">{fetchError}</p>
          <Button onClick={() => window.location.reload()} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Retry Loading
          </Button>
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
            currency={activeCurrency}
          />
        )}

        {/* Overspending Warning Banner */}
        {summary?.isPlannedOverBudget && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-2xs flex items-start gap-3.5">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-heading font-bold text-amber-900">
                Budget Allocation Overrun Alert
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                Total planned envelopes ({formatBudgetCurrency(summary.estimatedTotal, activeCurrency)}) exceed your authorized
                budget ceiling ({formatBudgetCurrency(summary.totalBudget, activeCurrency)}) by{" "}
                <span className="font-bold underline decoration-amber-500">
                  {formatBudgetCurrency(summary.overrunAmount, activeCurrency)}
                </span>
                . Review category line items or adjust your ceiling in Event Settings.
              </p>
            </div>
          </div>
        )}

        {summary?.isActualOverBudget && (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 shadow-2xs flex items-start gap-3.5">
            <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-heading font-bold text-rose-900">
                Critical Disbursement Deficit Alert
              </h4>
              <p className="text-xs text-rose-800 leading-relaxed">
                Actual payments disbursed ({formatBudgetCurrency(summary.actualSpent, activeCurrency)}) have exceeded your
                authorized total budget cap by{" "}
                <span className="font-bold">
                  {formatBudgetCurrency(summary.actualSpent - summary.totalBudget, activeCurrency)}
                </span>
                .
              </p>
            </div>
          </div>
        )}

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-heading font-extrabold text-[#181c23] tracking-tight">
              Master Budget & Cashflow Ledger
            </h2>
            <p className="text-xs text-[#686e77] mt-0.5">
              Strict multi-currency financial calculation engine preventing double-counting and maintaining reserves.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenAISuggestions}
              className="px-3.5 py-2 rounded-full border border-[#7364c7]/30 bg-[#7364c7]/10 text-xs font-heading font-bold text-[#5a4bac] hover:bg-[#7364c7]/20 flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#5a4bac]" />
              <span>AI Envelopes Studio</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-full border border-[#eae6df] bg-white text-xs font-heading font-semibold text-[#484552] hover:bg-[#faf9f6] flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <Button
              size="sm"
              onClick={() => {
                setAddError(null);
                setShowAddModal(true);
              }}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Expense Item
            </Button>
          </div>
        </div>

        {/* 4 Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Authorized Ceiling */}
          <Card className="p-5 relative overflow-hidden">
            <span className="text-xs font-heading font-semibold text-[#797583]">Total Budget Ceiling</span>
            <div className="text-2xl font-heading font-extrabold text-[#181c23] mt-1">
              {formatBudgetCurrency(summary?.totalBudget || event?.totalBudget || 0, activeCurrency)}
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px]">
              <span className="text-[#466557] font-semibold">Authorized Cap</span>
              <span className="text-[#797583] font-medium">{summary?.percentPlanned || 0}% planned</span>
            </div>
            <div className="w-full bg-[#f0eee9] h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  (summary?.percentPlanned || 0) > 100 ? "bg-amber-500" : "bg-[#5a4bac]"
                }`}
                style={{ width: `${Math.min(100, summary?.percentPlanned || 0)}%` }}
              />
            </div>
          </Card>

          {/* 2. Planned Estimates & Remaining Planned */}
          <Card className="p-5">
            <span className="text-xs font-heading font-semibold text-[#797583]">Total Planned Target</span>
            <div className="text-2xl font-heading font-extrabold text-[#5a4bac] mt-1">
              {formatBudgetCurrency(summary?.estimatedTotal || 0, activeCurrency)}
            </div>
            <div className="mt-2 text-[11px] flex items-center justify-between">
              <span className="text-[#797583]">Unallocated Buffer:</span>
              <span
                className={`font-semibold ${
                  (summary?.remainingPlanned || 0) < 0 ? "text-amber-700 font-bold" : "text-[#466557]"
                }`}
              >
                {formatBudgetCurrency(summary?.remainingPlanned || 0, activeCurrency)}
              </span>
            </div>
          </Card>

          {/* 3. Actual Spent & Remaining Cash */}
          <Card className="p-5">
            <span className="text-xs font-heading font-semibold text-[#797583]">Actual Disbursed (Spent)</span>
            <div className="text-2xl font-heading font-extrabold text-[#466557] mt-1">
              {formatBudgetCurrency(summary?.actualSpent || 0, activeCurrency)}
            </div>
            <div className="mt-2 text-[11px] flex items-center justify-between">
              <span className="text-[#797583]">Liquid Cash in Hand:</span>
              <span
                className={`font-semibold ${
                  (summary?.remainingCash || 0) < 0 ? "text-rose-600 font-bold" : "text-[#466557]"
                }`}
              >
                {formatBudgetCurrency(summary?.remainingCash || 0, activeCurrency)}
              </span>
            </div>
          </Card>

          {/* 4. Committed Obligations & Contingency Reserve */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-heading font-semibold text-[#797583]">Committed Obligations</span>
              {Boolean(summary?.contingencyAllocated) && (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full">
                  Buffer Protected
                </span>
              )}
            </div>
            <div className="text-2xl font-heading font-extrabold text-[#884a0f] mt-1">
              {formatBudgetCurrency(summary?.committedCosts || 0, activeCurrency)}
            </div>
            <div className="mt-2 text-[11px] flex items-center justify-between">
              <span className="text-[#797583]">Contingency Reserve:</span>
              <span className="font-semibold text-[#884a0f]">
                {formatBudgetCurrency(summary?.contingencyAllocated || 0, activeCurrency)}
              </span>
            </div>
          </Card>
        </div>

        {/* Visual Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Planned vs Committed vs Disbursed</CardTitle>
              <CardDescription>Category-wise cost comparison across current lifecycle</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-xs text-[#797583]">
                  No budget items created yet. Add expenses to generate analytical charts.
                </div>
              ) : (
                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                      <XAxis
                        dataKey="name"
                        fontSize={11}
                        stroke="#797583"
                        angle={-15}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis
                        fontSize={11}
                        stroke="#797583"
                        tickFormatter={(v) =>
                          activeCurrency === "₹"
                            ? `₹${v >= 100000 ? (v / 100000).toFixed(1) + "L" : v}`
                            : `${activeCurrency}${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`
                        }
                      />
                      <Tooltip
                        formatter={(val: unknown) => [
                          formatBudgetCurrency(Number(val), activeCurrency),
                        ]}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "11px" }} />
                      <Bar dataKey="Planned" fill="#e5deff" radius={[4, 4, 0, 0]} name="Planned Target" />
                      <Bar dataKey="Committed" fill="#7364c7" radius={[4, 4, 0, 0]} name="Committed Cost" />
                      <Bar dataKey="Disbursed" fill="#466557" radius={[4, 4, 0, 0]} name="Actual Disbursed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Expenditure Distribution</CardTitle>
              <CardDescription>Allocated budget envelope split</CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-xs text-[#797583]">
                  No categories to display.
                </div>
              ) : (
                <>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={44}
                          outerRadius={68}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: unknown) => [
                            formatBudgetCurrency(Number(v), activeCurrency),
                            "Planned",
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 mt-2 text-[11px] text-[#484552] max-h-28 overflow-y-auto pr-1">
                    {pieData.map((item, idx) => {
                      const pct = summary?.estimatedTotal
                        ? Math.round((item.value / summary.estimatedTotal) * 100)
                        : 0;
                      return (
                        <div key={item.name} className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 truncate max-w-[140px]">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                            />
                            <span className="truncate">{item.name}</span>
                          </span>
                          <span className="font-semibold text-[#181c23]">
                            {pct}% ({formatBudgetCurrency(item.value, activeCurrency)})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Master Ledger Table */}
        <Card>
          <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-heading font-bold text-[#181c23]">
                Category Contract & Expense Ledger
              </CardTitle>
              <CardDescription>
                Live line items, contractual commitments, and settlement records
              </CardDescription>
            </div>
            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedCategoryFilter("all")}
                className={`px-2.5 py-1 rounded-full text-xs font-heading font-semibold transition-colors cursor-pointer ${
                  selectedCategoryFilter === "all"
                    ? "bg-[#181c23] text-white"
                    : "bg-[#faf9f6] text-[#797583] hover:bg-[#eae6df]"
                }`}
              >
                All ({items.length})
              </button>
              {distinctCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-heading font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategoryFilter === cat
                      ? "bg-[#5a4bac] text-white"
                      : "bg-[#faf9f6] text-[#797583] hover:bg-[#eae6df]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            {filteredItems.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <PieIcon className="w-8 h-8 text-[#797583] mx-auto opacity-50" />
                <p className="text-xs text-[#797583] font-medium">No expense items found in this view.</p>
                <Button size="sm" variant="outline" onClick={() => setShowAddModal(true)}>
                  Add First Expense
                </Button>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#faf9f6] text-[#797583] font-heading font-semibold border-y border-[#eae6df]">
                  <tr>
                    <th className="py-3 px-6">Category & Description</th>
                    <th className="py-3 px-4 text-right">Planned Target</th>
                    <th className="py-3 px-4 text-right">Actual Disbursed</th>
                    <th className="py-3 px-4 text-right">Committed Obligation</th>
                    <th className="py-3 px-4 text-right">Variance</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f4f0]">
                  {filteredItems.map((item) => {
                    const variance = item.estimatedAmount - item.actualAmount;
                    const isOverrun = item.actualAmount > item.estimatedAmount && item.estimatedAmount > 0;
                    let committedVal = 0;
                    if (item.paymentStatus === "paid") committedVal = item.actualAmount;
                    else if (item.paymentStatus === "deposit_paid") committedVal = Math.max(item.actualAmount, item.estimatedAmount);

                    return (
                      <tr key={item._id || item.id} className="hover:bg-[#faf9f6]/70 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-bold text-[#181c23]">
                              {item.category}
                            </span>
                            {item.isContingency && (
                              <Badge variant="peach" size="sm">
                                Contingency
                              </Badge>
                            )}
                            {isOverrun && (
                              <Badge variant="danger" size="sm">
                                Overrun
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-[#484552] mt-0.5 max-w-sm truncate">
                            {item.description}
                          </div>
                          {item.notes && (
                            <div className="text-[10px] text-[#797583] italic mt-0.5">
                              Memo: {item.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right text-[#797583] font-mono">
                          {formatBudgetCurrency(item.estimatedAmount, activeCurrency)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-heading font-bold text-[#181c23] font-mono">
                          {formatBudgetCurrency(item.actualAmount, activeCurrency)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-[#5a4bac] font-semibold">
                          {formatBudgetCurrency(committedVal, activeCurrency)}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-mono font-medium ${
                            variance < 0 ? "text-rose-600 font-bold" : "text-[#466557]"
                          }`}
                        >
                          {variance >= 0 ? "+" : ""}
                          {formatBudgetCurrency(variance, activeCurrency)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge
                            variant={
                              item.paymentStatus === "paid"
                                ? "sage"
                                : item.paymentStatus === "deposit_paid"
                                ? "default"
                                : "warning"
                            }
                            size="sm"
                          >
                            {item.paymentStatus === "paid"
                              ? "Paid Full"
                              : item.paymentStatus === "deposit_paid"
                              ? "Deposit Paid"
                              : "Unpaid / Quote"}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg text-[#797583] hover:text-[#5a4bac] hover:bg-[#faf9f6] transition-colors cursor-pointer"
                              title="Edit Item"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingItem(item)}
                              className="p-1.5 rounded-lg text-[#797583] hover:text-[#ba1a1a] hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Add Expense Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#eae6df] space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b pb-3 border-[#eae6df]">
                <div>
                  <h3 className="font-heading font-bold text-base text-[#181c23]">
                    Add Budget Line Item
                  </h3>
                  <p className="text-xs text-[#797583]">
                    Record a planned envelope target or actual payment contract
                  </p>
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

              <form onSubmit={handleAddItemSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                  {addForm.category === "Other" && (
                    <Input
                      label="Custom Category Name"
                      placeholder="e.g. Vintage Car Hire"
                      value={addForm.customCategory}
                      onChange={(e) => setAddForm({ ...addForm, customCategory: e.target.value })}
                      required
                    />
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-heading font-semibold text-[#181c23]">
                      Payment Status
                    </label>
                    <select
                      value={addForm.paymentStatus}
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          paymentStatus: e.target.value as "unpaid" | "deposit_paid" | "paid",
                        })
                      }
                      className="h-10 rounded-xl border border-[#eae6df] bg-white px-3 text-xs text-[#181c23] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20"
                    >
                      <option value="unpaid">Unpaid / Initial Estimate</option>
                      <option value="deposit_paid">Deposit Paid (Contract Active)</option>
                      <option value="paid">Fully Settled / Paid</option>
                    </select>
                  </div>
                </div>

                <Input
                  label="Description / Vendor Partner"
                  placeholder="e.g. Royal Saffron Catering - 3 Banquets"
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={`Planned Target (${activeCurrency})`}
                    type="number"
                    min="0"
                    step="1"
                    value={addForm.estimatedAmount}
                    onChange={(e) =>
                      setAddForm({ ...addForm, estimatedAmount: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                  <Input
                    label={`Actual Disbursed (${activeCurrency})`}
                    type="number"
                    min="0"
                    step="1"
                    value={addForm.actualAmount}
                    onChange={(e) =>
                      setAddForm({ ...addForm, actualAmount: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </div>

                <Input
                  label="Notes / Payment Terms (Optional)"
                  placeholder="e.g. 50% advance disbursed, balance on event date"
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                />

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={addForm.isContingency}
                    onChange={(e) => setAddForm({ ...addForm, isContingency: e.target.checked })}
                    className="w-4 h-4 rounded text-[#5a4bac] focus:ring-[#7364c7]"
                  />
                  <span className="text-xs text-[#484552]">
                    Mark as Contingency Reserve (treated as planned allocation buffer)
                  </span>
                </label>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#eae6df]">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmittingAdd}>
                    {isSubmittingAdd ? "Saving..." : "Add Expense Item"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Expense Modal */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#eae6df] space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b pb-3 border-[#eae6df]">
                <div>
                  <h3 className="font-heading font-bold text-base text-[#181c23]">
                    Edit Budget Item
                  </h3>
                  <p className="text-xs text-[#797583]">Update amounts, notes, or payment status</p>
                </div>
                <button
                  onClick={() => setEditingItem(null)}
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

              <form onSubmit={handleEditItemSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Category"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    required
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-heading font-semibold text-[#181c23]">
                      Payment Status
                    </label>
                    <select
                      value={editForm.paymentStatus}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          paymentStatus: e.target.value as "unpaid" | "deposit_paid" | "paid",
                        })
                      }
                      className="h-10 rounded-xl border border-[#eae6df] bg-white px-3 text-xs text-[#181c23] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20"
                    >
                      <option value="unpaid">Unpaid / Initial Estimate</option>
                      <option value="deposit_paid">Deposit Paid (Contract Active)</option>
                      <option value="paid">Fully Settled / Paid</option>
                    </select>
                  </div>
                </div>

                <Input
                  label="Description / Vendor Partner"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={`Planned Target (${activeCurrency})`}
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.estimatedAmount}
                    onChange={(e) =>
                      setEditForm({ ...editForm, estimatedAmount: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                  <Input
                    label={`Actual Disbursed (${activeCurrency})`}
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.actualAmount}
                    onChange={(e) =>
                      setEditForm({ ...editForm, actualAmount: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </div>

                <Input
                  label="Notes / Terms"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={editForm.isContingency}
                    onChange={(e) => setEditForm({ ...editForm, isContingency: e.target.checked })}
                    className="w-4 h-4 rounded text-[#5a4bac] focus:ring-[#7364c7]"
                  />
                  <span className="text-xs text-[#484552]">
                    Mark as Contingency Reserve Buffer
                  </span>
                </label>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#eae6df]">
                  <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
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
        {deletingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-[#eae6df] space-y-4 animate-in zoom-in-95 duration-150">
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-base text-[#ba1a1a] flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Remove Budget Item?
                </h3>
                <p className="text-xs text-[#484552]">
                  Are you sure you want to delete{" "}
                  <strong className="text-[#181c23]">{deletingItem.description}</strong> (
                  {formatBudgetCurrency(deletingItem.estimatedAmount, activeCurrency)})? This action
                  will immediately update remaining balances and totals.
                </p>
              </div>

              {deleteError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                  {deleteError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setDeletingItem(null)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* AI Envelopes Studio Modal */}
        {showAIModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-[#eae6df] space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b pb-3 border-[#eae6df]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#7364c7]/10 flex items-center justify-center text-[#5a4bac]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#181c23]">
                      AI Smart Envelopes Studio
                    </h3>
                    <p className="text-xs text-[#797583]">
                      Industry benchmarks for {event?.type || "wedding"}s with authoritative application rounding
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIModal(false)}
                  className="text-[#797583] hover:text-[#181c23] text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {aiSuccessMessage ? (
                <div className="p-6 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-[#466557] mx-auto animate-bounce" />
                  <h4 className="text-sm font-heading font-bold text-[#181c23]">{aiSuccessMessage}</h4>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-[#faf9f6] rounded-2xl border border-[#eae6df] text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-[#181c23]">
                      <span>Authorized Budget Ceiling:</span>
                      <span className="font-mono text-[#5a4bac]">
                        {formatBudgetCurrency(event?.totalBudget || 0, activeCurrency)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#797583]">
                      The AI recommends distribution percentages based on high-end event archetypes. All
                      monetary values are calculated strictly by the Planora financial engine with 0% drift.
                    </p>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {isLoadingAI ? (
                      <div className="py-12 text-center text-xs text-[#797583]">
                        Calculating archetype allocations...
                      </div>
                    ) : (
                      aiSuggestions.map((s) => (
                        <div
                          key={s.category}
                          className="p-3 rounded-2xl border border-[#eae6df] bg-white flex items-center justify-between gap-3 hover:border-[#7364c7]/40 transition-colors"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-heading font-bold text-[#181c23] truncate">
                                {s.category}
                              </span>
                              <Badge variant={s.isContingency ? "peach" : "sage"} size="sm">
                                {s.percentage}%
                              </Badge>
                            </div>
                            <p className="text-[11px] text-[#797583] truncate">{s.description}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-heading font-bold text-[#181c23] font-mono">
                              {formatBudgetCurrency(s.recommendedAmount, activeCurrency)}
                            </div>
                            <span className="text-[10px] text-[#466557]">Calculated Envelope</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#eae6df]">
                    <div className="text-[11px] text-[#797583] flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-[#7364c7]" />
                      <span>Applies as fresh line items; existing expenses are preserved.</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowAIModal(false)}>
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleApplyAISuggestions}
                        disabled={isApplyingAI || isLoadingAI}
                        leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                      >
                        {isApplyingAI ? "Applying Envelopes..." : "Apply to Ledger"}
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
