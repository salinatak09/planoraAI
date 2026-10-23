"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Building,
  Sparkles,
  CheckCircle2,
  Save,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export default function SettingsPage() {
  const router = useRouter();
  const [name, setName] = React.useState("Priya Sharma");
  const [email, setEmail] = React.useState("priya@planora.ai");
  const [studio, setStudio] = React.useState("Luxe Heritage Celebrations");
  const [currency, setCurrency] = React.useState("₹");
  const [autoCopilot, setAutoCopilot] = React.useState(true);
  const [budgetAlerts, setBudgetAlerts] = React.useState(true);
  const [isSaved, setIsSaved] = React.useState(false);

  const team = [
    { name: "Priya Sharma", role: "Principal Producer & Founder", access: "Owner", email: "priya@planora.ai" },
    { name: "Aditya Verma", role: "Technical Production & Stage Lead", access: "Editor", email: "aditya@planora.ai" },
    { name: "Sneha Kapur", role: "Guest Hospitality & RSVP Director", access: "Editor", email: "sneha@planora.ai" },
    { name: "Rohit Das", role: "Logistics & Transport Coordinator", access: "Viewer", email: "rohit@planora.ai" },
  ];

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  }

  return (
    <AppShell activeEventTitle="Studio Settings" activeEventLocation="Enterprise Preferences">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-extrabold text-[#181c23] tracking-tight">
              Studio Settings & Preferences
            </h1>
            <p className="text-xs text-[#686e77] mt-1">
              Configure your event studio profile, default currency, team roles, and AI copilot settings.
            </p>
          </div>

          {isSaved && (
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#c5e7d6] text-[#466557] text-xs font-heading font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Preferences Saved Successfully</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lead Planner Profile</CardTitle>
              <CardDescription>Your public identity on collaborative client portals and export briefs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#ede9fe] text-[#5a4bac] font-heading font-extrabold text-xl flex items-center justify-center border-2 border-[#dcd6cc]">
                  PS
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-[#181c23]">{name}</h4>
                  <p className="text-xs text-[#797583]">Principal Planner • Luxe Enterprise Tier</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Planner Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  leftIcon={<User className="w-4 h-4" />}
                  required
                />
                <Input
                  label="Studio / Agency"
                  value={studio}
                  onChange={(e) => setStudio(e.target.value)}
                  leftIcon={<Building className="w-4 h-4" />}
                  required
                />
              </div>

              <Input
                label="Direct Work Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </CardContent>
          </Card>

          {/* Regional & Financial Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Regional & Accounting Standards</CardTitle>
              <CardDescription>Default currency formatting applied to newly synthesized celebrations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-heading font-semibold text-[#181c23]">
                    Default Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="h-11 rounded-full border border-[#eae6df] bg-white px-4 text-xs text-[#181c23] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20"
                  >
                    <option value="₹">₹ Indian Rupee (INR - Lakhs & Crores)</option>
                    <option value="$">$ US Dollar (USD - Thousands & Millions)</option>
                    <option value="€">€ Euro (EUR)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-heading font-semibold text-[#181c23]">
                    Tax Treatment
                  </label>
                  <select className="h-11 rounded-full border border-[#eae6df] bg-white px-4 text-xs text-[#181c23]">
                    <option>Standard 18% GST (India)</option>
                    <option>Standard VAT</option>
                    <option>No Automated Tax Calculation</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-heading font-semibold text-[#181c23]">
                    Date Format
                  </label>
                  <select className="h-11 rounded-full border border-[#eae6df] bg-white px-4 text-xs text-[#181c23]">
                    <option>DD/MM/YYYY (e.g. 14/12/2026)</option>
                    <option>MM/DD/YYYY (e.g. 12/14/2026)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Planora AI Copilot Autonomy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#5a4bac]" />
                <span>AI Copilot Autonomy & Intelligence</span>
              </CardTitle>
              <CardDescription>Control automated advice thresholds and regional intelligence signals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#faf9f6] border border-[#eae6df]">
                <div>
                  <h4 className="font-heading font-bold text-xs text-[#181c23]">
                    Live Budget Market Intelligence
                  </h4>
                  <p className="text-[11px] text-[#686e77]">
                    Proactively alert when regional vendor quotes diverge more than 10% from historical benchmarks.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={budgetAlerts}
                  onChange={(e) => setBudgetAlerts(e.target.checked)}
                  className="w-5 h-5 rounded-md accent-[#5a4bac] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#faf9f6] border border-[#eae6df]">
                <div>
                  <h4 className="font-heading font-bold text-xs text-[#181c23]">
                    Sound & Weather Contingency Tracking
                  </h4>
                  <p className="text-[11px] text-[#686e77]">
                    Automatically cross-reference local council noise curfews with day-of Sangeet timelines.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoCopilot}
                  onChange={(e) => setAutoCopilot(e.target.checked)}
                  className="w-5 h-5 rounded-md accent-[#5a4bac] cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Studio Team & Role Permissions</CardTitle>
                <CardDescription>Collaborators with access to event workspaces.</CardDescription>
              </div>
              <Button size="sm" variant="outline" type="button" onClick={() => alert("Invite link generated.")}>
                + Invite Collaborator
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#faf9f6] text-[#797583] font-heading font-semibold border-y border-[#eae6df]">
                  <tr>
                    <th className="py-3 px-6">Team Member</th>
                    <th className="py-3 px-4">Role Title</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-6 text-right">Access Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f5f4f0]">
                  {team.map((m) => (
                    <tr key={m.email} className="hover:bg-[#faf9f6]/60">
                      <td className="py-3.5 px-6 font-heading font-bold text-[#181c23]">{m.name}</td>
                      <td className="py-3.5 px-4 text-[#686e77]">{m.role}</td>
                      <td className="py-3.5 px-4 text-[#797583]">{m.email}</td>
                      <td className="py-3.5 px-6 text-right">
                        <Badge variant={m.access === "Owner" ? "ai" : "default"} size="sm">
                          {m.access}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <Button type="submit" size="lg" leftIcon={<Save className="w-4 h-4" />}>
              Save Studio Configuration
            </Button>
          </div>
        </form>

        {/* Account Security & Session Management */}
        <Card className="border-[#ffdad6]/60">
          <CardHeader>
            <div className="flex items-center gap-2 text-[#ba1a1a]">
              <ShieldCheck className="w-5 h-5" />
              <CardTitle className="text-base text-[#181c23]">Security & Session Management</CardTitle>
            </div>
            <CardDescription>
              Manage your active authenticated session and credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div>
              <p className="text-xs font-heading font-semibold text-[#181c23]">
                Authenticated Studio Session
              </p>
              <p className="text-xs text-[#797583] mt-0.5">
                Session token is securely stored in an HTTP-only, encrypted cookie with 7-day expiration.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="text-[#ba1a1a] border-[#ffdad6] hover:bg-[#ffdad6]/30 hover:border-[#ba1a1a]/30 shrink-0"
              leftIcon={<LogOut className="w-4 h-4" />}
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/login");
                router.refresh();
              }}
            >
              Sign Out of Studio
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
