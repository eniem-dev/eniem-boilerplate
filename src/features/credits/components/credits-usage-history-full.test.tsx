import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CreditsUsageHistoryFull } from "./credits-usage-history-full";
import type { UsageHistoryEvent } from "../models/credits.model";

const makeEvent = (
  overrides: Partial<UsageHistoryEvent> = {}
): UsageHistoryEvent => ({
  id: "evt_1",
  name: "LLM Tokens",
  timestamp: new Date("2026-02-10T12:00:00Z"),
  metadata: { model: "gpt-4" },
  ...overrides,
});

describe("CreditsUsageHistoryFull", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders events with name and timestamp", () => {
    const events = [
      makeEvent({ id: "evt_1", name: "LLM Tokens" }),
      makeEvent({ id: "evt_2", name: "Image Generation" }),
    ];

    render(
      <CreditsUsageHistoryFull initialEvents={events} initialMaxPage={1} />
    );

    expect(screen.getAllByText("LLM Tokens")).toHaveLength(2); // desktop + mobile
    expect(screen.getAllByText("Image Generation")).toHaveLength(2);
  });

  it("shows empty state when events array is empty", () => {
    render(<CreditsUsageHistoryFull initialEvents={[]} initialMaxPage={1} />);

    expect(screen.getByText("No usage yet")).toBeInTheDocument();
  });

  it("shows Load more button when more pages available", () => {
    const events = [makeEvent()];

    render(
      <CreditsUsageHistoryFull initialEvents={events} initialMaxPage={3} />
    );

    expect(screen.getByText("Load more")).toBeInTheDocument();
  });

  it("hides Load more button when on last page", () => {
    const events = [makeEvent()];

    render(
      <CreditsUsageHistoryFull initialEvents={events} initialMaxPage={1} />
    );

    expect(screen.queryByText("Load more")).not.toBeInTheDocument();
  });

  it("loads more events when Load more is clicked", async () => {
    const initialEvents = [makeEvent({ id: "evt_1" })];
    const newEvents = [makeEvent({ id: "evt_2", name: "New Event" })];

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          events: newEvents,
          pagination: { totalCount: 2, maxPage: 2, currentPage: 2 },
        },
      }),
    });

    render(
      <CreditsUsageHistoryFull
        initialEvents={initialEvents}
        initialMaxPage={2}
      />
    );

    fireEvent.click(screen.getByText("Load more"));

    await waitFor(() => {
      expect(screen.getAllByText("New Event")).toHaveLength(2);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/credits/usage?page=2");
  });

  it("shows loading state while fetching", async () => {
    const events = [makeEvent()];

    let resolvePromise: (value: unknown) => void;
    global.fetch = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    render(
      <CreditsUsageHistoryFull initialEvents={events} initialMaxPage={2} />
    );

    fireEvent.click(screen.getByText("Load more"));

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // Resolve to clean up
    resolvePromise!({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          events: [],
          pagination: { totalCount: 1, maxPage: 2, currentPage: 2 },
        },
      }),
    });

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
  });

  it("renders metadata tooltip for events with metadata", () => {
    const events = [makeEvent({ metadata: { model: "gpt-4", tokens: 100 } })];

    const { container } = render(
      <CreditsUsageHistoryFull initialEvents={events} initialMaxPage={1} />
    );

    // Info icons should be present (2 for desktop + mobile)
    const infoIcons = container.querySelectorAll("svg.lucide-info");
    expect(infoIcons).toHaveLength(2);
  });
});
