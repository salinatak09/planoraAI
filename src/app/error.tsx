"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400 mb-4">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
        Something went wrong
      </h2>
      <p className="text-sm text-slate-500 max-w-md mb-6">
        {error.message || "An unexpected error occurred while loading this view."}
      </p>
      <Button onClick={() => reset()} variant="primary">
        Try Again
      </Button>
    </div>
  );
}
