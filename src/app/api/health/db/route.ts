import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/mongodb";

export async function GET() {
  const result = await checkDatabaseHealth();

  const responseBody = {
    status: result.ok ? "healthy" : "unhealthy",
    service: "MongoDB Atlas",
    database: result.database,
    latencyMs: result.latencyMs,
    timestamp: new Date().toISOString(),
    ...(result.error ? { error: result.error } : {}),
  };

  return NextResponse.json(responseBody, {
    status: result.ok ? 200 : 503,
  });
}
