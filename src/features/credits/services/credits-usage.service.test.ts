import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUsageHistory } from "./credits-usage.service";

const mockEventsList = vi.fn();

vi.mock("@/lib/polar", () => ({
  polarClient: {
    events: {
      list: (...args: unknown[]) => mockEventsList(...args),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

const makePolarEvent = (overrides: Record<string, unknown> = {}) => ({
  id: "evt_123",
  name: "ai_generation",
  timestamp: new Date("2026-02-10T12:00:00Z"),
  metadata: { model: "gpt-4", tokens: 150 },
  source: "user" as const,
  customerId: "polar_cust_1",
  externalCustomerId: "user_1",
  organizationId: "org_1",
  customer: {},
  ...overrides,
});

describe("getUsageHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns formatted UsageHistoryEvent array from Polar response", async () => {
    const event1 = makePolarEvent({ id: "evt_1", name: "ai_generation" });
    const event2 = makePolarEvent({ id: "evt_2", name: "image_upload" });

    mockEventsList.mockResolvedValue({
      result: {
        items: [event1, event2],
        pagination: { totalCount: 2, maxPage: 1 },
      },
    });

    const result = await getUsageHistory("user_1");

    expect(result.events).toHaveLength(2);
    expect(result.events[0]).toEqual({
      id: "evt_1",
      name: "ai_generation",
      timestamp: event1.timestamp,
      metadata: event1.metadata,
    });
    expect(result.pagination).toEqual({
      totalCount: 2,
      maxPage: 1,
      currentPage: 1,
    });
  });

  it("returns empty events + pagination when no customer events exist", async () => {
    mockEventsList.mockResolvedValue({
      result: {
        items: [],
        pagination: { totalCount: 0, maxPage: 0 },
      },
    });

    const result = await getUsageHistory("user_1");

    expect(result.events).toEqual([]);
    expect(result.pagination).toEqual({
      totalCount: 0,
      maxPage: 0,
      currentPage: 1,
    });
  });

  it("correctly maps UserEvent fields to UsageHistoryEvent", async () => {
    const event = makePolarEvent({
      id: "evt_map",
      name: "doc_scan",
      timestamp: new Date("2026-01-15T08:30:00Z"),
      metadata: { pages: 5, format: "pdf", duplex: true },
    });

    mockEventsList.mockResolvedValue({
      result: {
        items: [event],
        pagination: { totalCount: 1, maxPage: 1 },
      },
    });

    const result = await getUsageHistory("user_1");
    const mapped = result.events[0];

    expect(mapped).toEqual({
      id: "evt_map",
      name: "doc_scan",
      timestamp: new Date("2026-01-15T08:30:00Z"),
      metadata: { pages: 5, format: "pdf", duplex: true },
    });
    // Ensure extra Polar fields are NOT included
    expect(mapped).not.toHaveProperty("source");
    expect(mapped).not.toHaveProperty("customerId");
    expect(mapped).not.toHaveProperty("externalCustomerId");
  });

  it("passes limit and page options to Polar API", async () => {
    mockEventsList.mockResolvedValue({
      result: {
        items: [],
        pagination: { totalCount: 0, maxPage: 0 },
      },
    });

    await getUsageHistory("user_1", { limit: 10, page: 3 });

    expect(mockEventsList).toHaveBeenCalledWith({
      externalCustomerId: "user_1",
      limit: 10,
      page: 3,
      source: "user",
    });
  });
});
