import { Link } from "react-router-dom";
import type { Property } from "@/lib/mockData";
import ProgressBar from "./ProgressBar";
import { formatPct, formatUSD } from "@/lib/format";
import { MapPin, TrendingUp } from "lucide-react";

interface Props {
  property: Property;
  variant?: "horizontal" | "wide";
}

export default function PropertyCard({ property, variant = "wide" }: Props) {
  const pct = Math.round((property.fractionsSold / property.totalFractions) * 100);

  if (variant === "horizontal") {
    return (
      <Link
        to={`/app/propiedad/${property.id}`}
        className="block w-[78%] shrink-0 snap-start group"
      >
        <article className="glass rounded-2xl overflow-hidden shadow-card transition-transform duration-300 group-active:scale-[0.98]">
          <div className="relative h-40 overflow-hidden">
            <img
              src={property.image}
              alt={property.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[11px] glass px-2 py-1 rounded-full">
              <MapPin className="h-3 w-3 text-primary" /> {property.location.split(",")[0]}
            </span>
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-secondary/15 text-secondary border border-secondary/30">
              <TrendingUp className="h-3 w-3" /> {formatPct(property.roiAnnual)} ROI
            </span>
            <div className="absolute bottom-3 left-3 right-3">
              <h3 className="font-display text-lg leading-tight text-balance">{property.name}</h3>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-end justify-between text-xs">
              <span className="text-muted-foreground">{pct}% financiado</span>
              <span className="font-mono text-primary">Desde {formatUSD(property.pricePerFraction, { decimals: 0 })}</span>
            </div>
            <ProgressBar value={pct} />
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link to={`/app/propiedad/${property.id}`} className="block group">
      <article className="glass rounded-2xl overflow-hidden shadow-card transition-transform duration-300 group-active:scale-[0.99]">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={property.image}
            alt={property.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent" />
          {property.badge && (
            <span
              className={`absolute top-3 left-3 text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full ${
                property.badge === "NUEVO"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-primary text-primary-foreground shadow-glow"
              }`}
            >
              {property.badge}
            </span>
          )}
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="font-display text-2xl leading-tight">{property.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{property.type} · {property.location}</p>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-4 gap-2 text-[11px]">
            <Metric label="Mín." value={`$${property.pricePerFraction.toLocaleString()}`} />
            <Metric label="ROI" value={`${formatPct(property.roiAnnual)}`} accent />
            <Metric label="Fracc." value={`${property.totalFractions}`} />
            <Metric label="Días" value={`${property.daysLeft || "—"}`} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{pct}% financiado</span>
              <span className="font-mono text-foreground">
                {formatUSD(property.fractionsSold * property.pricePerFraction, { decimals: 0 })} / {formatUSD(property.totalPrice, { decimals: 0 })}
              </span>
            </div>
            <ProgressBar value={pct} />
          </div>
          <button className="w-full h-11 rounded-xl bg-gradient-gold text-primary-foreground font-semibold text-sm shadow-gold transition-transform active:scale-[0.98]">
            Invertir ahora
          </button>
        </div>
      </article>
    </Link>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-surface/60 border border-border px-2 py-1.5 text-center">
      <p className="text-muted-foreground">{label}</p>
      <p className={`font-mono text-xs mt-0.5 ${accent ? "text-secondary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
