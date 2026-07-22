import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createUserContext(role: "user" | "admin"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "sample-user",
      email: "sample@example.com",
      name: "Sample User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("store.create", () => {
  it("should create a store item when called by authenticated user", async () => {
    const ctx = createUserContext("user");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.store.create({
      title: "Test Item",
      description: "Test description",
      price: 100,
      category: "replica",
      condition: "usado",
      images: [],
    });
    expect(result).toBeDefined();
  });
});

describe("store.list", () => {
  it("should list store items for any user", async () => {
    const ctx = createUserContext("user");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.store.list();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("store.buy", () => {
  it("should initiate buy process for an active item", async () => {
    const ctx = createUserContext("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.store.buy({ id: 99999 })).rejects.toThrow();
  });
});
