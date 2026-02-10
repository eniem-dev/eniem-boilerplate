import { getCreditsUsageQuery } from "@/features/credits/queries/credits-usage.query";
import { CreditsUsageHistoryCard } from "@/features/credits/components/credits-usage-history-card";

export async function AsyncCreditsUsageHistoryCard() {
  const { data } = await getCreditsUsageQuery();

  return <CreditsUsageHistoryCard events={data?.events ?? []} />;
}
