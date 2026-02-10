import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UsageHistoryEvent } from "../models/credits.model";
import { locales } from "@/locales";
import { formatShortDate } from "@/features/billing/billing.util";
import Link from "next/link";
import { routes } from "@/config";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

function MetadataTooltip({
  metadata,
}: {
  metadata: Record<string, string | number | boolean>;
}) {
  if (Object.keys(metadata).length === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="inline-block h-4 w-4 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-xs">
            {Object.entries(metadata).map(([key, value]) => (
              <div key={key}>
                <span className="font-medium">{key}:</span> {String(value)}
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface CreditsUsageHistoryCardProps {
  events: UsageHistoryEvent[];
}

export function CreditsUsageHistoryCard({
  events,
}: CreditsUsageHistoryCardProps) {
  const l = locales.BillingOverview.creditsUsageHistoryCard;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{l.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-muted-foreground">{l.emptyState}</p>
        ) : (
          <>
            {/* Desktop table view */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 pr-4 text-sm font-medium text-muted-foreground">
                        {l.columns.event}
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        {l.columns.date}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id} className="border-b last:border-b-0">
                        <td className="py-4 pr-4 text-sm">
                          <span className="inline-flex items-center gap-1.5">
                            {event.name}
                            <MetadataTooltip metadata={event.metadata} />
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm">
                          {formatShortDate(event.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile card view */}
            <div className="md:hidden space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium inline-flex items-center gap-1.5">
                      {event.name}
                      <MetadataTooltip metadata={event.metadata} />
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatShortDate(event.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
      {events.length > 0 && (
        <CardFooter>
          <Link
            href={routes.account.billing.usage}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {l.showMore}
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
