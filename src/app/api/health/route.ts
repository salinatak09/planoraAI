import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/mongodb";

export async function GET() {
  const dbHealth = await checkDatabaseHealth();
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "AIzaSy...");

  return NextResponse.json({
    status: "ok",
    app: "Planora AI",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    services: {
      mongodb: {
        status: dbHealth.ok ? "connected" : "unconnected",
        database: dbHealth.database,
        latencyMs: dbHealth.latencyMs,
      },
      geminiConfigured: hasGeminiKey,
    },
    architecture: {
      framework: "Next.js App Router (TypeScript strict)",
      validation: "Zod",
      aiSdk: "@google/genai",
      database: "MongoDB Node.js Official Driver",
    },
  });
}
