import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE_NAME } from "./lib/auth/cookies";
import { getJwtSecretKey } from "./lib/auth/jwt";

// Protected application routes
const PROTECTED_PREFIXES = ["/dashboard", "/events", "/onboarding", "/settings"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Redirect already authenticated users away from /login and /signup
  if (pathname === "/login" || pathname === "/signup") {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      try {
        const secretKey = getJwtSecretKey();
        await jwtVerify(token, secretKey, {
          issuer: "planora.ai",
          audience: "planora-app",
        });
        return NextResponse.redirect(new URL("/dashboard", req.url));
      } catch {
        // Expired/invalid, proceed to login page
      }
    }
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Retrieve session cookie
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return redirectToLogin(req);
  }

  try {
    const secretKey = getJwtSecretKey();
    await jwtVerify(token, secretKey, {
      issuer: "planora.ai",
      audience: "planora-app",
    });

    // Valid JWT, proceed
    return NextResponse.next();
  } catch {
    // Expired or invalid token, redirect to login
    return redirectToLogin(req);
  }
}

function redirectToLogin(req: NextRequest) {
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);

  // Clear invalid cookie if present
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, svgs
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
