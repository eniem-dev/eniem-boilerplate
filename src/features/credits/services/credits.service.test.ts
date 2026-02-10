import { describe, expect, it, vi, beforeEach } from "vitest";
import { prismaMock } from "@/test/prisma-mock";

// Mock external dependencies
vi.mock("@/lib/polar", () => ({
  polarClient: {
    customers: {
      getStateExternal: vi.fn(),
    },
    events: {
      ingest: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
  },
}));

vi.mock("@/features/billing/services/billing.service", () => ({
  getCustomerId: vi.fn(),
}));

import { polarClient } from "@/lib/polar";
import { getCustomerId } from "@/features/billing/services/billing.service";
import {
  getCreditsBalance,
  deductCredits,
  hasCredits,
} from "./credits.service";

const mockGetCustomerId = vi.mocked(getCustomerId);
const mockGetStateExternal = vi.mocked(
  polarClient.customers.getStateExternal
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getCreditsBalance", () => {
  it("returns null when no Polar customer exists", async () => {
    mockGetCustomerId.mockResolvedValue(null);

    const result = await getCreditsBalance("user-1", "meter-1");

    expect(result).toBeNull();
    expect(mockGetStateExternal).not.toHaveBeenCalled();
  });

  it("creates local row from Polar on first call (upsert creates)", async () => {
    mockGetCustomerId.mockResolvedValue("cust-1");
    mockGetStateExternal.mockResolvedValue({
      activeMeters: [{ meterId: "meter-1", balance: 100 }],
    } as never);

    prismaMock.creditBalance.upsert.mockResolvedValue({
      id: "cb-1",
      userId: "user-1",
      meterId: "meter-1",
      balance: 100,
      updatedAt: new Date(),
    });

    const result = await getCreditsBalance("user-1", "meter-1");

    expect(prismaMock.creditBalance.upsert).toHaveBeenCalledWith({
      where: { userId_meterId: { userId: "user-1", meterId: "meter-1" } },
      create: { userId: "user-1", meterId: "meter-1", balance: 100 },
      update: {},
      select: { balance: true },
    });
    expect(result).toEqual({
      meterId: "meter-1",
      balance: 100,
      customerId: "cust-1",
    });
  });

  it("syncs with min(local, polar) on subsequent calls", async () => {
    mockGetCustomerId.mockResolvedValue("cust-1");
    mockGetStateExternal.mockResolvedValue({
      activeMeters: [{ meterId: "meter-1", balance: 80 }],
    } as never);

    // Local has 50 (lower than Polar's 80)
    prismaMock.creditBalance.upsert.mockResolvedValue({
      id: "cb-1",
      userId: "user-1",
      meterId: "meter-1",
      balance: 50,
      updatedAt: new Date(),
    });

    const result = await getCreditsBalance("user-1", "meter-1");

    // min(50, 80) = 50, no update needed since local is already lower
    expect(prismaMock.creditBalance.update).not.toHaveBeenCalled();
    expect(result).toEqual({
      meterId: "meter-1",
      balance: 50,
      customerId: "cust-1",
    });
  });

  it("updates local row when polar balance is lower", async () => {
    mockGetCustomerId.mockResolvedValue("cust-1");
    mockGetStateExternal.mockResolvedValue({
      activeMeters: [{ meterId: "meter-1", balance: 30 }],
    } as never);

    // Local has 50, polar has 30
    prismaMock.creditBalance.upsert.mockResolvedValue({
      id: "cb-1",
      userId: "user-1",
      meterId: "meter-1",
      balance: 50,
      updatedAt: new Date(),
    });

    prismaMock.creditBalance.update.mockResolvedValue({
      id: "cb-1",
      userId: "user-1",
      meterId: "meter-1",
      balance: 30,
      updatedAt: new Date(),
    });

    const result = await getCreditsBalance("user-1", "meter-1");

    // min(50, 30) = 30, update needed
    expect(prismaMock.creditBalance.update).toHaveBeenCalledWith({
      where: { userId_meterId: { userId: "user-1", meterId: "meter-1" } },
      data: { balance: 30 },
    });
    expect(result).toEqual({
      meterId: "meter-1",
      balance: 30,
      customerId: "cust-1",
    });
  });

  it("treats negative Polar balance as 0", async () => {
    mockGetCustomerId.mockResolvedValue("cust-1");
    mockGetStateExternal.mockResolvedValue({
      activeMeters: [{ meterId: "meter-1", balance: -5 }],
    } as never);

    prismaMock.creditBalance.upsert.mockResolvedValue({
      id: "cb-1",
      userId: "user-1",
      meterId: "meter-1",
      balance: 0,
      updatedAt: new Date(),
    });

    const result = await getCreditsBalance("user-1", "meter-1");

    expect(prismaMock.creditBalance.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { userId: "user-1", meterId: "meter-1", balance: 0 },
      })
    );
    expect(result).toEqual({
      meterId: "meter-1",
      balance: 0,
      customerId: "cust-1",
    });
  });
});

