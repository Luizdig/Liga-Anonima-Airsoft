import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createUserContext(role: "user" | "admin"): TrpcContext {
  return {
    user: {
      id: role === "admin" ? 1 : 2,
      openId: role === "admin" ? "admin-user" : "regular-user",
      email: role === "admin" ? "admin@laa.com.br" : "user@example.com",
      name: role === "admin" ? "ADM" : "Membro",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("admin.ban", () => {
  it("should ban a user when called by admin", async () => {
    const ctx = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.users.ban({ userId: 3, banned: true });
    expect(result).toBeDefined();
  });

  it("should reject ban when called by regular user", async () => {
    const ctx = createUserContext("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.users.ban({ userId: 3, banned: true })).rejects.toThrow();
  });
});

describe("admin.promote", () => {
  it("should promote a user to admin when called by admin", async () => {
    const ctx = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.users.promote({ userId: 3 });
    expect(result).toBeDefined();
  });
});

describe("admin.updateSetting", () => {
  it("should update settings when called by admin", async () => {
    const ctx = createUserContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.settings.update({
      key: "commission_enabled",
      value: "true",
    });
    expect(result).toBeDefined();
  });
});
