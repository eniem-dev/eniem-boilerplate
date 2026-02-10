import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { locales } from "@/locales";

export function CreditsUsageHistorySkeleton() {
  const l = locales.BillingOverview.creditsUsageHistoryCard;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{l.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop table skeleton */}
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
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="py-4 pr-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="py-4 px-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile card skeleton */}
        <div className="md:hidden space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
