import { useState, useEffect } from "react";
import { Search, Eye, MessageSquare, Ban, Download } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import StatusPill from "@/components/admin/StatusPill";
import StatCard from "@/components/admin/StatCard";
import { Users, ShieldCheck, Clock, AlertOctagon } from "lucide-react";
import { formatUSD } from "@/lib/format";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function Inversores() {
  const [queryText, setQueryText] = useState("");
  const [tab, setTab] = useState<"todos" | "verificados" | "pendientes" | "suspendidos">("todos");
  const [investors, setInvestors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvestors = async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "investor"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => {
          const user = doc.data();
          return {
            id: doc.id,
            name: user.name || "Sin nombre",
            cedula: user.cedula || "N/A",
            email: user.email || "N/A",
            phone: user.phone || "N/A",
            totalInvested: user.totalInvested || 0,
            propertiesCount: user.propertiesCount || 0,
            monthlyIncome: user.monthlyIncome || 0,
            registeredAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Desconocido",
            kycStatus: user.kycStatus === "verificado" ? "Verificado" 
                     : user.kycStatus === "submitted" ? "En revisión" 
                     : "Pendiente",
            suspended: user.suspended || false,
          };
        });
        setInvestors(data);
      } catch (error) {
        console.error("Error fetching investors:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvestors();
  }, []);

  const filtered = investors.filter((i) => {
    if (tab === "verificados" && i.kycStatus !== "Verificado") return false;
    if (tab === "pendientes" && i.kycStatus !== "Pendiente" && i.kycStatus !== "En revisión") return false;
    if (tab === "suspendidos" && !i.suspended) return false;
    if (queryText && !i.name.toLowerCase().includes(queryText.toLowerCase()) && !i.email.toLowerCase().includes(queryText.toLowerCase())) return false;
    return true;
  });

  const verified = investors.filter((i) => i.kycStatus === "Verificado").length;
  const pending = investors.filter((i) => i.kycStatus === "Pendiente" || i.kycStatus === "En revisión").length;
  const suspended = investors.filter((i) => i.suspended).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inversores"
        subtitle={loading ? "Cargando inversores..." : `${investors.length} cuentas registradas`}
        actions={
          <button className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border text-sm hover:border-border-strong transition-colors">
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total inversores" value={investors.length.toString()} icon={Users} hint="Acumulado" />
        <StatCard label="Verificados" value={verified.toString()} icon={ShieldCheck} accent="teal" hint="KYC OK" />
        <StatCard label="Pendientes KYC" value={pending.toString()} icon={Clock} accent="gold" hint="Por revisar" />
        <StatCard label="Suspendidos" value={suspended.toString()} icon={AlertOctagon} hint="Cuentas bloqueadas" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-1 p-1 rounded-md bg-[hsl(var(--surface))] border border-border">
          {(["todos", "verificados", "pendientes", "suspendidos"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 h-7 rounded text-xs font-medium capitalize transition-colors",
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Buscar por nombre o email…"
            className="w-full h-9 rounded-md bg-[hsl(var(--surface))] border border-border pl-9 pr-3 text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-[hsl(var(--surface))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/20">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Inversor</th>
                <th className="text-left px-4 py-3 font-medium">Contacto</th>
                <th className="text-right px-4 py-3 font-medium">Invertido</th>
                <th className="text-right px-4 py-3 font-medium">Props</th>
                <th className="text-right px-4 py-3 font-medium">Renta/mes</th>
                <th className="text-right px-4 py-3 font-medium">Registro</th>
                <th className="text-left px-4 py-3 font-medium">KYC</th>
                <th className="text-right px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    {loading ? "Cargando..." : "No se encontraron inversores"}
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className={cn("border-t border-border hover:bg-muted/20 transition-colors", inv.suspended && "opacity-60")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-gold/30 border border-primary/30 flex items-center justify-center text-xs font-medium shrink-0">
                          {inv.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{inv.name}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">{inv.cedula}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="text-xs truncate max-w-[180px]">{inv.email}</div>
                      <div className="text-[11px] font-mono">{inv.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{formatUSD(inv.totalInvested, { decimals: 0 })}</td>
                    <td className="px-4 py-3 text-right font-mono">{inv.propertiesCount}</td>
                    <td className="px-4 py-3 text-right font-mono text-secondary">{formatUSD(inv.monthlyIncome)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">{inv.registeredAt}</td>
                    <td className="px-4 py-3">
                      <StatusPill
                        tone={
                          inv.kycStatus === "Verificado"
                            ? "success"
                            : inv.kycStatus === "Pendiente"
                            ? "warning"
                            : inv.kycStatus === "En revisión"
                            ? "info"
                            : "danger"
                        }
                      >
                        {inv.kycStatus}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button title="Ver perfil" className="h-7 w-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center"><Eye className="h-3.5 w-3.5" /></button>
                        <button title="Contactar" className="h-7 w-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center"><MessageSquare className="h-3.5 w-3.5" /></button>
                        <button title="Suspender" className="h-7 w-7 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center"><Ban className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
