"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Mail,
  Phone,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EventWorkspaceHeader } from "@/components/events/EventWorkspaceHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import type { VendorCategory, VendorStatus } from "@/lib/types";

interface VendorPartner {
  id: string;
  name: string;
  category: VendorCategory;
  contact: string;
  email: string;
  phone: string;
  contractValue: number;
  advancePaid: number;
  status: VendorStatus;
  notes: string;
}

export default function EventVendorsPage() {
  const params = useParams();
  const eventId = (params?.id as string) || "evt-aarav-meera";

  const [filterCategory, setFilterCategory] = React.useState<string>("all");
  const [showAddModal, setShowAddModal] = React.useState(false);

  const [vendors, setVendors] = React.useState<VendorPartner[]>([
    {
      id: "v-1",
      name: "Wildflower Botanical Studio",
      category: "florals",
      contact: "Ananya Deshmukh",
      email: "ananya@wildflowerstudio.in",
      phone: "+91 98201 44510",
      contractValue: 580000,
      advancePaid: 580000,
      status: "booked",
      notes: "Scented jasmine arches, marigold garlands, brass urn arrangements.",
    },
    {
      id: "v-2",
      name: "Royal Saffron Catering",
      category: "catering",
      contact: "Chef Ranveer Rathore",
      email: "ranveer@royalsaffron.com",
      phone: "+91 98450 11982",
      contractValue: 1050000,
      advancePaid: 600000,
      status: "booked",
      notes: "Authentic Dal Baati Churma, royal galouti kebabs, seasonal kulfi station.",
    },
    {
      id: "v-3",
      name: "Stories by Joseph Radhik",
      category: "photography",
      contact: "Joseph Radhik",
      email: "inquiries@stories.in",
      phone: "+91 99203 88124",
      contractValue: 480000,
      advancePaid: 240000,
      status: "booked",
      notes: "Candid cinematography team with 4K drone clearance over lakefront.",
    },
    {
      id: "v-4",
      name: "Jaipur Sound & Laser Collective",
      category: "music",
      contact: "Vikram Sen",
      email: "vikram@jaipursound.in",
      phone: "+91 98112 30944",
      contractValue: 390000,
      advancePaid: 100000,
      status: "shortlisted",
      notes: "Awaiting noise curfew clarification for acoustic transition after 10 PM.",
    },
    {
      id: "v-5",
      name: "Maharaja Heritage Palace Staging",
      category: "venue",
      contact: "Kunwar Bhanu Singh",
      email: "heritage@jaipurpalace.org",
      phone: "+91 98290 77119",
      contractValue: 1200000,
      advancePaid: 1000000,
      status: "booked",
      notes: "Includes royal courtyard, lighting towers, generator backup, and valet parking.",
    },
  ]);

  const [newVendor, setNewVendor] = React.useState({
    name: "",
    category: "florals" as VendorCategory,
    contact: "",
    email: "",
    phone: "",
    contractValue: 200000,
    status: "contacted" as VendorStatus,
    notes: "",
  });

  const totalContract = vendors.reduce((sum, v) => sum + v.contractValue, 0);
  const totalPaid = vendors.reduce((sum, v) => sum + v.advancePaid, 0);

  function handleAddVendor(e: React.FormEvent) {
    e.preventDefault();
    if (!newVendor.name) return;
    const item: VendorPartner = {
      id: `v-${Date.now()}`,
      name: newVendor.name,
      category: newVendor.category,
      contact: newVendor.contact,
      email: newVendor.email,
      phone: newVendor.phone,
      contractValue: Number(newVendor.contractValue),
      advancePaid: 0,
      status: newVendor.status,
      notes: newVendor.notes,
    };
    setVendors((prev) => [item, ...prev]);
    setShowAddModal(false);
    setNewVendor({
      name: "",
      category: "florals",
      contact: "",
      email: "",
      phone: "",
      contractValue: 200000,
      status: "contacted",
      notes: "",
    });
  }

  const filteredVendors =
    filterCategory === "all" ? vendors : vendors.filter((v) => v.category === filterCategory);

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

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-heading font-extrabold text-[#181c23] tracking-tight">
              Curated Vendor Directory & Contracts
            </h2>
            <p className="text-xs text-[#686e77]">
              Manage vendor agreements, contact milestones, and advance payment disbursements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Vendor Partner
            </Button>
          </div>
        </div>

        {/* Summary Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <span className="text-xs font-heading font-semibold text-[#797583]">Vendors Engaged</span>
            <div className="text-2xl font-heading font-extrabold text-[#181c23] mt-1">
              {vendors.length} Partners
            </div>
            <p className="text-[11px] text-[#466557] font-semibold mt-1">
              {vendors.filter((v) => v.status === "booked").length} fully secured
            </p>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-heading font-semibold text-[#797583]">Committed Value</span>
            <div className="text-2xl font-heading font-extrabold text-[#5a4bac] mt-1">
              ₹{totalContract.toLocaleString()}
            </div>
            <p className="text-[11px] text-[#686e77] mt-1">Across all vendor agreements</p>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-heading font-semibold text-[#797583]">Disbursed Advances</span>
            <div className="text-2xl font-heading font-extrabold text-[#466557] mt-1">
              ₹{totalPaid.toLocaleString()}
            </div>
            <p className="text-[11px] text-[#884a0f] font-semibold mt-1">
              ₹{(totalContract - totalPaid).toLocaleString()} pending completion
            </p>
          </Card>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[#797583] font-heading font-semibold mr-1">Category:</span>
          {["all", "venue", "catering", "florals", "photography", "music"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-full font-heading font-semibold capitalize transition-all cursor-pointer whitespace-nowrap ${
                filterCategory === cat
                  ? "bg-[#5a4bac] text-white shadow-xs"
                  : "bg-white border border-[#eae6df] text-[#686e77] hover:text-[#181c23]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Vendor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="p-6 rounded-3xl border border-[#eae6df] bg-white shadow-2xs hover:border-[#5a4bac] transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="sage" size="sm" className="capitalize">
                      {vendor.category}
                    </Badge>
                    <Badge
                      variant={vendor.status === "booked" ? "sage" : "peach"}
                      size="sm"
                    >
                      {vendor.status === "booked" ? "Contract Booked" : "In Negotiation"}
                    </Badge>
                  </div>
                  <h3 className="font-heading font-bold text-base text-[#181c23]">
                    {vendor.name}
                  </h3>
                  <p className="text-xs text-[#797583] mt-0.5">Contact: {vendor.contact}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-[#797583] block">Contract</span>
                  <span className="text-sm font-heading font-extrabold text-[#181c23]">
                    ₹{vendor.contractValue.toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#686e77] leading-relaxed bg-[#faf9f6] p-3 rounded-2xl border border-[#eae6df]">
                &ldquo;{vendor.notes}&rdquo;
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#f5f4f0] text-xs">
                <div className="flex items-center gap-4 text-[#686e77]">
                  <a href={`mailto:${vendor.email}`} className="flex items-center gap-1 hover:text-[#5a4bac]">
                    <Mail className="w-3.5 h-3.5 text-[#797583]" />
                    <span>Email</span>
                  </a>
                  <a href={`tel:${vendor.phone}`} className="flex items-center gap-1 hover:text-[#5a4bac]">
                    <Phone className="w-3.5 h-3.5 text-[#797583]" />
                    <span>Call</span>
                  </a>
                </div>

                <div className="text-[11px] font-heading font-semibold text-[#466557]">
                  Paid: ₹{vendor.advancePaid.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Vendor Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#eae6df] space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b pb-3 border-[#eae6df]">
                <h3 className="font-heading font-bold text-base text-[#181c23]">
                  Add Vendor Partner
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-[#797583] hover:text-[#181c23] text-lg font-bold">
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddVendor} className="space-y-3.5">
                <Input
                  label="Vendor Company Name"
                  placeholder="e.g. Jaipur Sound & Pyrotechnics"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-heading font-semibold text-[#181c23]">
                      Category
                    </label>
                    <select
                      value={newVendor.category}
                      onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value as VendorCategory })}
                      className="h-11 rounded-full border border-[#eae6df] bg-white px-3 text-xs text-[#181c23] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20"
                    >
                      <option value="venue">Venue</option>
                      <option value="catering">Catering</option>
                      <option value="florals">Florals & Decor</option>
                      <option value="photography">Photography</option>
                      <option value="music">Music & DJ</option>
                      <option value="other">Other Service</option>
                    </select>
                  </div>

                  <Input
                    label="Contract Value (₹)"
                    type="number"
                    value={newVendor.contractValue}
                    onChange={(e) => setNewVendor({ ...newVendor, contractValue: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Contact Name"
                    value={newVendor.contact}
                    onChange={(e) => setNewVendor({ ...newVendor, contact: e.target.value })}
                  />
                  <Input
                    label="Phone"
                    value={newVendor.phone}
                    onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                  />
                </div>

                <Input
                  label="Email"
                  type="email"
                  value={newVendor.email}
                  onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                />

                <div className="flex justify-end gap-2 pt-3 border-t border-[#eae6df]">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Vendor</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
