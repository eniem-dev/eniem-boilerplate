import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";
import { ErrorCard } from "@/components/error-card";
import { getCreditsUsageQuery } from "@/features/credits/queries/credits-usage.query";
import { CreditsUsageHistoryFull } from "@/features/credits/components/credits-usage-history-full";

export const metadata = createMetadata({
  ...getDefaultMetadata(),
  title: locales.UsageHistoryPage.metadata.title,
  description: locales.UsageHistoryPage.metadata.description,
});

export default async function UsageHistoryPage() {
  const { data, error } = await getCreditsUsageQuery();

  if (error || !data) {
    return <ErrorCard message={error || locales.errors.serverError} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        {locales.UsageHistoryPage.title}
      </h1>
      <CreditsUsageHistoryFull
        initialEvents={data.events}
        initialMaxPage={data.pagination.maxPage}
      />
    </div>
  );
}
