import { getSessionCookie } from "./cookies";
import { verifySessionToken } from "./jwt";
import type { UserSession } from "@/lib/types";

export class AuthenticationError extends Error {
  constructor(message = "Unauthorized: A valid authenticated session is required") {
    super(message);
    this.name = "AuthenticationError";
  }
}

/**
 * Resolves the authenticated user session strictly on the server from the verified HTTP-only JWT cookie.
 * Never trusts client assertions, request body fields, or unverified headers.
 */
export async function getAuthenticatedUser(): Promise<UserSession | null> {
  const token = await getSessionCookie();
  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload || !payload.userId) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    name: payload.name || "Event Organizer",
    role: payload.role || "organizer",
  };
}

/**
 * Requires an authenticated user session.
 * Throws AuthenticationError if the session is missing, expired, or invalid.
 */
export async function requireAuthenticatedUser(): Promise<UserSession> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new AuthenticationError();
  }
  return user;
}
