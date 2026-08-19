import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartCardProps {
  title: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
}

export function ChartCard({
  title,
  isEmpty = false,
  emptyMessage = "No data yet",
  children,
}: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
