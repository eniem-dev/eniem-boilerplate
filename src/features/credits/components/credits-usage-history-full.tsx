"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { locales } from "@/locales";
import { formatShortDate } from "@/features/billing/billing.util";
import type {
  UsageHistoryEvent,
  UsageHistoryResult,
} from "../models/credits.model";
import type { ApiResponse } from "@/lib/server-handler";

interface CreditsUsageHistoryFullProps {
  initialEvents: UsageHistoryEvent[];
  initialMaxPage: number;
}

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

export function CreditsUsageHistoryFull({
  initialEvents,
  initialMaxPage,
}: CreditsUsageHistoryFullProps) {
  const l = locales.UsageHistoryPage;
  const cl = locales.BillingOverview.creditsUsageHistoryCard;
  const [events, setEvents] = useState(initialEvents);
  const [currentPage, setCurrentPage] = useState(1);
  const [maxPage, setMaxPage] = useState(initialMaxPage);
  const [isLoading, setIsLoading] = useState(false);

  const hasMore = currentPage < maxPage;

  const loadMore = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const response = await fetch(`/api/credits/usage?page=${nextPage}`);
      if (!response.ok) throw new Error("Failed to load more");

      const json: ApiResponse<UsageHistoryResult> = await response.json();
      if (!json.success) throw new Error(json.error);

      setEvents((prev) => [...prev, ...json.data.events]);
      setCurrentPage(nextPage);
      setMaxPage(json.data.pagination.maxPage);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  if (events.length === 0) {
    return <p className="text-muted-foreground">{cl.emptyState}</p>;
  }

  return (
    <div className="space-y-4">
      {/* Desktop table view */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 pr-4 text-sm font-medium text-muted-foreground">
                  {cl.columns.event}
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                  {cl.columns.date}
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
          <div key={event.id} className="border rounded-lg p-4 space-y-3">
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

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isLoading}
          >
            {isLoading ? l.loading : l.loadMore}
          </Button>
        </div>
      )}
    </div>
  );
}
