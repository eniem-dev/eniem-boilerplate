import { polarClient } from "@/lib/polar";
import { logger } from "@/lib/logger";
import { ResourceNotFound } from "@polar-sh/sdk/models/errors/resourcenotfound.js";
import type { CreditBalance } from "../models/credits.model";

/**
 * Resolves a Polar customer ID from the app user ID.
 *
 * Polar creates a customer record when a user makes a purchase or subscribes.
 * This function looks up the Polar customer by the external ID (our user ID).
 *
 * @param userId - The app user ID (used as externalId in Polar)
 * @returns The Polar customer ID, or null if no subscription/purchase exists
 */
export async function getCustomerId(userId: string): Promise<string | null> {
  try {
    const customer = await polarClient.customers.getExternal({
      externalId: userId,
    });
    return customer.id;
  } catch (error) {
    // User has no subscription/purchase - expected case, return null cleanly
    if (error instanceof ResourceNotFound) {
      return null;
    }

    // Unexpected error (API failure, network issue, etc.) - log and return null
    logger.error("Failed to get Polar customer ID", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
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

/**
 * Check if user has sufficient credits for an action.
 *
 * @param userId - The app user ID
 * @param meterId - The Polar meter identifier
 * @param requiredAmount - The number of credits required
 * @returns true if user has >= requiredAmount credits, false otherwise
 */
export async function hasCredits(
  userId: string,
  meterId: string,
  requiredAmount: number
): Promise<boolean> {
  const creditBalance = await getCreditsBalance(userId, meterId);

  // No customer/subscription = no credits
  if (!creditBalance) {
    return false;
  }

  // Treat negative balance as 0 (Polar allows negative, we don't)
  const effectiveBalance = Math.max(0, creditBalance.balance);

  return effectiveBalance >= requiredAmount;
}
