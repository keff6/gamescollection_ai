import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon: LucideIcon;
}

export function StatCard({ label, value, subtext, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {subtext && (
            <p className="mt-1 text-sm text-muted-foreground">{subtext}</p>
          )}
        </div>
        <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
      </CardContent>
    </Card>
  );
}
