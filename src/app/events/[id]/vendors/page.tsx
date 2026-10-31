"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Mail,
  Phone,
  MapPin,
  Pencil,
  Trash2,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Search,
  TableProperties,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EventWorkspaceHeader } from "@/components/events/EventWorkspaceHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { formatBudgetCurrency } from "@/lib/domain/budget";
import type { VendorCategory, BookingStatus, PriceRange, EventType, EventStatus } from "@/lib/types";

interface VendorProfile {
  _id?: string;
  id?: string;
  name: string;
  category: VendorCategory;
  location: string;
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
    website?: string;
  };
  priceRange: PriceRange;
  verificationStatus: "verified" | "unverified" | "preferred";
  serviceDescription?: string;
  isSampleData?: boolean;
  isShared?: boolean;
}

interface EventVendorItem {
  _id?: string;
  id?: string;
  eventId: string;
  vendorId: string;
  estimatedAmount: number;
  quotedAmount: number;
  actualPaid: number;
  bookingStatus: BookingStatus;
  notes?: string;
  vendor?: VendorProfile;
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

const CATEGORIES: { key: string; label: string }[] = [
  { key: "all", label: "All Categories" },
  { key: "venue", label: "Venue & Estates" },
  { key: "catering", label: "Catering & Banquet" },
  { key: "photography", label: "Photography & Film" },
  { key: "music", label: "Music & Entertainment" },
  { key: "decor", label: "Decor & Lighting" },
  { key: "florals", label: "Florals & Staging" },
  { key: "attire", label: "Attire & Beauty" },
  { key: "other", label: "Other Services" },
];

const BOOKING_STATUSES: { key: BookingStatus; label: string; badgeVariant: "sage" | "peach" | "warning" | "default" | "danger" }[] = [
  { key: "shortlisted", label: "Shortlisted", badgeVariant: "default" },
  { key: "contacted", label: "Contacted", badgeVariant: "warning" },
  { key: "booked", label: "Booked (Active)", badgeVariant: "sage" },
  { key: "completed", label: "Completed", badgeVariant: "sage" },
  { key: "cancelled", label: "Cancelled", badgeVariant: "danger" },
];

export default function EventVendorsPage() {
  const params = useParams();
  const eventId = (params?.id as string) || "evt-aarav-meera";

  const [event, setEvent] = React.useState<EventMetadata | null>(null);
  const [eventVendors, setEventVendors] = React.useState<EventVendorItem[]>([]);
  const [directoryVendors, setDirectoryVendors] = React.useState<VendorProfile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  // Tab View: "event_vendors" | "comparison" | "directory"
  const [activeTab, setActiveTab] = React.useState<"event_vendors" | "comparison" | "directory">("event_vendors");

  // Directory Filters
  const [dirCategory, setDirCategory] = React.useState<string>("all");
  const [dirLocation, setDirLocation] = React.useState<string>("");
  const [dirPriceRange, setDirPriceRange] = React.useState<string>("all");

  // Add to Event Modal
  const [selectedVendorForAdd, setSelectedVendorForAdd] = React.useState<VendorProfile | null>(null);
  const [addForm, setAddForm] = React.useState({
    estimatedAmount: 100000,
    quotedAmount: 100000,
    actualPaid: 0,
    bookingStatus: "shortlisted" as BookingStatus,
    notes: "",
  });
  const [isAddingToEvent, setIsAddingToEvent] = React.useState(false);
  const [addEventError, setAddEventError] = React.useState<string | null>(null);

  // Register Custom Vendor Modal
  const [showRegisterModal, setShowRegisterModal] = React.useState(false);
  const [registerForm, setRegisterForm] = React.useState({
    name: "",
    category: "venue" as VendorCategory,
    location: "Jaipur, Rajasthan",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    priceRange: "$$" as PriceRange,
    serviceDescription: "",
    directAddToEvent: true,
    estimatedAmount: 50000,
    quotedAmount: 50000,
  });
  const [isSubmittingRegister, setIsSubmittingRegister] = React.useState(false);
  const [registerError, setRegisterError] = React.useState<string | null>(null);

  // Edit Event Vendor Modal
  const [editingEventVendor, setEditingEventVendor] = React.useState<EventVendorItem | null>(null);
  const [editForm, setEditForm] = React.useState({
    estimatedAmount: 0,
    quotedAmount: 0,
    actualPaid: 0,
    bookingStatus: "shortlisted" as BookingStatus,
    notes: "",
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);

  // Delete Confirm Modal
  const [deletingVendor, setDeletingVendor] = React.useState<EventVendorItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Process Event Vendors Response
  const handleEventVendorsResponse = React.useCallback(
    (data: { event?: Record<string, unknown>; vendors: Record<string, unknown>[] }) => {
      if (data.event) {
        setEvent({
          id: (data.event.id as string) || eventId,
          title: (data.event.title as string) || "Event Workspace",
          type: (data.event.type as EventType) || "wedding",
          status: (data.event.status as EventStatus) || "planning",
          date: (data.event.date as string) || "2026-12-14",
          location: (data.event.location as string) || "Jaipur, Rajasthan",
          guestCount: Number(data.event.guestCount || 100),
          totalBudget: Number(data.event.totalBudget || 3850000),
          currency: (data.event.currency as string) || "₹",
        });
      }

      const list: EventVendorItem[] = data.vendors.map((ev) => ({
        id: (ev._id || ev.id) as string,
        _id: (ev._id || ev.id) as string,
        eventId: (ev.eventId as string) || eventId,
        vendorId: (ev.vendorId as string) || "",
        estimatedAmount: Number(ev.estimatedAmount || 0),
        quotedAmount: Number(ev.quotedAmount || 0),
        actualPaid: Number(ev.actualPaid || 0),
        bookingStatus: (ev.bookingStatus as BookingStatus) || "shortlisted",
        notes: (ev.notes as string) || "",
        vendor: ev.vendor ? (ev.vendor as VendorProfile) : undefined,
      }));

      setEventVendors(list);
    },
    [eventId]
  );

  // Fetch Event Vendors & Directory Data
  React.useEffect(() => {
    let isMounted = true;
    async function fetchAll() {
      try {
        const [eventRes, dirRes] = await Promise.all([
          fetch(`/api/events/${eventId}/vendors`),
          fetch("/api/vendors"),
        ]);

        const eventData = await eventRes.json();
        const dirData = await dirRes.json();

        if (!isMounted) return;

        if (!eventRes.ok) {
          if (eventId === "evt-aarav-meera") {
            // Demo fallback
            setEvent({
              id: "evt-aarav-meera",
              title: "Aarav & Meera Wedding Celebration",
              type: "wedding",
              status: "confirmed",
              date: "2026-12-14",
              location: "Jaipur Royal Palace & Grounds, Rajasthan",
              guestCount: 350,
              totalBudget: 3850000,
              currency: "₹",
            });
            setEventVendors([
              {
                id: "ev-1",
                eventId: "evt-aarav-meera",
                vendorId: "v-sample-1",
                estimatedAmount: 600000,
                quotedAmount: 580000,
                actualPaid: 580000,
                bookingStatus: "booked",
                notes: "Scented jasmine arches, marigold chandeliers, brass urn arrangements.",
                vendor: {
                  id: "v-sample-1",
                  name: "Wildflower Botanical Studio",
                  category: "florals",
                  location: "Jaipur, Rajasthan",
                  contact: { name: "Ananya Deshmukh", email: "sample.ananya@wildflowerstudio.demo", phone: "+91 98201 00001", website: "https://example.com" },
                  priceRange: "$$$",
                  verificationStatus: "preferred",
                  serviceDescription: "Royal floral architecture and scented floral canopies.",
                  isSampleData: true,
                },
              },
              {
                id: "ev-2",
                eventId: "evt-aarav-meera",
                vendorId: "v-sample-2",
                estimatedAmount: 1100000,
                quotedAmount: 1050000,
                actualPaid: 600000,
                bookingStatus: "booked",
                notes: "Authentic Dal Baati Churma, royal galouti kebabs, live kulfi bar.",
                vendor: {
                  id: "v-sample-2",
                  name: "Royal Saffron Heritage Banquets",
                  category: "catering",
                  location: "Jaipur, Rajasthan",
                  contact: { name: "Chef Ranveer Rathore", email: "sample.chef@royalsaffron.demo", phone: "+91 98450 00002" },
                  priceRange: "$$$$",
                  verificationStatus: "verified",
                  serviceDescription: "Authentic royal banquets and multi-course feasts.",
                  isSampleData: true,
                },
              },
              {
                id: "ev-3",
                eventId: "evt-aarav-meera",
                vendorId: "v-sample-3",
                estimatedAmount: 500000,
                quotedAmount: 480000,
                actualPaid: 240000,
                bookingStatus: "booked",
                notes: "4K drone aerial shots and curated cinematic wedding trailer.",
                vendor: {
                  id: "v-sample-3",
                  name: "Stories by Joseph Radhik",
                  category: "photography",
                  location: "Mumbai & Pan-India",
                  contact: { name: "Studio Desk", email: "sample.desk@stories.demo", phone: "+91 99203 00003" },
                  priceRange: "$$$$",
                  verificationStatus: "preferred",
                  serviceDescription: "Master wedding photography and cinema.",
                  isSampleData: true,
                },
              },
              {
                id: "ev-4",
                eventId: "evt-aarav-meera",
                vendorId: "v-sample-4",
                estimatedAmount: 400000,
                quotedAmount: 390000,
                actualPaid: 100000,
                bookingStatus: "shortlisted",
                notes: "Awaiting sound curfew clarification for acoustic transition after 10 PM.",
                vendor: {
                  id: "v-sample-4",
                  name: "Sangeet Brass & Sufi Ensemble",
                  category: "music",
                  location: "Jaipur & Delhi NCR",
                  contact: { name: "Vikram Sen", email: "sample.vikram@sangeetbrass.demo", phone: "+91 98112 00004" },
                  priceRange: "$$",
                  verificationStatus: "verified",
                  serviceDescription: "Manganiyar folk vocalists and 12-piece brass processional.",
                  isSampleData: true,
                },
              },
            ]);
          } else {
            setFetchError(eventData?.error?.message || "Failed to load vendors");
          }
        } else {
          handleEventVendorsResponse(eventData.data);
        }

        if (dirRes.ok && dirData?.data?.vendors) {
          setDirectoryVendors(dirData.data.vendors);
        }
      } catch (err: unknown) {
        if (isMounted) setFetchError(err instanceof Error ? err.message : "Error connecting to vendor services");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchAll();
    return () => {
      isMounted = false;
    };
  }, [eventId, handleEventVendorsResponse]);

  // Refresh Event Vendors
  const refreshEventVendors = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/vendors`);
      const data = await res.json();
      if (res.ok) {
        handleEventVendorsResponse(data.data);
      }
    } catch {
      // background
    }
  }, [eventId, handleEventVendorsResponse]);

  // Fetch Directory Vendors on Tab or Filter Change
  React.useEffect(() => {
    let active = true;

    async function loadDirectory() {
      if (activeTab !== "directory") return;
      try {
        const query = new URLSearchParams();
        if (dirCategory !== "all") query.set("category", dirCategory);
        if (dirLocation.trim()) query.set("location", dirLocation.trim());
        if (dirPriceRange !== "all") query.set("priceRange", dirPriceRange);

        const res = await fetch(`/api/vendors?${query.toString()}`);
        const data = await res.json();
        if (active && res.ok && data?.data?.vendors) {
          setDirectoryVendors(data.data.vendors);
        }
      } catch {
        // background fetch error
      }
    }

    loadDirectory();

    return () => {
      active = false;
    };
  }, [activeTab, dirCategory, dirLocation, dirPriceRange]);

  const refreshDirectory = React.useCallback(async () => {
    try {
      const query = new URLSearchParams();
      if (dirCategory !== "all") query.set("category", dirCategory);
      if (dirLocation.trim()) query.set("location", dirLocation.trim());
      if (dirPriceRange !== "all") query.set("priceRange", dirPriceRange);

      const res = await fetch(`/api/vendors?${query.toString()}`);
      const data = await res.json();
      if (res.ok && data?.data?.vendors) {
        setDirectoryVendors(data.data.vendors);
      }
    } catch {
      // background refresh
    }
  }, [dirCategory, dirLocation, dirPriceRange]);

  // Handle Add to Event Submission
  async function handleAddVendorToEventSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVendorForAdd) return;
    setIsAddingToEvent(true);
    setAddEventError(null);

    const vendorId = selectedVendorForAdd._id || selectedVendorForAdd.id;

    try {
      if (eventId === "evt-aarav-meera") {
        const newEv: EventVendorItem = {
          id: `ev-${Date.now()}`,
          eventId,
          vendorId: vendorId || "",
          estimatedAmount: Number(addForm.estimatedAmount),
          quotedAmount: Number(addForm.quotedAmount),
          actualPaid: Number(addForm.actualPaid),
          bookingStatus: addForm.bookingStatus,
          notes: addForm.notes,
          vendor: selectedVendorForAdd,
        };
        setEventVendors((prev) => [...prev, newEv]);
        setSelectedVendorForAdd(null);
        setActiveTab("event_vendors");
        setIsAddingToEvent(false);
        return;
      }

      const res = await fetch(`/api/events/${eventId}/vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          estimatedAmount: Number(addForm.estimatedAmount),
          quotedAmount: Number(addForm.quotedAmount),
          actualPaid: Number(addForm.actualPaid),
          bookingStatus: addForm.bookingStatus,
          notes: addForm.notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to add vendor to event");
      }

      await refreshEventVendors();
      setSelectedVendorForAdd(null);
      setActiveTab("event_vendors");
    } catch (err: unknown) {
      setAddEventError(err instanceof Error ? err.message : "Error adding vendor");
    } finally {
      setIsAddingToEvent(false);
    }
  }

  // Handle Register New Vendor Submission
  async function handleRegisterVendorSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmittingRegister(true);
    setRegisterError(null);

    const vendorPayload = {
      name: registerForm.name.trim(),
      category: registerForm.category,
      location: registerForm.location.trim(),
      contact: {
        name: registerForm.contactName.trim() || undefined,
        email: registerForm.email.trim() || undefined,
        phone: registerForm.phone.trim() || undefined,
        website: registerForm.website.trim() || undefined,
      },
      priceRange: registerForm.priceRange,
      serviceDescription: registerForm.serviceDescription.trim() || undefined,
      isShared: false,
      isSampleData: false,
    };

    try {
      if (eventId === "evt-aarav-meera") {
        const customVendor: VendorProfile = {
          id: `v-custom-${Date.now()}`,
          ...vendorPayload,
          verificationStatus: "unverified",
        };
        setDirectoryVendors((prev) => [customVendor, ...prev]);

        if (registerForm.directAddToEvent) {
          const newEv: EventVendorItem = {
            id: `ev-${Date.now()}`,
            eventId,
            vendorId: customVendor.id || "",
            estimatedAmount: Number(registerForm.estimatedAmount),
            quotedAmount: Number(registerForm.quotedAmount),
            actualPaid: 0,
            bookingStatus: "shortlisted",
            notes: "Directly added by event organizer",
            vendor: customVendor,
          };
          setEventVendors((prev) => [...prev, newEv]);
        }

        setShowRegisterModal(false);
        setIsSubmittingRegister(false);
        return;
      }

      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vendorPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to register vendor");
      }

      const createdVendor = data.data.vendor;

      if (registerForm.directAddToEvent && createdVendor._id) {
        await fetch(`/api/events/${eventId}/vendors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendorId: createdVendor._id,
            estimatedAmount: Number(registerForm.estimatedAmount),
            quotedAmount: Number(registerForm.quotedAmount),
            actualPaid: 0,
            bookingStatus: "shortlisted",
            notes: "Directly registered and added by organizer",
          }),
        });
        await refreshEventVendors();
      }

      await refreshDirectory();
      setShowRegisterModal(false);
    } catch (err: unknown) {
      setRegisterError(err instanceof Error ? err.message : "Error registering vendor");
    } finally {
      setIsSubmittingRegister(false);
    }
  }

  // Open Edit Event Vendor Modal
  function handleOpenEditEventVendor(item: EventVendorItem) {
    setEditingEventVendor(item);
    setEditError(null);
    setEditForm({
      estimatedAmount: item.estimatedAmount,
      quotedAmount: item.quotedAmount,
      actualPaid: item.actualPaid,
      bookingStatus: item.bookingStatus,
      notes: item.notes || "",
    });
  }

  // Handle Edit Submit
  async function handleEditEventVendorSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEventVendor) return;
    setIsSubmittingEdit(true);
    setEditError(null);

    const evId = editingEventVendor._id || editingEventVendor.id;
    const payload = {
      estimatedAmount: Number(editForm.estimatedAmount),
      quotedAmount: Number(editForm.quotedAmount),
      actualPaid: Number(editForm.actualPaid),
      bookingStatus: editForm.bookingStatus,
      notes: editForm.notes.trim() || undefined,
    };

    try {
      if (eventId === "evt-aarav-meera") {
        setEventVendors((prev) =>
          prev.map((ev) => ((ev._id || ev.id) === evId ? { ...ev, ...payload } : ev))
        );
        setEditingEventVendor(null);
        setIsSubmittingEdit(false);
        return;
      }

      const res = await fetch(`/api/events/${eventId}/vendors/${evId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to update vendor contract");
      }

      await refreshEventVendors();
      setEditingEventVendor(null);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Error updating contract");
    } finally {
      setIsSubmittingEdit(false);
    }
  }

  // Handle Delete Confirm
  async function handleDeleteConfirm() {
    if (!deletingVendor) return;
    setIsDeleting(true);

    const evId = deletingVendor._id || deletingVendor.id;

    try {
      if (eventId === "evt-aarav-meera") {
        setEventVendors((prev) => prev.filter((ev) => (ev._id || ev.id) !== evId));
        setDeletingVendor(null);
        setIsDeleting(false);
        return;
      }

      const res = await fetch(`/api/events/${eventId}/vendors/${evId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to remove vendor from event");
      }

      await refreshEventVendors();
      setDeletingVendor(null);
    } catch {
      alert("Failed to remove vendor");
    } finally {
      setIsDeleting(false);
    }
  }

  // Metrics
  const activeCurrency = event?.currency || "₹";
  const totalVendors = eventVendors.length;
  const totalQuoted = eventVendors.reduce((sum, v) => sum + v.quotedAmount, 0);
  const totalDisbursed = eventVendors.reduce((sum, v) => sum + v.actualPaid, 0);
  const bookedCount = eventVendors.filter((v) => v.bookingStatus === "booked" || v.bookingStatus === "completed").length;

  if (isLoading) {
    return (
      <AppShell activeEventTitle="Loading Vendors..." activeEventLocation="Synchronizing" eventId={eventId}>
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
            daysRemaining={142}
            location={event.location}
            guestCount={event.guestCount}
            budgetTotal={event.totalBudget}
            currency={activeCurrency}
          />
        )}

        {fetchError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs">
            {fetchError}
          </div>
        )}

        {/* 4 Vendor Health KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <span className="text-xs font-heading font-semibold text-[#797583]">Contracted Vendors</span>
            <div className="text-2xl font-heading font-extrabold text-[#181c23] mt-1">
              {totalVendors}
            </div>
            <p className="text-[11px] text-[#466557] font-semibold mt-2">
              {bookedCount} locked under active contract
            </p>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-heading font-semibold text-[#797583]">Total Quoted Commitments</span>
            <div className="text-2xl font-heading font-extrabold text-[#5a4bac] mt-1">
              {formatBudgetCurrency(totalQuoted, activeCurrency)}
            </div>
            <p className="text-[11px] text-[#797583] mt-2">Agreed contract values</p>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-heading font-semibold text-[#797583]">Disbursed Advances</span>
            <div className="text-2xl font-heading font-extrabold text-[#466557] mt-1">
              {formatBudgetCurrency(totalDisbursed, activeCurrency)}
            </div>
            <p className="text-[11px] text-[#797583] mt-2">
              Pending: {formatBudgetCurrency(Math.max(0, totalQuoted - totalDisbursed), activeCurrency)}
            </p>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-heading font-semibold text-[#797583]">Data Integrity & Verification</span>
            <div className="text-sm font-heading font-bold text-[#181c23] mt-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#466557]" />
              <span>Strict Transparency</span>
            </div>
            <p className="text-[11px] text-[#797583] mt-1">
              Manual entries clearly labeled; mock listings marked as sample data.
            </p>
          </Card>
        </div>

        {/* Action Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Main View Tabs */}
          <div className="flex items-center p-1 bg-[#f0eee9] rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab("event_vendors")}
              className={`px-4 py-1.5 text-xs font-heading font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "event_vendors"
                  ? "bg-white text-[#181c23] shadow-xs"
                  : "text-[#797583] hover:text-[#181c23]"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Event Vendors ({totalVendors})</span>
            </button>
            <button
              onClick={() => setActiveTab("comparison")}
              className={`px-4 py-1.5 text-xs font-heading font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "comparison"
                  ? "bg-white text-[#181c23] shadow-xs"
                  : "text-[#797583] hover:text-[#181c23]"
              }`}
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>Quotation Comparison</span>
            </button>
            <button
              onClick={() => setActiveTab("directory")}
              className={`px-4 py-1.5 text-xs font-heading font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "directory"
                  ? "bg-white text-[#181c23] shadow-xs"
                  : "text-[#797583] hover:text-[#181c23]"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Browse Directory</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                setRegisterError(null);
                setShowRegisterModal(true);
              }}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Register New Vendor
            </Button>
          </div>
        </div>

        {/* Tab 1: Event Vendors Cards View */}
        {activeTab === "event_vendors" && (
          <div className="space-y-4">
            {eventVendors.length === 0 ? (
              <Card className="py-16 text-center space-y-3">
                <Building2 className="w-10 h-10 text-[#797583] mx-auto opacity-50" />
                <h3 className="text-sm font-heading font-bold text-[#181c23]">
                  No vendors added to this celebration yet
                </h3>
                <p className="text-xs text-[#797583] max-w-sm mx-auto">
                  Browse the verified directory to shortlist partners or register private vendor contacts.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => setActiveTab("directory")}>
                    Browse Directory
                  </Button>
                  <Button size="sm" onClick={() => setShowRegisterModal(true)}>
                    Register Custom Vendor
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {eventVendors.map((item) => {
                  const v = item.vendor;
                  const isSample = v?.isSampleData;
                  const variance = item.estimatedAmount - item.quotedAmount;

                  return (
                    <Card
                      key={item._id || item.id}
                      className="p-5 space-y-3 border-[#eae6df] hover:border-[#7364c7]/40 transition-colors flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        {/* Header Tags */}
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="default" size="sm" className="capitalize">
                            {v?.category || "Partner"}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {isSample ? (
                              <Badge variant="warning" size="sm">
                                Sample Data
                              </Badge>
                            ) : (
                              <Badge variant="sage" size="sm">
                                Manually Entered
                              </Badge>
                            )}
                            <Badge
                              variant={
                                item.bookingStatus === "booked" || item.bookingStatus === "completed"
                                  ? "sage"
                                  : item.bookingStatus === "cancelled"
                                  ? "danger"
                                  : "warning"
                              }
                              size="sm"
                              className="capitalize"
                            >
                              {item.bookingStatus}
                            </Badge>
                          </div>
                        </div>

                        {/* Name & Location */}
                        <div>
                          <h4 className="text-sm font-heading font-bold text-[#181c23]">
                            {v?.name || "Contracted Vendor"}
                          </h4>
                          <p className="text-xs text-[#797583] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{v?.location || "Location on request"}</span>
                            <span className="font-mono font-semibold ml-1">({v?.priceRange || "$$"})</span>
                          </p>
                        </div>

                        {/* Service Description */}
                        {v?.serviceDescription && (
                          <p className="text-[11px] text-[#484552] line-clamp-2">
                            {v.serviceDescription}
                          </p>
                        )}

                        {/* Financial Quotes Breakdown */}
                        <div className="p-3 bg-[#faf9f6] rounded-2xl border border-[#eae6df] text-xs space-y-1.5 font-mono">
                          <div className="flex items-center justify-between text-[#797583]">
                            <span>Planned Estimate:</span>
                            <span>{formatBudgetCurrency(item.estimatedAmount, activeCurrency)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[#181c23] font-bold">
                            <span>Quoted Price:</span>
                            <span className="text-[#5a4bac]">
                              {formatBudgetCurrency(item.quotedAmount, activeCurrency)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[#466557] font-semibold">
                            <span>Actual Paid:</span>
                            <span>{formatBudgetCurrency(item.actualPaid, activeCurrency)}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-[#eae6df] text-[10px]">
                            <span className="text-[#797583]">Variance:</span>
                            <span className={variance < 0 ? "text-rose-600 font-bold" : "text-[#466557]"}>
                              {variance >= 0 ? "+" : ""}
                              {formatBudgetCurrency(variance, activeCurrency)}
                            </span>
                          </div>
                        </div>

                        {/* Private Notes */}
                        {item.notes && (
                          <p className="text-[10px] text-[#797583] italic border-l-2 border-[#7364c7]/40 pl-2">
                            Private Memo: {item.notes}
                          </p>
                        )}
                      </div>

                      {/* Footer Actions & Contact info */}
                      <div className="pt-3 border-t border-[#f5f4f0] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {v?.contact?.email && (
                            <a
                              href={`mailto:${v.contact.email}`}
                              className="p-1.5 rounded-lg bg-[#f0eee9] hover:bg-[#eae6df] text-[#484552] transition-colors"
                              title={v.contact.email}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {v?.contact?.phone && (
                            <a
                              href={`tel:${v.contact.phone}`}
                              className="p-1.5 rounded-lg bg-[#f0eee9] hover:bg-[#eae6df] text-[#484552] transition-colors"
                              title={v.contact.phone}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditEventVendor(item)}
                            className="p-1.5 rounded-lg text-[#797583] hover:text-[#5a4bac] hover:bg-[#faf9f6] transition-colors cursor-pointer"
                            title="Edit Quote & Contract"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingVendor(item)}
                            className="p-1.5 rounded-lg text-[#797583] hover:text-[#ba1a1a] hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove from Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Quotation Comparison Table */}
        {activeTab === "comparison" && (
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-heading font-bold text-[#181c23]">
                  Quotation Comparison Ledger
                </CardTitle>
                <CardDescription>
                  Side-by-side analysis of estimated allocations vs formal vendor quotations
                </CardDescription>
              </div>
              <span className="text-xs text-[#797583] font-semibold">{eventVendors.length} Quotes</span>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#faf9f6] text-[#797583] font-heading font-semibold border-y border-[#eae6df]">
                  <tr>
                    <th className="py-3 px-6">Vendor Partner</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Estimated Cost</th>
                    <th className="py-3 px-4 text-right">Quoted Price</th>
                    <th className="py-3 px-4 text-right">Disbursed Paid</th>
                    <th className="py-3 px-4 text-right">Variance</th>
                    <th className="py-3 px-4 text-center">Booking Status</th>
                    <th className="py-3 px-6">Private Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f4f0]">
                  {eventVendors.map((item) => {
                    const variance = item.estimatedAmount - item.quotedAmount;
                    const v = item.vendor;

                    return (
                      <tr key={item._id || item.id} className="hover:bg-[#faf9f6]/70 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="font-heading font-bold text-[#181c23]">
                            {v?.name || "Vendor Partner"}
                          </div>
                          <div className="text-[10px] text-[#797583]">
                            {v?.location || "Unspecified location"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 capitalize text-[#484552]">
                          {v?.category || "other"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-[#797583]">
                          {formatBudgetCurrency(item.estimatedAmount, activeCurrency)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-heading font-bold text-[#181c23]">
                          {formatBudgetCurrency(item.quotedAmount, activeCurrency)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#466557]">
                          {formatBudgetCurrency(item.actualPaid, activeCurrency)}
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
                              item.bookingStatus === "booked" || item.bookingStatus === "completed"
                                ? "sage"
                                : item.bookingStatus === "cancelled"
                                ? "danger"
                                : "warning"
                            }
                            size="sm"
                            className="capitalize"
                          >
                            {item.bookingStatus}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-6 text-[11px] text-[#484552] max-w-xs truncate">
                          {item.notes || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Browse Vendor Directory */}
        {activeTab === "directory" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-3xl border border-[#eae6df] shadow-2xs flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search by city or location..."
                  value={dirLocation}
                  onChange={(e) => setDirLocation(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <select
                value={dirCategory}
                onChange={(e) => setDirCategory(e.target.value)}
                className="h-10 rounded-xl border border-[#eae6df] bg-white px-3 text-xs text-[#181c23] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>

              <select
                value={dirPriceRange}
                onChange={(e) => setDirPriceRange(e.target.value)}
                className="h-10 rounded-xl border border-[#eae6df] bg-white px-3 text-xs text-[#181c23] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20"
              >
                <option value="all">All Budgets ($ - $$$$)</option>
                <option value="$">$ (Economy / Civic)</option>
                <option value="$$">$$ (Standard)</option>
                <option value="$$$">$$$ (Premium Heritage)</option>
                <option value="$$$$">$$$$ (Ultra Luxury)</option>
              </select>
            </div>

            {/* Directory Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {directoryVendors.map((vendor) => {
                const isSample = vendor.isSampleData;
                const isContracted = eventVendors.some(
                  (ev) => ev.vendorId === (vendor._id || vendor.id)
                );

                return (
                  <Card
                    key={vendor._id || vendor.id}
                    className="p-5 space-y-3 border-[#eae6df] hover:border-[#7364c7]/40 transition-colors flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="default" size="sm" className="capitalize">
                          {vendor.category}
                        </Badge>
                        <div className="flex items-center gap-1">
                          {isSample ? (
                            <Badge variant="warning" size="sm" title="Sample directory data for planning reference">
                              Sample Data
                            </Badge>
                          ) : (
                            <Badge variant="sage" size="sm">
                              Manually Entered
                            </Badge>
                          )}
                          <span className="text-xs font-mono font-bold text-[#5a4bac]">
                            {vendor.priceRange}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-heading font-bold text-[#181c23]">
                          {vendor.name}
                        </h4>
                        <p className="text-xs text-[#797583] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>{vendor.location}</span>
                        </p>
                      </div>

                      {vendor.serviceDescription && (
                        <p className="text-[11px] text-[#484552] line-clamp-3">
                          {vendor.serviceDescription}
                        </p>
                      )}

                      {vendor.contact && (
                        <div className="text-[11px] text-[#797583] space-y-0.5 pt-1">
                          {vendor.contact.name && <div>Contact: {vendor.contact.name}</div>}
                          {vendor.contact.email && <div>Email: {vendor.contact.email}</div>}
                          {vendor.contact.phone && <div>Phone: {vendor.contact.phone}</div>}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#f5f4f0] flex items-center justify-between">
                      <span className="text-[10px] text-[#797583]">
                        {vendor.verificationStatus === "preferred"
                          ? "★ Preferred Listing"
                          : "Standard Listing"}
                      </span>

                      {isContracted ? (
                        <span className="text-xs font-semibold text-[#466557] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Added to Event</span>
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedVendorForAdd(vendor);
                            setAddEventError(null);
                            setAddForm({
                              estimatedAmount: 100000,
                              quotedAmount: 100000,
                              actualPaid: 0,
                              bookingStatus: "shortlisted",
                              notes: "",
                            });
                          }}
                        >
                          Add to Event
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Vendor To Event Modal */}
        {selectedVendorForAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#eae6df] space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b pb-3 border-[#eae6df]">
                <div>
                  <h3 className="font-heading font-bold text-base text-[#181c23]">
                    Add {selectedVendorForAdd.name} to Event
                  </h3>
                  <p className="text-xs text-[#797583]">Set target estimate, quotation, and contract status</p>
                </div>
                <button
                  onClick={() => setSelectedVendorForAdd(null)}
                  className="text-[#797583] hover:text-[#181c23] text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {addEventError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                  {addEventError}
                </div>
              )}

              <form onSubmit={handleAddVendorToEventSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={`Estimated Target (${activeCurrency})`}
                    type="number"
                    min="0"
                    value={addForm.estimatedAmount}
                    onChange={(e) =>
                      setAddForm({ ...addForm, estimatedAmount: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />

                  <Input
                    label={`Quoted Amount (${activeCurrency})`}
                    type="number"
                    min="0"
                    value={addForm.quotedAmount}
                    onChange={(e) =>
                      setAddForm({ ...addForm, quotedAmount: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={`Initial Advance Paid (${activeCurrency})`}
                    type="number"
                    min="0"
                    value={addForm.actualPaid}
                    onChange={(e) =>
                      setAddForm({ ...addForm, actualPaid: parseFloat(e.target.value) || 0 })
                    }
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-heading font-semibold text-[#181c23]">
                      Booking Status
                    </label>
                    <select
                      value={addForm.bookingStatus}
                      onChange={(e) =>
                        setAddForm({ ...addForm, bookingStatus: e.target.value as BookingStatus })
                      }
                      className="h-10 rounded-xl border border-[#eae6df] bg-white px-3 text-xs text-[#181c23] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20"
                    >
                      {BOOKING_STATUSES.map((st) => (
                        <option key={st.key} value={st.key}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Input
                  label="Private Organizer Notes / Scope"
                  placeholder="e.g. Awaiting sound curfew clarification, 50% deposit on contract signing"
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                />

                <div className="flex justify-end gap-2 pt-3 border-t border-[#eae6df]">
                  <Button type="button" variant="outline" onClick={() => setSelectedVendorForAdd(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isAddingToEvent}>
                    {isAddingToEvent ? "Adding..." : "Add to Event"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Register Custom Vendor Modal */}
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#eae6df] space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b pb-3 border-[#eae6df]">
                <div>
                  <h3 className="font-heading font-bold text-base text-[#181c23]">
                    Register New Vendor Partner
                  </h3>
                  <p className="text-xs text-[#797583]">Save manually entered vendor to private directory</p>
                </div>
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="text-[#797583] hover:text-[#181c23] text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {registerError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                  {registerError}
                </div>
              )}

              <form onSubmit={handleRegisterVendorSubmit} className="space-y-3.5">
                <Input
                  label="Vendor Business Name"
                  placeholder="e.g. Artisanal Flower Studio"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-heading font-semibold text-[#181c23]">
                      Category
                    </label>
                    <select
                      value={registerForm.category}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, category: e.target.value as VendorCategory })
                      }
                      className="h-10 rounded-xl border border-[#eae6df] bg-white px-3 text-xs text-[#181c23] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20"
                    >
                      {CATEGORIES.filter((c) => c.key !== "all").map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-heading font-semibold text-[#181c23]">
                      Price Range
                    </label>
                    <select
                      value={registerForm.priceRange}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, priceRange: e.target.value as PriceRange })
                      }
                      className="h-10 rounded-xl border border-[#eae6df] bg-white px-3 text-xs text-[#181c23] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20"
                    >
                      <option value="$">$ (Economy / Civic)</option>
                      <option value="$$">$$ (Standard)</option>
                      <option value="$$$">$$$ (Premium Heritage)</option>
                      <option value="$$$$">$$$$ (Ultra Luxury)</option>
                    </select>
                  </div>
                </div>

                <Input
                  label="City / Location"
                  placeholder="e.g. Jaipur, Rajasthan"
                  value={registerForm.location}
                  onChange={(e) => setRegisterForm({ ...registerForm, location: e.target.value })}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Contact Person"
                    placeholder="e.g. Ananya Deshmukh"
                    value={registerForm.contactName}
                    onChange={(e) => setRegisterForm({ ...registerForm, contactName: e.target.value })}
                  />
                  <Input
                    label="Phone Number"
                    placeholder="e.g. +91 98201 00000"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  />
                </div>

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="e.g. contact@vendor.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                />

                <Input
                  label="Service Description"
                  placeholder="Describe specialty offerings, equipment, or culinary styles"
                  value={registerForm.serviceDescription}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, serviceDescription: e.target.value })
                  }
                />

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={registerForm.directAddToEvent}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, directAddToEvent: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#5a4bac] focus:ring-[#7364c7]"
                  />
                  <span className="text-xs text-[#484552]">
                    Also add this vendor to current event roster immediately
                  </span>
                </label>

                {registerForm.directAddToEvent && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <Input
                      label={`Estimated Target (${activeCurrency})`}
                      type="number"
                      value={registerForm.estimatedAmount}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          estimatedAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                    <Input
                      label={`Quoted Price (${activeCurrency})`}
                      type="number"
                      value={registerForm.quotedAmount}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          quotedAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-[#eae6df]">
                  <Button type="button" variant="outline" onClick={() => setShowRegisterModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmittingRegister}>
                    {isSubmittingRegister ? "Registering..." : "Save Vendor"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Event Vendor Contract Modal */}
        {editingEventVendor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#eae6df] space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b pb-3 border-[#eae6df]">
                <div>
                  <h3 className="font-heading font-bold text-base text-[#181c23]">
                    Edit Vendor Contract & Quotes
                  </h3>
                  <p className="text-xs text-[#797583]">
                    {editingEventVendor.vendor?.name || "Contracted Vendor"}
                  </p>
                </div>
                <button
                  onClick={() => setEditingEventVendor(null)}
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

              <form onSubmit={handleEditEventVendorSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={`Estimated Allocation (${activeCurrency})`}
                    type="number"
                    min="0"
                    value={editForm.estimatedAmount}
                    onChange={(e) =>
                      setEditForm({ ...editForm, estimatedAmount: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />

                  <Input
                    label={`Quoted Price (${activeCurrency})`}
                    type="number"
                    min="0"
                    value={editForm.quotedAmount}
                    onChange={(e) =>
                      setEditForm({ ...editForm, quotedAmount: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={`Disbursed Paid (${activeCurrency})`}
                    type="number"
                    min="0"
                    value={editForm.actualPaid}
                    onChange={(e) =>
                      setEditForm({ ...editForm, actualPaid: parseFloat(e.target.value) || 0 })
                    }
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-heading font-semibold text-[#181c23]">
                      Booking Status
                    </label>
                    <select
                      value={editForm.bookingStatus}
                      onChange={(e) =>
                        setEditForm({ ...editForm, bookingStatus: e.target.value as BookingStatus })
                      }
                      className="h-10 rounded-xl border border-[#eae6df] bg-white px-3 text-xs text-[#181c23] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20"
                    >
                      {BOOKING_STATUSES.map((st) => (
                        <option key={st.key} value={st.key}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Input
                  label="Private Contract Notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />

                <div className="flex justify-end gap-2 pt-3 border-t border-[#eae6df]">
                  <Button type="button" variant="outline" onClick={() => setEditingEventVendor(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmittingEdit}>
                    {isSubmittingEdit ? "Updating..." : "Save Contract Changes"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingVendor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-[#eae6df] space-y-4 animate-in zoom-in-95 duration-150">
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-base text-[#ba1a1a] flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Remove Vendor from Event?
                </h3>
                <p className="text-xs text-[#484552]">
                  Are you sure you want to remove{" "}
                  <strong className="text-[#181c23]">
                    {deletingVendor.vendor?.name || "this vendor"}
                  </strong>{" "}
                  from your event contracts? The vendor listing will remain in the directory.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setDeletingVendor(null)}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" onClick={handleDeleteConfirm} disabled={isDeleting}>
                  {isDeleting ? "Removing..." : "Confirm Removal"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
