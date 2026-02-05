import { polarClient } from "@/lib/polar";
import { logger } from "@/lib/logger";
import type { CreditBalance } from "../models/credits.model";

export async function getCustomerId(userId: string): Promise<string | null> {
  try {
    const customer = await polarClient.customers.getExternal({
      externalId: userId,
    });
    return customer.id;
  } catch (error) {
    logger.error("Failed to get customer ID", { userId, error });
    return null;
  }
}

export async function getCreditsBalance(
  userId: string,
  meterId: string
): Promise<CreditBalance | null> {
  const customerId = await getCustomerId(userId);
  if (!customerId) {
    return null;
  }

  try {
    const customerState = await polarClient.customers.getStateExternal({
      externalId: userId,
    });

    const meter = customerState.activeMeters?.find((m) => m.meterId === meterId);
    if (!meter) {
      logger.warn("Meter not found for customer", { customerId, meterId });
      return { meterId, balance: 0, customerId };
    }

    return {
      meterId,
      balance: meter.balance,
      customerId,
    };
  } catch (error) {
    logger.error("Failed to fetch credit balance", { userId, meterId, error });
    throw error;
  }
}
