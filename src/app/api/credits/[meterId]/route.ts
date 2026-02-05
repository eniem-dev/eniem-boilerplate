import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getCreditsBalance, getCustomerId } from "@/features/credits/services/credits.service";
import { logger } from "@/lib/logger";
import { locales } from "@/locales";
import type { CreditBalance } from "@/features/credits/models/credits.model";

export type CreditsApiResponse =
  | { success: true; data: CreditBalance | null; hasCustomer: boolean }
  | { success: false; error: string };

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ meterId: string }> }
): Promise<NextResponse<CreditsApiResponse>> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: locales.errors.unauthorized },
        { status: 401 }
      );
    }

    const { meterId } = await context.params;

    // Check if user has a Polar customer record
    const customerId = await getCustomerId(session.user.id);
    const hasCustomer = customerId !== null;

    // Get balance (will be null if no customer)
    const balance = await getCreditsBalance(session.user.id, meterId);

    return NextResponse.json({
      success: true,
      data: balance,
      hasCustomer,
    });
  } catch (error) {
    logger.error("Failed to fetch credits balance", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: locales.errors.serverError },
      { status: 500 }
    );
  }
}
