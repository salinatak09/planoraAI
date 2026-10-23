import { describe, it, expect, vi } from "vitest";
import { ObjectId, Collection } from "mongodb";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSessionToken, verifySessionToken } from "@/lib/auth/jwt";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import {
  getAuthenticatedUser,
  requireAuthenticatedUser,
  AuthenticationError,
} from "@/lib/auth/session";
import * as cookiesModule from "@/lib/auth/cookies";
import { verifyEventOwnership, AuthorizationError } from "@/lib/db/services";
import * as collectionsModule from "@/lib/db/collections";
import type { EventModel } from "@/lib/types";

describe("Authentication & Authorization Security Suite", () => {
  describe("Password Hashing & Verification (bcryptjs)", () => {
    const rawPassword = "SuperSecurePassword123!";

    it("should hash password with non-plaintext salt rounds", async () => {
      const hash = await hashPassword(rawPassword);
      expect(hash).not.toBe(rawPassword);
      expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);
    });

    it("should successfully verify the correct password", async () => {
      const hash = await hashPassword(rawPassword);
      const isMatch = await verifyPassword(rawPassword, hash);
      expect(isMatch).toBe(true);
    });

    it("should reject an incorrect password", async () => {
      const hash = await hashPassword(rawPassword);
      const isMatch = await verifyPassword("WrongPassword!", hash);
      expect(isMatch).toBe(false);
    });
  });

  describe("Cryptographic JWT Session Tokens (jose)", () => {
    const testUser = {
      userId: new ObjectId().toString(),
      email: "planner@planora.ai",
      name: "Priya Sharma",
      role: "organizer" as const,
    };

    it("should create and verify a valid signed JWT session token", async () => {
      const token = await createSessionToken(testUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      const payload = await verifySessionToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(testUser.userId);
      expect(payload?.email).toBe(testUser.email);
      expect(payload?.name).toBe(testUser.name);
      expect(payload?.role).toBe(testUser.role);
    });

    it("should reject tampered or malformed JWT tokens", async () => {
      const validToken = await createSessionToken(testUser);
      // Alter a character in the signature part
      const tamperedToken = validToken.slice(0, -5) + "ABCDE";

      const payload = await verifySessionToken(tamperedToken);
      expect(payload).toBeNull();

      const gibberishPayload = await verifySessionToken("totally-invalid.jwt.token");
      expect(gibberishPayload).toBeNull();
    });
  });

  describe("API Sliding-Window Rate Limiting", () => {
    it("should allow requests under the limit and track remaining quota", () => {
      const clientKey = "test-client-" + Date.now();
      const limit = 3;
      const windowSeconds = 10;

      const r1 = checkRateLimit(clientKey, limit, windowSeconds);
      expect(r1.success).toBe(true);
      expect(r1.remaining).toBe(2);

      const r2 = checkRateLimit(clientKey, limit, windowSeconds);
      expect(r2.success).toBe(true);
      expect(r2.remaining).toBe(1);

      const r3 = checkRateLimit(clientKey, limit, windowSeconds);
      expect(r3.success).toBe(true);
      expect(r3.remaining).toBe(0);

      // Exceeded
      const r4 = checkRateLimit(clientKey, limit, windowSeconds);
      expect(r4.success).toBe(false);
      expect(r4.remaining).toBe(0);
      expect(r4.resetInSeconds).toBeGreaterThan(0);
    });

    it("should isolate rate limits across different client keys", () => {
      const clientA = "client-A-" + Date.now();
      const clientB = "client-B-" + Date.now();

      checkRateLimit(clientA, 1, 10);
      const blockedA = checkRateLimit(clientA, 1, 10);
      expect(blockedA.success).toBe(false);

      const allowedB = checkRateLimit(clientB, 1, 10);
      expect(allowedB.success).toBe(true);
    });
  });

  describe("Server Session Extraction & Route Guard Enforcement", () => {
    it("should return null for getAuthenticatedUser when session cookie is absent", async () => {
      vi.spyOn(cookiesModule, "getSessionCookie").mockResolvedValue(undefined);

      const session = await getAuthenticatedUser();
      expect(session).toBeNull();
    });

    it("should throw AuthenticationError for requireAuthenticatedUser when unauthenticated", async () => {
      vi.spyOn(cookiesModule, "getSessionCookie").mockResolvedValue(undefined);

      await expect(requireAuthenticatedUser()).rejects.toThrow(AuthenticationError);
    });

    it("should return authenticated session when a valid JWT session cookie is present", async () => {
      const user = {
        userId: new ObjectId().toString(),
        email: "verified@planora.ai",
        name: "Verified Lead",
        role: "organizer" as const,
      };
      const token = await createSessionToken(user);

      vi.spyOn(cookiesModule, "getSessionCookie").mockResolvedValue(token);

      const session = await getAuthenticatedUser();
      expect(session).not.toBeNull();
      expect(session?.userId).toBe(user.userId);
      expect(session?.email).toBe(user.email);
    });
  });

  describe("Cross-User Isolation & Ownership Enforcement", () => {
    const ownerA = new ObjectId();
    const ownerB = new ObjectId();
    const eventOwnedByA = new ObjectId();

    it("should strictly reject User B when attempting to access User A's celebration", async () => {
      const mockEvent = {
        _id: eventOwnedByA,
        ownerId: ownerA,
        title: "User A's Exclusive Gala",
        status: "confirmed",
      };

      const mockCollection = {
        findOne: vi.fn().mockResolvedValue(mockEvent),
      };

      vi.spyOn(collectionsModule, "getEventsCollection").mockResolvedValue(
        mockCollection as unknown as Collection<EventModel>
      );

      // User B attempts to access User A's event
      await expect(
        verifyEventOwnership(eventOwnedByA.toString(), ownerB.toString())
      ).rejects.toThrow(AuthorizationError);
    });

    it("should allow User A to access their own celebration", async () => {
      const mockEvent = {
        _id: eventOwnedByA,
        ownerId: ownerA,
        title: "User A's Exclusive Gala",
        status: "confirmed",
      };

      const mockCollection = {
        findOne: vi.fn().mockResolvedValue(mockEvent),
      };

      vi.spyOn(collectionsModule, "getEventsCollection").mockResolvedValue(
        mockCollection as unknown as Collection<EventModel>
      );

      const event = await verifyEventOwnership(eventOwnedByA.toString(), ownerA.toString());
      expect(event).toBeDefined();
      expect(event.ownerId).toEqual(ownerA);
    });
  });
});
