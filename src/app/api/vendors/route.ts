import { NextRequest } from "next/server";
import { requireAuthenticatedUser, AuthenticationError } from "@/lib/auth/session";
import { createVendorSchema } from "@/lib/validation/schemas";
import {
  apiSuccess,
  apiValidationError,
  apiError,
  apiUnauthorized,
} from "@/lib/utils/response";
import {
  getVendorDirectory,
  createVendorRecord,
} from "@/lib/db/services";
import { serializeDocument } from "@/lib/utils/objectid";

/**
 * GET /api/vendors
 * Retrieves the vendor directory with filters for category, location, and priceRange.
 * Includes shared directory listings and user's custom created vendors.
 */
export async function GET(req: NextRequest) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to view the vendor directory");
      }
      throw err;
    }

    const url = new URL(req.url);
    const category = url.searchParams.get("category") || undefined;
    const location = url.searchParams.get("location") || undefined;
    const priceRange = url.searchParams.get("priceRange") || undefined;

    const vendors = await getVendorDirectory(user.userId, category, location, priceRange);

    return apiSuccess({
      vendors: vendors.map((v) => serializeDocument(v)),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      return apiError(error.message, "BAD_REQUEST", 400);
    }
    console.error("GET /api/vendors error:", error);
    return apiError("Failed to fetch vendor directory", "SERVER_ERROR", 500);
  }
}

/**
 * POST /api/vendors
 * Creates a custom vendor record in the directory.
 * Explicitly distinguishes manually entered vendors (verificationStatus="unverified", isShared=false).
 */
export async function POST(req: NextRequest) {
  try {
    let user;
    try {
      user = await requireAuthenticatedUser();
    } catch (err: unknown) {
      if (err instanceof AuthenticationError) {
        return apiUnauthorized("You must be signed in to add vendors");
      }
      throw err;
    }

    const body = await req.json();
    const parsed = createVendorSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const created = await createVendorRecord(user.userId, parsed.data);

    return apiSuccess(
      {
        vendor: serializeDocument(created),
      },
      201
    );
  } catch (error) {
    if (error instanceof TypeError) {
      return apiError(error.message, "BAD_REQUEST", 400);
    }
    console.error("POST /api/vendors error:", error);
    return apiError("Failed to create vendor", "SERVER_ERROR", 500);
  }
}
