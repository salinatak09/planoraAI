import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-300 mb-4 shadow-sm">
        <Sparkles className="h-7 w-7" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
        404 - Page Not Found
      </h1>
      <p className="text-sm text-slate-500 max-w-md mb-6">
        The celebration or resource you are looking for does not exist or has been relocated.
      </p>
      <Link href="/">
        <Button leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Return to Events Hub
        </Button>
      </Link>
    </div>
  );
}
