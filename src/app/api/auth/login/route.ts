import { NextRequest } from "next/server";
import { z } from "zod";
import { ObjectId, WithId } from "mongodb";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { createSessionToken } from "@/lib/auth/jwt";
import { setSessionCookieOnResponse } from "@/lib/auth/cookies";
import { checkRateLimit, getClientIdentifier } from "@/lib/auth/rate-limit";
import { getUsersCollection } from "@/lib/db/collections";
import type { UserModel } from "@/lib/types";
import { apiSuccess, apiError, apiValidationError } from "@/lib/utils/response";

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

// Default demo account credentials
const DEMO_EMAIL = "priya@planora.ai";
const DEMO_USER_ID = "671800000000000000000001";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting check (max 5 login attempts per minute per IP)
    const clientId = getClientIdentifier(req.headers, "login");
    const rateLimit = checkRateLimit(clientId, 5, 60);
    if (!rateLimit.success) {
      return apiError(
        `Too many login attempts. Please wait ${rateLimit.resetInSeconds} seconds before trying again.`,
        "RATE_LIMITED",
        429
      );
    }

    // 2. Payload validation
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { email, password } = parsed.data;

    let userId = DEMO_USER_ID;
    let displayName = "Priya Sharma";
    const role: "organizer" | "admin" = "organizer";

    // 3. Authenticate against MongoDB if connected
    if (process.env.MONGODB_URI) {
      const users = await getUsersCollection();
      let user = await users.findOne({ email });

      // Automatically provision standard demo account in MongoDB on first login
      if (!user && email === DEMO_EMAIL && password === "planora2026demo") {
        const passwordHash = await hashPassword("planora2026demo");
        const demoDoc: WithId<UserModel> = {
          _id: new ObjectId(DEMO_USER_ID),
          displayName: "Priya Sharma",
          email: DEMO_EMAIL,
          passwordHash,
          authProvider: "credentials",
          preferences: {
            defaultCurrency: "₹",
            timezone: "Asia/Kolkata",
            notifications: true,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await users.insertOne(demoDoc);
        user = demoDoc;
      }

      if (!user) {
        return apiError("Invalid email or password", "INVALID_CREDENTIALS", 401);
      }

      const passwordHash = user.passwordHash;
      if (!passwordHash) {
        return apiError("Authentication provider mismatch", "AUTH_ERROR", 401);
      }

      const isValid = await verifyPassword(password, passwordHash);
      if (!isValid) {
        return apiError("Invalid email or password", "INVALID_CREDENTIALS", 401);
      }

      userId = user._id ? user._id.toString() : new ObjectId().toString();
      displayName = user.displayName;
    } else {
      // Offline / development demo fallback check
      if (email === DEMO_EMAIL) {
        // Accept demo credentials
        displayName = "Priya Sharma";
      } else {
        // For testing newly registered demo accounts without MongoDB
        displayName = email.split("@")[0];
      }
    }

    // 4. Generate signed JWT token
    const token = await createSessionToken({
      userId,
      email,
      name: displayName,
      role,
    });

    // 5. Build response and set HTTP-only cookie
    const response = apiSuccess({
      user: {
        id: userId,
        displayName,
        email,
        role,
      },
    });

    setSessionCookieOnResponse(response, token);
    return response;
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return apiError("Internal server error during login", "SERVER_ERROR", 500);
  }
}
