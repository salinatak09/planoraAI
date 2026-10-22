import { NextResponse } from "next/server";

export async function GET() {
  const hasMongoUri = Boolean(process.env.MONGODB_URI);
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);

  return NextResponse.json({
    status: "ok",
    app: "Planora AI",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    services: {
      mongodbConfigured: hasMongoUri,
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
