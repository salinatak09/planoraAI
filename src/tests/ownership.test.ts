import { describe, it, expect, vi } from "vitest";
import { ObjectId, Collection } from "mongodb";
import {
  verifyEventOwnership,
  AuthorizationError,
  ResourceNotFoundError,
} from "@/lib/db/services";
import * as collectionsModule from "@/lib/db/collections";
import type { EventModel } from "@/lib/types";

describe("Event Ownership & Authorization Checks", () => {
  const authorizedOwnerId = new ObjectId();
  const unauthorizedOwnerId = new ObjectId();
  const eventId = new ObjectId();

  it("should successfully authorize when authenticated owner matches event.ownerId", async () => {
    const mockEvent = {
      _id: eventId,
      ownerId: authorizedOwnerId,
      title: "Royal Jaipur Showcase",
      status: "confirmed",
    };

    const mockCollection = {
      findOne: vi.fn().mockResolvedValue(mockEvent),
    };

    vi.spyOn(collectionsModule, "getEventsCollection").mockResolvedValue(
      mockCollection as unknown as Collection<EventModel>
    );

    const result = await verifyEventOwnership(eventId.toString(), authorizedOwnerId.toString());
    expect(result).toBeDefined();
    expect(result._id).toEqual(eventId);
    expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: eventId });
  });

  it("should throw AuthorizationError when event belongs to a different ownerId", async () => {
    const mockEvent = {
      _id: eventId,
      ownerId: authorizedOwnerId,
      title: "Royal Jaipur Showcase",
    };

    const mockCollection = {
      findOne: vi.fn().mockResolvedValue(mockEvent),
    };

    vi.spyOn(collectionsModule, "getEventsCollection").mockResolvedValue(
      mockCollection as unknown as Collection<EventModel>
    );

    await expect(
      verifyEventOwnership(eventId.toString(), unauthorizedOwnerId.toString())
    ).rejects.toThrow(AuthorizationError);
  });

  it("should throw ResourceNotFoundError when event does not exist", async () => {
    const mockCollection = {
      findOne: vi.fn().mockResolvedValue(null),
    };

    vi.spyOn(collectionsModule, "getEventsCollection").mockResolvedValue(
      mockCollection as unknown as Collection<EventModel>
    );

    await expect(
      verifyEventOwnership(eventId.toString(), authorizedOwnerId.toString())
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it("should reject invalid ObjectId hex strings immediately with TypeError", async () => {
    await expect(
      verifyEventOwnership("not-a-valid-id", authorizedOwnerId.toString())
    ).rejects.toThrow(TypeError);

    await expect(
      verifyEventOwnership(eventId.toString(), "not-a-valid-owner")
    ).rejects.toThrow(TypeError);
  });
});
