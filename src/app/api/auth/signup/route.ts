import { NextRequest } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken } from "@/lib/auth/jwt";
import { setSessionCookieOnResponse } from "@/lib/auth/cookies";
import { checkRateLimit, getClientIdentifier } from "@/lib/auth/rate-limit";
import { getUsersCollection } from "@/lib/db/collections";
import type { UserModel } from "@/lib/types";
import { apiSuccess, apiError, apiValidationError } from "@/lib/utils/response";

const signupSchema = z.object({
  displayName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  agency: z.string().trim().min(2, "Agency must be at least 2 characters").max(100),
  role: z.string().trim().min(2, "Role must be at least 2 characters").max(100),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting check (max 5 signup attempts per minute per IP)
    const clientId = getClientIdentifier(req.headers, "signup");
    const rateLimit = checkRateLimit(clientId, 5, 60);
    if (!rateLimit.success) {
      return apiError(
        `Too many signup attempts. Please try again in ${rateLimit.resetInSeconds} seconds.`,
        "RATE_LIMITED",
        429
      );
    }

    // 2. Payload validation
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { displayName, email, password, agency, role } = parsed.data;

    // 3. Password hashing (never store plaintext)
    const passwordHash = await hashPassword(password);
    const userId = new ObjectId();
    const now = new Date();

    const newUserDoc: UserModel = {
      _id: userId,
      displayName,
      email,
      passwordHash,
      agency,
      role,
      authProvider: "credentials",
      preferences: {
        defaultCurrency: "₹",
        timezone: "Asia/Kolkata",
        notifications: true,
      },
      createdAt: now,
      updatedAt: now,
    };

    // 4. Save to MongoDB if configured
    if (process.env.MONGODB_URI) {
      const users = await getUsersCollection();
      const existing = await users.findOne({ email });
      if (existing) {
        return apiError("An account with this email address already exists.", "USER_EXISTS", 409);
      }
      await users.insertOne(newUserDoc);
    }

    // 5. Generate secure cryptographically-signed JWT
    const token = await createSessionToken({
      userId: userId.toString(),
      email,
      name: displayName,
      agency,
      role: role || "organizer",
    });

    // 6. Return response with HTTP-only cookie
    const response = apiSuccess(
      {
        user: {
          id: userId.toString(),
          displayName,
          email,
          agency,
          role: role || "organizer",
        },
      },
      201
    );

    setSessionCookieOnResponse(response, token);
    return response;
  } catch (error) {
    console.error("POST /api/auth/signup error:", error);
    return apiError("Internal server error during registration", "SERVER_ERROR", 500);
  }
}
