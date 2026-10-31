"use client";

import {useState, FormEvent} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Mail, User, Building, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [agency, setAgency] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Luxury Destination Specialist");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: name,
          email,
          password,
          agency,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data?.error?.message || "Registration failed. Please check your details.");
        setIsLoading(false);
        return;
      }

      // Successful registration & session creation - redirect to onboarding wizard
      router.push("/onboarding");
      router.refresh();
    } catch {
      setErrorMessage("Network error during registration. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[#faf9f6] relative selection:bg-[#e5deff] selection:text-[#473698]">
      {/* Background glow orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[360px] bg-[#e5deff]/40 blur-[120px] rounded-full" />
        <div className="absolute bottom-10 left-1/4 w-[380px] h-[300px] bg-[#c8ead9]/30 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Brand header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#5a4bac] flex items-center justify-center text-white shadow-xs group-hover:bg-[#7364c7] transition-colors">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-heading font-extrabold text-xl text-[#5a4bac] tracking-tight">
              Planora AI
            </span>
          </Link>
          <h1 className="text-2xl font-heading font-extrabold text-[#181c23] tracking-tight">
            Create Your Planner Account
          </h1>
          <p className="text-xs text-[#686e77] mt-1.5">
            Join luxury curators, independent planners, and festival organizers.
          </p>
        </div>

        {/* Signup Card */}
        <div className="rounded-3xl border border-[#eae6df] bg-white p-7 sm:p-9 shadow-[0px_10px_35px_-4px_rgba(45,49,57,0.06)] backdrop-blur-sm">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-[#ffdad6]/40 border border-[#ba1a1a]/20 flex items-start gap-2.5 text-xs text-[#93000a]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#ba1a1a]" />
              <div className="leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Priya Sharma"
                leftIcon={<User className="w-4 h-4" />}
                required
              />
              <Input
                label="Studio / Agency Name"
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                placeholder="Luxe Heritage Celebration"
                leftIcon={<Building className="w-4 h-4" />}
                required
              />
            </div>

            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="priya@studio.com"
              leftIcon={<Mail className="w-4 h-4" />}
              required
              autoComplete="email"
            />

            <Input
              label="Account Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              leftIcon={<Lock className="w-4 h-4" />}
              required
              autoComplete="new-password"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-heading font-semibold text-[#181c23]">
                Specialization
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-11 rounded-full border border-[#eae6df] bg-white px-4 text-xs text-[#181c23] focus:outline-none focus:ring-2 focus:ring-[#7364c7]/20 focus:border-[#5a4bac]"
              >
                <option value="Luxury Destination Specialist">Luxury Destination Specialist</option>
                <option value="Wedding & Gala Producer">Wedding & Gala Producer</option>
                <option value="Corporate & Milestone Event Lead">Corporate & Milestone Event Lead</option>
                <option value="Community Festival Director">Community Festival Director</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="p-3 rounded-2xl bg-[#faf9f6] border border-[#eae6df] text-xs text-[#686e77] space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#466557]" />
                <span>Cryptographically secured session 
                  {/* & MongoDB identity */}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#466557]" />
                <span>Unlimited celebration drafts & AI suggestions</span>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Register & Launch Onboarding
            </Button>
          </form>
        </div>

        {/* Login Redirect */}
        <div className="text-center mt-6 text-xs text-[#686e77]">
          Already have an account?{" "}
          <Link href="/login" className="font-heading font-bold text-[#5a4bac] hover:underline">
            Sign In to Studio
          </Link>
        </div>
      </div>
    </div>
  );
}
