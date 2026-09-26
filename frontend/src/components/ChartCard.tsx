import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartCardProps {
  title: string;
  description?: string;
  loading?: boolean;
  children: ReactNode;
  /** Right-aligned slot for filters / period switchers. */
  action?: ReactNode;
}

export function ChartCard({
  title,
  description,
  loading,
  children,
  action,
}: ChartCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-64 w-full" /> : children}
      </CardContent>
    </Card>
  );
}
