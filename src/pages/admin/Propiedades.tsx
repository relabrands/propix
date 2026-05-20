import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Eye, Pencil, Pause, Archive, Filter } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import StatusPill from "@/components/admin/StatusPill";
import { type AdminPropertyStatus } from "@/lib/adminMockData";
import { formatUSD, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { collection, onSnapshot, query as fsQuery, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

const FILTERS: ("Todas" | AdminPropertyStatus)[] = ["Todas", "Activa", "En fondeo", "Cerrada", "Archivada"];

export default function Propiedades() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = fsQuery(collection(db, "properties"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => {
          const p = docSnap.data();
          // Map Firestore status to AdminPropertyStatus
          let statusMapped: AdminPropertyStatus = "En fondeo";
          if (p.status === "rentando") {
            statusMapped = "Activa";
          } else if (p.status === "cerrada") {
            statusMapped = "Cerrada";
          } else if (p.status === "archivada") {
            statusMapped = "Archivada";
          }

          return {
            id: docSnap.id,
            name: p.name,
            image: p.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
            developer: p.developer?.name || "Desarrolladora",
            totalPrice: p.totalPrice || 0,
            totalFractions: p.totalFractions || 1,
            fractionsSold: p.fractionsSold || 0,
            fractionPrice: p.pricePerFraction || 0,
            raised: (p.fractionsSold || 0) * (p.pricePerFraction || 0),
            roi: p.roiAnnual || 0,
            monthlyRent: p.monthlyIncomeEstimate || 0,
            status: statusMapped,
            location: p.location || "RD",
          };
        });
        setProperties(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching admin properties:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const items = properties.filter((p) => {
    if (filter !== "Todas" && p.status !== filter) return false;
    if (searchQuery && !p.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Propiedades"
        subtitle={loading ? "Cargando propiedades..." : `${properties.length} propiedades en cartera · ${formatUSD(properties.reduce((s, p) => s + p.raised, 0), { decimals: 0 })} recaudados`}
        actions={
          <Link
            to="/admin/propiedades/nueva"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-gradient-gold text-primary-foreground text-sm font-medium hover:shadow-glow transition-shadow"
          >
            <Plus className="h-4 w-4" /> Nueva propiedad
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-1 p-1 rounded-md bg-[hsl(var(--surface))] border border-border">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 h-7 rounded text-xs font-medium transition-colors",
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar propiedad…"
            className="w-full h-9 rounded-md bg-[hsl(var(--surface))] border border-border pl-9 pr-3 text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
        <button className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:border-border-strong transition-colors">
          <Filter className="h-4 w-4" /> Más filtros
        </button>
      </div>

      <div className="rounded-lg border border-border bg-[hsl(var(--surface))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/20">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Propiedad</th>
                <th className="text-left px-4 py-3 font-medium">Desarrolladora</th>
                <th className="text-right px-4 py-3 font-medium">Precio total</th>
                <th className="text-left px-4 py-3 font-medium w-56">Fracciones</th>
                <th className="text-right px-4 py-3 font-medium">Recaudado</th>
                <th className="text-right px-4 py-3 font-medium">ROI</th>
                <th className="text-right px-4 py-3 font-medium">Renta/mes</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                <th className="text-right px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    {loading ? "Cargando propiedades..." : "No se encontraron propiedades"}
                  </td>
                </tr>
              ) : (
                items.map((p) => {
                  const pct = (p.fractionsSold / p.totalFractions) * 100;
                  return (
                    <tr key={p.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.image} alt={p.name} className="h-10 w-14 rounded object-cover shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium truncate">{p.name}</div>
                            <div className="text-[11px] text-muted-foreground truncate">{p.location}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.developer}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatUSD(p.totalPrice, { decimals: 0 })}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-gold rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="font-mono text-xs text-muted-foreground tabular-nums w-16 text-right">
                            {p.fractionsSold}/{p.totalFractions}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{formatUSD(p.raised, { decimals: 0 })}</td>
                      <td className="px-4 py-3 text-right font-mono text-secondary">{formatPct(p.roi)}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatUSD(p.monthlyRent, { decimals: 0 })}</td>
                      <td className="px-4 py-3">
                        <StatusPill tone={p.status === "Activa" ? "success" : p.status === "En fondeo" ? "warning" : p.status === "Cerrada" ? "teal" : "muted"}>
                          {p.status}
                        </StatusPill>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <IconBtn label="Ver"><Eye className="h-3.5 w-3.5" /></IconBtn>
                          <IconBtn label="Editar"><Pencil className="h-3.5 w-3.5" /></IconBtn>
                          <IconBtn label="Pausar"><Pause className="h-3.5 w-3.5" /></IconBtn>
                          <IconBtn label="Archivar"><Archive className="h-3.5 w-3.5" /></IconBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

function IconBtn({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button title={label} className="h-7 w-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center">
      {children}
    </button>
  );
}
