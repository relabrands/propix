interface Props {
  value: number; // 0-100
  className?: string;
  variant?: "gold" | "teal";
}
export default function ProgressBar({ value, className = "", variant = "gold" }: Props) {
  const pct = Math.max(0, Math.min(100, value));
  const fill =
    variant === "gold"
      ? "bg-gradient-gold"
      : "bg-gradient-to-r from-secondary to-secondary/70";
  return (
    <div className={`h-2 w-full rounded-full bg-muted overflow-hidden ${className}`}>
      <div
        className={`h-full ${fill} rounded-full transition-[width] duration-700 ease-out`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
