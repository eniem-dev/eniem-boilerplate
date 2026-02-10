import { polarClient } from "@/lib/polar";
import { logger } from "@/lib/logger";
import { getCustomerId } from "@/features/billing/services/billing.service";
import type {
  UsageHistoryEvent,
  UsageHistoryResult,
} from "../models/credits.model";

const EMPTY_RESULT: UsageHistoryResult = {
  events: [],
  pagination: { totalCount: 0, maxPage: 1, currentPage: 1 },
};

export async function getUsageHistory(
  userId: string,
  options?: { limit?: number; page?: number }
): Promise<UsageHistoryResult> {
  const limit = options?.limit ?? 20;
  const page = options?.page ?? 1;

  const customerId = await getCustomerId(userId);
  if (!customerId) {
    return EMPTY_RESULT;
  }

  try {
    const response = await polarClient.events.list({
      customerId,
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
