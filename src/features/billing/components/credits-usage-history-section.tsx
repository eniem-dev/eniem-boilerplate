import { getCreditsUsageQuery } from "@/features/credits/queries/credits-usage.query";
import { CreditsUsageHistoryCard } from "@/features/credits/components/credits-usage-history-card";
import { ErrorCard } from "@/components/error-card";
import { locales } from "@/locales";

export async function AsyncCreditsUsageHistoryCard() {
  const { data, error } = await getCreditsUsageQuery();

  if (error) {
    return <ErrorCard message={error || locales.errors.serverError} />;
  }

  return <CreditsUsageHistoryCard events={data?.events ?? []} />;
}
