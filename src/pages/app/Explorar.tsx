import { useState, useEffect } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import PropertyCard from "@/components/PropertyCard";
import EmptyState from "@/components/EmptyState";
import { Search } from "lucide-react";
import { collection, onSnapshot, query as fsQuery } from "firebase/firestore";
import { db } from "@/lib/firebase";

const filters = ["Todos", "Disponibles", "Casi llenos", "Rentando"] as const;

export default function Explorar() {
  const [active, setActive] = useState<typeof filters[number]>("Todos");
  const [properties, setProperties] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = fsQuery(collection(db, "properties"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setProperties(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filtered = properties.filter((p) => {
    // 1. Search Query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(q);
      const matchLocation = p.location?.toLowerCase().includes(q);
      if (!matchName && !matchLocation) return false;
    }

    // 2. Tab filter
    if (active === "Todos") return true;
    if (active === "Disponibles") return p.status === "disponible" || p.status === "nuevo";
    if (active === "Casi llenos") {
      const pct = (p.fractionsSold || 0) / (p.totalFractions || 1);
      return pct >= 0.6 && p.status !== "rentando";
    }
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Cargando catálogo...
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState subtitle="Estamos curando las próximas propiedades. Vuelve pronto." />
          ) : (
            filtered.map((p) => (
              <PropertyCard key={p.id} property={p} variant="wide" />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
