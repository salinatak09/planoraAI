"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("priya@planora.ai");
  const [password, setPassword] = React.useState("••••••••••••");
  const [isLoading, setIsLoading] = React.useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 600);
  }

  function handleQuickDemo() {
    setEmail("priya@planora.ai");
    setPassword("planora2026demo");
    setIsLoading(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 400);
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[#faf9f6] relative selection:bg-[#e5deff] selection:text-[#473698]">
      {/* Background glow orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[360px] bg-[#e5deff]/40 blur-[120px] rounded-full" />
        <div className="absolute bottom-10 right-1/4 w-[380px] h-[300px] bg-[#c8ead9]/30 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-[#5a4bac] flex items-center justify-center text-white shadow-xs group-hover:bg-[#7364c7] transition-colors">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-heading font-extrabold text-xl text-[#5a4bac] tracking-tight">
              Planora AI
            </span>
          </Link>
          <h1 className="text-2xl font-heading font-extrabold text-[#181c23] tracking-tight">
            Sign In to Planora Studio
          </h1>
          <p className="text-xs text-[#686e77] mt-1.5">
            Access your executive celebrations, AI Copilot, and vendor ledgers.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-[#eae6df] bg-white p-7 sm:p-9 shadow-[0px_10px_35px_-4px_rgba(45,49,57,0.06)] backdrop-blur-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@eventstudio.com"
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-heading font-semibold text-[#181c23]">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Demo Reset: In demo mode, sign in directly with the pre-filled credentials.");
                  }}
                  className="text-[11px] font-heading font-medium text-[#5a4bac] hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Dashboard
            </Button>
          </form>

          {/* Quick Demo Login Option */}
          <div className="mt-5 pt-5 border-t border-[#f5f4f0] text-center">
            <p className="text-[11px] text-[#797583] mb-2 font-medium">
              Evaluating Planora AI?
            </p>
            <button
              onClick={handleQuickDemo}
              className="w-full py-2.5 px-4 rounded-full bg-[#faf9f6] border border-[#eae6df] text-xs font-heading font-semibold text-[#5a4bac] hover:bg-[#ede9fe] hover:border-[#dcd6cc] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>One-Click Lead Planner Demo (Priya Sharma)</span>
            </button>
          </div>
        </div>

        {/* Signup Redirect */}
        <div className="text-center mt-6 text-xs text-[#686e77]">
          Don&apos;t have a studio account?{" "}
          <Link href="/signup" className="font-heading font-bold text-[#5a4bac] hover:underline">
            Register your studio free
          </Link>
        </div>
      </div>
    </div>
  );
}