describe("deductCredits", () => {
  it("returns success when balance >= amount", async () => {
    prismaMock.creditBalance.updateMany.mockResolvedValue({ count: 1 });

    const result = await deductCredits("user-1", "meter-1", 10);

    expect(result).toEqual({ success: true });
    expect(prismaMock.creditBalance.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", meterId: "meter-1", balance: { gte: 10 } },
      data: { balance: { decrement: 10 } },
    });
  });

  it("returns failure when balance < amount (no partial deduction)", async () => {
    prismaMock.creditBalance.updateMany.mockResolvedValue({ count: 0 });

    const result = await deductCredits("user-1", "meter-1", 100);

    expect(result).toEqual({ success: false });
  });
});

describe("hasCredits", () => {
  it("returns true when local balance >= required amount", async () => {
    // Local row has balance > 0, so short-circuit is skipped
    prismaMock.creditBalance.findUnique.mockResolvedValue({
      id: "cb-1",
      userId: "user-1",
      meterId: "meter-1",
      balance: 50,
      updatedAt: new Date(),
    });
    mockGetCustomerId.mockResolvedValue("cust-1");
    mockGetStateExternal.mockResolvedValue({
      activeMeters: [{ meterId: "meter-1", balance: 50 }],
    } as never);
    prismaMock.creditBalance.upsert.mockResolvedValue({
      id: "cb-1",
      userId: "user-1",
      meterId: "meter-1",
      balance: 50,
      updatedAt: new Date(),
    });

    const result = await hasCredits("user-1", "meter-1", 10);

    expect(result).toBe(true);
  });

  it("returns false immediately when local balance is 0 (no Polar re-fetch)", async () => {
    // Local row exists with balance 0 — short-circuit
    prismaMock.creditBalance.findUnique.mockResolvedValue({
      id: "cb-1",
      userId: "user-1",
      meterId: "meter-1",
      balance: 0,
      updatedAt: new Date(),
    });

    const result = await hasCredits("user-1", "meter-1", 1);

    expect(result).toBe(false);
    // No Polar API call — denied from local cache alone
    expect(mockGetStateExternal).not.toHaveBeenCalled();
    expect(mockGetCustomerId).not.toHaveBeenCalled();
  });

  it("returns false when local balance < required amount", async () => {
    // Local row has some balance but not enough
    prismaMock.creditBalance.findUnique.mockResolvedValue({
      id: "cb-1",
      userId: "user-1",
      meterId: "meter-1",
      balance: 5,
      updatedAt: new Date(),
    });
    mockGetCustomerId.mockResolvedValue("cust-1");
    mockGetStateExternal.mockResolvedValue({
      activeMeters: [{ meterId: "meter-1", balance: 5 }],
    } as never);
    prismaMock.creditBalance.upsert.mockResolvedValue({
      id: "cb-1",
      userId: "user-1",
      meterId: "meter-1",
      balance: 5,
      updatedAt: new Date(),
    });

    const result = await hasCredits("user-1", "meter-1", 10);

    expect(result).toBe(false);
  });

  it("returns false when no Polar customer exists", async () => {
    // No local row exists — falls through to getCreditsBalance
    prismaMock.creditBalance.findUnique.mockResolvedValue(null);
    mockGetCustomerId.mockResolvedValue(null);

    const result = await hasCredits("user-1", "meter-1", 1);

    expect(result).toBe(false);
    expect(mockGetStateExternal).not.toHaveBeenCalled();
  });

  it("falls through to getCreditsBalance when no local row exists", async () => {
    // No local row — must sync from Polar
    prismaMock.creditBalance.findUnique.mockResolvedValue(null);
    mockGetCustomerId.mockResolvedValue("cust-1");
    mockGetStateExternal.mockResolvedValue({
      activeMeters: [{ meterId: "meter-1", balance: 100 }],
    } as never);
    prismaMock.creditBalance.upsert.mockResolvedValue({
      id: "cb-1",
      userId: "user-1",
      meterId: "meter-1",
      balance: 100,
      updatedAt: new Date(),
    });

    const result = await hasCredits("user-1", "meter-1", 10);

    expect(result).toBe(true);
    // Polar was called because no local row existed
    expect(mockGetStateExternal).toHaveBeenCalledTimes(1);
  });
});
