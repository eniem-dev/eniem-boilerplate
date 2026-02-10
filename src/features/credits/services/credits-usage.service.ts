import { polarClient } from "@/lib/polar";
import { logger } from "@/lib/logger";
import type {
  UsageHistoryEvent,
  UsageHistoryResult,
} from "../models/credits.model";

export async function getUsageHistory(
  userId: string,
  options?: { limit?: number; page?: number }
): Promise<UsageHistoryResult> {
  const limit = options?.limit ?? 20;
  const page = options?.page ?? 1;

  try {
    const response = await polarClient.events.list({
      externalCustomerId: userId,
      limit,
      page,
      source: "user",
    });

    const events: UsageHistoryEvent[] = response.result.items.map((item) => ({
      id: item.id,
      name: item.name,
      timestamp: item.timestamp,
      metadata: item.metadata,
    }));

    return {
      events,
      pagination: {
        totalCount: response.result.pagination.totalCount,
        maxPage: response.result.pagination.maxPage,
        currentPage: page,
      },
    };
  } catch (error) {
    logger.error("Failed to fetch usage history", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
