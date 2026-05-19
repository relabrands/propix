interface Props {
  title?: string;
  subtitle?: string;
  className?: string;
}

/**
 * Empty state shown when no properties / data exist yet.
 * Subtle gold animated pulse indicator + message.
 */
export default function EmptyState({
  title = "Próximamente nuevas oportunidades de inversión",
  subtitle,
  className = "",
}: Props) {
  return (
    <div
      className={`glass rounded-2xl p-8 text-center flex flex-col items-center ${className}`}
    >
      <div className="relative h-12 w-12 mb-5">
        <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
        <span className="absolute inset-2 rounded-full bg-primary/40 animate-pulse" />
        <span className="absolute inset-[14px] rounded-full bg-gradient-gold shadow-gold" />
      </div>
      <p className="font-display text-xl leading-tight text-balance max-w-xs">
        {title}
      </p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-2 max-w-xs text-balance">
          {subtitle}
        </p>
      )}
    </div>
  );
}
