"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Download,
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
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { EventWorkspaceHeader } from "@/components/events/EventWorkspaceHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

interface BudgetItem {
  id: string;
  category: string;
  vendorName: string;
  budgeted: number;
  actual: number;
  paid: number;
  status: "Paid" | "Deposit Paid" | "Pending Approval";
}

export default function EventBudgetPage() {
  const params = useParams();
  const eventId = (params?.id as string) || "evt-aarav-meera";

  const [showAddModal, setShowAddModal] = React.useState(false);
  const [items, setItems] = React.useState<BudgetItem[]>([
    { id: "b-1", category: "Venue & Palace", vendorName: "Jaipur Palace Heritage Trust", budgeted: 1200000, actual: 1200000, paid: 1000000, status: "Deposit Paid" },
    { id: "b-2", category: "Catering & Banquet", vendorName: "Royal Saffron Catering", budgeted: 1100000, actual: 1050000, paid: 600000, status: "Deposit Paid" },
    { id: "b-3", category: "Florals & Decor", vendorName: "Wildflower Botanical Studio", budgeted: 650000, actual: 580000, paid: 580000, status: "Paid" },
    { id: "b-4", category: "Photography & Film", vendorName: "Stories by Joseph Radhik", budgeted: 500000, actual: 480000, paid: 240000, status: "Deposit Paid" },
    { id: "b-5", category: "Music & Entertainment", vendorName: "Sangeet Brass & DJ Collective", budgeted: 400000, actual: 390000, paid: 100000, status: "Pending Approval" },
  ]);

  const [newItem, setNewItem] = React.useState({
    category: "Florals & Decor",
    vendorName: "",
    budgeted: 50000,
    actual: 50000,
  });

  const totalBudgeted = 3850000;
  const totalActual = items.reduce((sum, i) => sum + i.actual, 0);
  const totalPaid = items.reduce((sum, i) => sum + i.paid, 0);
  const remaining = totalBudgeted - totalActual;

  const chartData = items.map((i) => ({
    name: i.category.split(" ")[0],
    Planned: i.budgeted,
    Committed: i.actual,
  }));

  const pieColors = ["#5a4bac", "#466557", "#884a0f", "#7364c7", "#a66227"];
  const pieData = items.map((i) => ({
    name: i.category,
    value: i.actual,
  }));

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.vendorName) return;
    const item: BudgetItem = {
      id: `b-${Date.now()}`,
      category: newItem.category,
      vendorName: newItem.vendorName,
      budgeted: Number(newItem.budgeted),
      actual: Number(newItem.actual),
      paid: 0,
      status: "Pending Approval",
    };
    setItems((prev) => [...prev, item]);
    setShowAddModal(false);
    setNewItem({ category: "Florals & Decor", vendorName: "", budgeted: 50000, actual: 50000 });
  }

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
          budgetTotal={totalBudgeted}
        />

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-heading font-extrabold text-[#181c23] tracking-tight">
              Master Budget & Cashflow Ledger
            </h2>
            <p className="text-xs text-[#686e77]">
              Real-time contract disbursement tracking and automated contingency safety reserves.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => alert("Detailed budget report generated (CSV format).")}
              className="px-3.5 py-2 rounded-full border border-[#eae6df] bg-white text-xs font-heading font-semibold text-[#484552] hover:bg-[#faf9f6] flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Expense Item
            </Button>
          </div>
        </div>

        {/* 4 Financial KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <span className="text-xs font-heading font-semibold text-[#797583]">Total Ceiling</span>
            <div className="text-2xl font-heading font-extrabold text-[#181c23] mt-1">
              ₹{totalBudgeted.toLocaleString()}
            </div>
            <p className="text-[11px] text-[#466557] font-semibold mt-1">
              Cap authorized by client
            </p>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-heading font-semibold text-[#797583]">Committed Contracts</span>
            <div className="text-2xl font-heading font-extrabold text-[#5a4bac] mt-1">
              ₹{totalActual.toLocaleString()}
            </div>
            <p className="text-[11px] text-[#686e77] mt-1">
              {Math.round((totalActual / totalBudgeted) * 100)}% of ceiling committed
            </p>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-heading font-semibold text-[#797583]">Disbursed Advances</span>
            <div className="text-2xl font-heading font-extrabold text-[#466557] mt-1">
              ₹{totalPaid.toLocaleString()}
            </div>
            <p className="text-[11px] text-[#797583] mt-1">
              ₹{(totalActual - totalPaid).toLocaleString()} pending payment
            </p>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-heading font-semibold text-[#797583]">Contingency Reserve</span>
            <div className="text-2xl font-heading font-extrabold text-[#884a0f] mt-1">
              ₹{remaining.toLocaleString()}
            </div>
            <p className="text-[11px] text-[#884a0f] font-semibold mt-1">
              Available buffer capital
            </p>
          </Card>
        </div>

        {/* Visual Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Planned vs Committed by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" fontSize={11} stroke="#797583" />
                    <YAxis fontSize={11} stroke="#797583" tickFormatter={(v) => `₹${v / 100000}L`} />
                    <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
                    <Bar dataKey="Planned" fill="#e5deff" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Committed" fill="#5a4bac" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Expenditure Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 mt-2 text-[11px] text-[#484552]">
                {items.slice(0, 3).map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pieColors[idx] }} />
                      <span className="truncate max-w-[120px]">{item.category}</span>
                    </span>
                    <span className="font-semibold">₹{(item.actual / 100000).toFixed(1)}L</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Master Ledger Table */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm">Category Contract Ledger</CardTitle>
              <CardDescription>Detailed vendor line items & payment disbursements</CardDescription>
            </div>
            <span className="text-xs text-[#797583] font-semibold">{items.length} Line Items</span>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#faf9f6] text-[#797583] font-heading font-semibold border-y border-[#eae6df]">
                <tr>
                  <th className="py-3 px-6">Category & Description</th>
                  <th className="py-3 px-4">Vendor Partner</th>
                  <th className="py-3 px-4 text-right">Planned Cap</th>
                  <th className="py-3 px-4 text-right">Committed</th>
                  <th className="py-3 px-4 text-right">Disbursed</th>
                  <th className="py-3 px-4 text-right">Remaining Balance</th>
                  <th className="py-3 px-6 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f4f0]">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-[#faf9f6]/70 transition-colors">
                    <td className="py-3.5 px-6 font-heading font-bold text-[#181c23]">
                      {item.category}
                    </td>
                    <td className="py-3.5 px-4 text-[#484552]">{item.vendorName}</td>
                    <td className="py-3.5 px-4 text-right text-[#797583]">₹{item.budgeted.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right font-heading font-bold text-[#181c23]">
                      ₹{item.actual.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#466557] font-semibold">
                      ₹{item.paid.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#884a0f]">
                      ₹{(item.actual - item.paid).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <Badge
                        variant={item.status === "Paid" ? "sage" : item.status === "Deposit Paid" ? "default" : "peach"}
                        size="sm"
                      >
                        {item.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Add Expense Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#eae6df] space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b pb-3 border-[#eae6df]">
                <h3 className="font-heading font-bold text-base text-[#181c23]">
                  Add Line Item / Quote
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-[#797583] hover:text-[#181c23] text-lg font-bold">
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-heading font-semibold text-[#181c23]">
                    Category
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="h-11 rounded-full border border-[#eae6df] bg-white px-4 text-xs text-[#181c23] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20"
                  >
                    <option value="Venue & Palace">Venue & Palace</option>
                    <option value="Catering & Banquet">Catering & Banquet</option>
                    <option value="Florals & Decor">Florals & Decor</option>
                    <option value="Photography & Film">Photography & Film</option>
                    <option value="Music & Entertainment">Music & Entertainment</option>
                    <option value="Favors & Hospitality">Favors & Hospitality</option>
                  </select>
                </div>

                <Input
                  label="Vendor / Contractor Name"
                  placeholder="e.g. Royal Brass Band Collective"
                  value={newItem.vendorName}
                  onChange={(e) => setNewItem({ ...newItem, vendorName: e.target.value })}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Planned Target (₹)"
                    type="number"
                    value={newItem.budgeted}
                    onChange={(e) => setNewItem({ ...newItem, budgeted: parseFloat(e.target.value) || 0 })}
                    required
                  />
                  <Input
                    label="Contract Quote (₹)"
                    type="number"
                    value={newItem.actual}
                    onChange={(e) => setNewItem({ ...newItem, actual: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#eae6df]">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Expense Line</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
