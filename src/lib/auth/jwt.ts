import { SignJWT, jwtVerify, JWTPayload } from "jose";

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: "organizer" | "admin";
}

const DEFAULT_DEV_SECRET = "planora-ai-default-jwt-secret-min-32-chars-long!!";

export function getJwtSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET || DEFAULT_DEV_SECRET;
  return new TextEncoder().encode(secret);
}

/**
 * Creates a signed JWT token valid for 7 days.
 */
export async function createSessionToken(
  payload: Omit<SessionPayload, "iat" | "exp" | "nbf" | "iss" | "aud">
): Promise<string> {
  const secretKey = getJwtSecretKey();

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("planora.ai")
    .setAudience("planora-app")
    .setExpirationTime("7d")
    .sign(secretKey);
}

/**
 * Verifies a JWT token. Returns the typed SessionPayload if valid, or null if expired/tampered.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  if (!token || typeof token !== "string") return null;

  try {
    const secretKey = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: "planora.ai",
      audience: "planora-app",
    });

    if (!payload.userId || !payload.email) {
      return null;
    }

    return {
      userId: String(payload.userId),
      email: String(payload.email),
      name: String(payload.name || "Event Organizer"),
      role: (payload.role as "organizer" | "admin") || "organizer",
      ...payload,
    };
  } catch {
    // Expired or invalid signature
    return null;
  }
}
