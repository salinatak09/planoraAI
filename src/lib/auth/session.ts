import { headers } from "next/headers";
import type { UserSession } from "@/lib/types";

// Default authorized user for the MVP development environment
export const DEFAULT_USER: UserSession = {
  userId: "usr_planora_demo_01",
  email: "organizer@planora.ai",
  name: "Alex Vance",
  role: "organizer",
};

/**
 * Resolves the authenticated user session strictly on the server.
 * Never trust client-supplied user IDs from the request body.
 */
export async function getAuthenticatedUser(): Promise<UserSession> {
  const reqHeaders = await headers();

  // In production, extract user from validated JWT, NextAuth/Clerk session cookie, or bearer header
  const customUserId = reqHeaders.get("x-planora-user-id");
  const customEmail = reqHeaders.get("x-planora-user-email");
  const customName = reqHeaders.get("x-planora-user-name");

  if (customUserId && customUserId.trim().length > 0) {
    return {
      userId: customUserId.trim(),
      email: customEmail?.trim() || "user@planora.ai",
      name: customName?.trim() || "Event Host",
      role: "organizer",
    };
  }

  // Fallback to default demo user session for MVP development
  return DEFAULT_USER;
}
