import { cn } from "@/lib/utils";

type Tone = "gold" | "teal" | "success" | "warning" | "danger" | "muted" | "info";

const TONES: Record<Tone, string> = {
  gold: "bg-primary/10 text-primary border-primary/30",
  teal: "bg-secondary/10 text-secondary border-secondary/30",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  danger: "bg-destructive/10 text-destructive border-destructive/30",
  muted: "bg-muted/40 text-muted-foreground border-border",
  info: "bg-secondary/10 text-secondary border-secondary/30",
};

export default function StatusPill({
  children,
  tone = "muted",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
