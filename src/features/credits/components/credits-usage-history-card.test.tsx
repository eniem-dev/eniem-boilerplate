import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CreditsUsageHistoryCard } from "./credits-usage-history-card";
import type { UsageHistoryEvent } from "../models/credits.model";

const makeEvent = (overrides: Partial<UsageHistoryEvent> = {}): UsageHistoryEvent => ({
  id: "evt_1",
  name: "ai_generation",
  timestamp: new Date("2026-02-10T12:00:00Z"),
  metadata: { model: "gpt-4" },
  ...overrides,
});

describe("CreditsUsageHistoryCard", () => {
  it("renders rows with event name and timestamp", () => {
    const events = [
      makeEvent({ id: "evt_1", name: "ai_generation", timestamp: new Date("2026-02-10T12:00:00Z") }),
      makeEvent({ id: "evt_2", name: "image_upload", timestamp: new Date("2026-02-09T08:00:00Z") }),
    ];

    render(<CreditsUsageHistoryCard events={events} />);

    expect(screen.getByText("Usage History")).toBeInTheDocument();
    expect(screen.getAllByText("ai_generation")).toHaveLength(2); // desktop + mobile
    expect(screen.getAllByText("image_upload")).toHaveLength(2);
  });

  it("shows empty state when events array is empty", () => {
    render(<CreditsUsageHistoryCard events={[]} />);

    expect(screen.getByText("Usage History")).toBeInTheDocument();
    expect(screen.getByText("No usage yet")).toBeInTheDocument();
  });
});
