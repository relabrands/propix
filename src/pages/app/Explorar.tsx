import { useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import PropertyCard from "@/components/PropertyCard";
import EmptyState from "@/components/EmptyState";
import { properties } from "@/lib/mockData";
import { Search } from "lucide-react";

const filters = ["Todos", "Disponibles", "Casi llenos", "Rentando"] as const;

export default function Explorar() {
  const [active, setActive] = useState<typeof filters[number]>("Todos");

  const filtered = properties.filter((p) => {
    if (active === "Todos") return true;
    if (active === "Disponibles") return p.status === "disponible" || p.status === "nuevo";
    if (active === "Casi llenos")
      return p.fractionsSold / p.totalFractions >= 0.6 && p.status !== "rentando";
    if (active === "Rentando") return p.status === "rentando";
    return true;
  });

  return (
    <div>
      <ScreenHeader title="Explorar" subtitle="Propiedades disponibles" />

      <div className="px-5">
        <div className="flex items-center gap-3 h-12 px-4 rounded-2xl glass">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Buscar propiedad o ubicación..."
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
        </div>

        <div className="-mx-5 px-5 mt-4 flex gap-2 overflow-x-auto no-scrollbar">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`shrink-0 h-9 px-4 rounded-full text-xs font-medium transition-all ${
                active === f
                  ? "bg-gradient-gold text-primary-foreground shadow-gold"
                  : "glass text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-4 pb-4">
          {filtered.map((p) => (
            <PropertyCard key={p.id} property={p} variant="wide" />
          ))}
          {filtered.length === 0 && (
            <EmptyState subtitle="Estamos curando las próximas propiedades. Vuelve pronto." />
          )}
        </div>
      </div>
    </div>
  );
}
