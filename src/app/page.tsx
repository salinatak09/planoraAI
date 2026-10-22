import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Calendar,
  Wallet,
  CheckCircle2,
  Store,
  Star,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export default function MarketingLandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6] text-[#181c23] selection:bg-[#e5deff] selection:text-[#473698]">
      {/* Top Marketing Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[#eae6df] bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#5a4bac] flex items-center justify-center text-white shadow-xs group-hover:bg-[#7364c7] transition-colors">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-extrabold text-lg text-[#5a4bac] tracking-tight">
                Planora
              </span>
              <span className="text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#ede9fe] text-[#5a4bac]">
                AI
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-heading font-semibold text-[#484552]">
            <Link href="#features" className="hover:text-[#5a4bac] transition-colors">
              Features
            </Link>
            <Link href="#solutions" className="hover:text-[#5a4bac] transition-colors">
              Weddings & Galas
            </Link>
            <Link href="#copilot" className="hover:text-[#5a4bac] transition-colors">
              AI Copilot
            </Link>
            <Link href="#testimonials" className="hover:text-[#5a4bac] transition-colors">
              Planners
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="px-4 py-2 text-xs font-heading font-semibold text-[#484552] hover:text-[#181c23] transition-colors">
                Sign In
              </button>
            </Link>
            <Link href="/onboarding">
              <Button size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Launch Studio
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Atmospheric Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[480px] bg-[#e5deff]/40 blur-[130px] rounded-full" />
        <div className="absolute top-[35%] right-[10%] w-[420px] h-[340px] bg-[#c8ead9]/35 blur-[120px] rounded-full" />
        <div className="absolute bottom-10 left-[15%] w-[380px] h-[380px] bg-[#ffdcc4]/25 blur-[120px] rounded-full" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ede9fe] border border-[#dcd6cc] text-[#5a4bac] text-xs font-heading font-semibold mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#5a4bac]" />
          <span>Planora AI 2.5 • Next-Gen Generative Celebration Orchestration</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-[#181c23] tracking-tight max-w-4xl mx-auto leading-[1.15]">
          Elegance Meets Generative Intelligence for Modern Event Planners
        </h1>

        <p className="text-base sm:text-lg text-[#686e77] max-w-2xl mx-auto mt-6 leading-relaxed">
          Orchestrate unforgettable weddings, milestone anniversaries, and community galas.
          Planora AI harmonizes real-time budget forecasting, vendor logistics, and bespoke design ideas.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8">
          <Link href="/onboarding">
            <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Start Event Wizard Free
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg" leftIcon={<Layers className="w-4 h-4 text-[#5a4bac]" />}>
              Explore Live Demo
            </Button>
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-[#686e77]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#466557]" /> No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#466557]" /> Multi-currency (₹ INR / $ USD)
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#466557]" /> Powered by Gemini 2.5
          </span>
        </div>

        {/* Hero Interactive Preview Card */}
        <div className="mt-14 max-w-5xl mx-auto text-left">
          <div className="rounded-3xl border border-[#eae6df] bg-white shadow-[0px_16px_50px_-10px_rgba(45,49,57,0.08)] p-6 sm:p-8 backdrop-blur-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#f5f4f0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ede9fe] text-[#5a4bac] flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-base text-[#181c23]">
                      Aarav & Meera Wedding Celebration
                    </span>
                    <Badge variant="sage" size="sm">
                      Confirmed
                    </Badge>
                  </div>
                  <p className="text-xs text-[#797583]">
                    Jaipur Royal Palace • Dec 12, 2026 • 350 Guests
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/events/evt-aarav-meera">
                  <Button size="sm" variant="soft">
                    Open Workspace
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick KPI preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
              <div className="p-4 rounded-2xl bg-[#faf9f6] border border-[#eae6df]">
                <div className="text-xs text-[#797583] font-medium">Budget Committed</div>
                <div className="text-2xl font-heading font-extrabold text-[#181c23] mt-1">
                  ₹24,80,000
                </div>
                <div className="text-[11px] text-[#466557] font-semibold mt-1">
                  64% of ₹38,50,000 forecast
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#faf9f6] border border-[#eae6df]">
                <div className="text-xs text-[#797583] font-medium">RSVP Velocity</div>
                <div className="text-2xl font-heading font-extrabold text-[#181c23] mt-1">
                  284 / 350
                </div>
                <div className="text-[11px] text-[#5a4bac] font-semibold mt-1">
                  81% Confirmed Attendance
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#faf9f6] border border-[#eae6df]">
                <div className="text-xs text-[#797583] font-medium">AI Insights Active</div>
                <div className="text-2xl font-heading font-extrabold text-[#181c23] mt-1">
                  6 Concepts
                </div>
                <div className="text-[11px] text-[#884a0f] font-semibold mt-1">
                  14% Floral savings identified
                </div>
              </div>
            </div>

            {/* AI Copilot Teaser Banner */}
            <div className="p-4 rounded-2xl bg-[#ede9fe] border border-[#dcd6cc] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#5a4bac] shrink-0" />
                <p className="text-xs text-[#181c23]">
                  <strong className="text-[#5a4bac]">Planora Copilot:</strong> Sangeet lighting timeline automatically synchronized with royal palace sound restrictions.
                </p>
              </div>
              <Link href="/events/evt-aarav-meera/assistant" className="shrink-0 text-xs font-heading font-semibold text-[#5a4bac] hover:underline">
                Chat with Assistant →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Feature Pillars */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#181c23] tracking-tight">
            Designed for Boutique Precision & Large-Scale Harmony
          </h2>
          <p className="text-sm text-[#686e77] mt-2">
            Every feature is crafted to remove operational friction while elevating hospitality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="w-10 h-10 rounded-xl bg-[#ede9fe] text-[#5a4bac] flex items-center justify-center mb-4">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-heading font-bold text-[#181c23]">
              Dynamic Budget Intelligence
            </h3>
            <p className="text-xs text-[#686e77] mt-2 leading-relaxed">
              Track vendor advances, calculate splits across categories, and receive automated notifications if quotes trend above regional market standards.
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-10 h-10 rounded-xl bg-[#c5e7d6] text-[#466557] flex items-center justify-center mb-4">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-heading font-bold text-[#181c23]">
              Synchronized Agenda & Tasks
            </h3>
            <p className="text-xs text-[#686e77] mt-2 leading-relaxed">
              Minute-by-minute day-of itineraries matched with planning checklists. Assign deadlines, vendor requirements, and real-time completion markers.
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-10 h-10 rounded-xl bg-[#ffdcc4] text-[#884a0f] flex items-center justify-center mb-4">
              <Store className="w-5 h-5" />
            </div>
            <h3 className="text-base font-heading font-bold text-[#181c23]">
              Curated Vendor Collaborative Hub
            </h3>
            <p className="text-xs text-[#686e77] mt-2 leading-relaxed">
              Manage caterers, photographers, florists, and artists. Track proposal statuses, deliverables, and payment receipts from a single command center.
            </p>
          </Card>
        </div>
      </section>

      {/* Testimonials & Trust */}
      <section id="testimonials" className="py-16 bg-white border-y border-[#eae6df]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-1 text-[#f59e0b] mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <blockquote className="text-lg sm:text-xl font-heading font-semibold text-[#181c23] leading-relaxed">
              &ldquo;Planora AI completely transformed how our studio plans 3-day royal destination weddings.
              The AI recommendations for floral allocation saved us over ₹3,50,000 on our very first event.&rdquo;
            </blockquote>
            <div className="mt-4">
              <div className="font-heading font-bold text-sm text-[#5a4bac]">Priya Sharma</div>
              <div className="text-xs text-[#797583]">Principal Planner, Luxe Heritage Events</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-tr from-[#5a4bac] to-[#7364c7] text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-4xl font-heading font-extrabold tracking-tight">
              Ready to elevate your next celebration?
            </h2>
            <p className="text-sm text-[#e5deff] max-w-xl mx-auto mt-3">
              Join leading wedding curators, milestone hosts, and festival directors using Planora AI.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <Link href="/onboarding">
                <button className="px-6 py-3 rounded-full bg-white text-[#5a4bac] font-heading font-bold text-sm hover:bg-[#ede9fe] transition-colors shadow-sm cursor-pointer">
                  Launch Event Wizard
                </button>
              </Link>
              <Link href="/login">
                <button className="px-6 py-3 rounded-full border border-white/30 text-white font-heading font-semibold text-sm hover:bg-white/10 transition-colors cursor-pointer">
                  Sign In to Studio
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="border-t border-[#eae6df] bg-white py-8 px-4 text-center text-xs text-[#797583]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#5a4bac] flex items-center justify-center text-white">
              <Sparkles className="w-3 h-3" />
            </div>
            <span className="font-heading font-bold text-sm text-[#181c23]">Planora AI</span>
            <span>• Intelligent Celebration Platform</span>
          </div>
          <div>© 2026 Planora AI Studio. Crafted for modern hospitality.</div>
        </div>
      </footer>
    </div>
  );
}
