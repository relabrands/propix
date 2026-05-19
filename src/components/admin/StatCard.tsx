import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  change?: number;
  icon?: LucideIcon;
  accent?: "gold" | "teal" | "default";
  hint?: string;
}

export default function StatCard({ label, value, change, icon: Icon, accent = "default", hint }: Props) {
  const positive = change !== undefined && change >= 0;
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-[hsl(var(--surface))] p-4 hover:border-border-strong transition-colors group">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</div>
        {Icon && (
          <div
            className={cn(
              "h-7 w-7 rounded-md flex items-center justify-center",
              accent === "gold" && "bg-primary/10 text-primary",
              accent === "teal" && "bg-secondary/10 text-secondary",
              accent === "default" && "bg-muted/40 text-muted-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="mt-1.5 flex items-center gap-2">
        {change !== undefined && (
          <div
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium font-mono",
              positive ? "text-success" : "text-destructive",
            )}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {positive ? "+" : ""}
            {change.toFixed(1)}%
          </div>
        )}
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {hint ?? "vs mes anterior"}
        </div>
      </div>
      {accent === "gold" && (
        <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors" />
      )}
    </div>
  );
}
