import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import type { ApiResponse } from "@/lib/types";

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function apiError(
  message: string,
  code = "BAD_REQUEST",
  status = 400,
  details?: unknown
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

export function apiValidationError(zodError: ZodError): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details: zodError.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    },
    { status: 422 }
  );
}

export function apiUnauthorized(message = "Unauthorized access"): NextResponse<ApiResponse<never>> {
  return apiError(message, "UNAUTHORIZED", 401);
}

export function apiNotFound(message = "Resource not found"): NextResponse<ApiResponse<never>> {
  return apiError(message, "NOT_FOUND", 404);
}
