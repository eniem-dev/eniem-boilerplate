import { Suspense } from "react";
import type { BillingData } from "../models/billing.model";
import { SubscriptionStatusCard } from "./subscription-status-card";
import { OrderHistoryCard } from "./order-history-card";
import { AsyncCreditsUsageHistoryCard } from "./credits-usage-history-section";
import { CreditsUsageHistorySkeleton } from "@/features/credits/components/credits-usage-history-skeleton";

interface BillingOverviewProps {
  data: BillingData;
}

export function BillingOverview({ data }: BillingOverviewProps) {
  return (
    <div className="space-y-8">
      <SubscriptionStatusCard subscription={data.subscription} />
      <OrderHistoryCard orders={data.orders} />
      <Suspense fallback={<CreditsUsageHistorySkeleton />}>
        <AsyncCreditsUsageHistoryCard />
      </Suspense>
    </div>
  );
}
