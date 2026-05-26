import { useState, useEffect } from "react";
import { Send, Upload, Download, Check, Calendar } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/admin/PageHeader";
import StatusPill from "@/components/admin/StatusPill";
import { rentReports } from "@/lib/devMockData";
import { collection, query as fsQuery, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatUSD } from "@/lib/format";

export default function Distribuciones() {
  const [activeProjects, setActiveProjects] = useState<{ id: string; name: string; developer: string }[]>([]);
  const [projectId, setProjectId] = useState("");
  const [gross, setGross] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [hasReceipt, setHasReceipt] = useState(false);
  const net = gross - expenses;
  const project = activeProjects.find((p) => p.id === projectId);
  const currentMonth = "Abril 2026";

  useEffect(() => {
    const q = fsQuery(collection(db, "properties"), where("status", "==", "rentando"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        developer: doc.data().developer?.name || "Desarrolladora"
      }));
      setActiveProjects(data);
      if (data.length > 0 && !projectId) {
        setProjectId(data[0].id);
      }
    });
    return () => unsubscribe();
  }, [projectId]);

  const submit = () => {
    if (!project) {
      toast.error("Selecciona un proyecto", { description: "Primero crea propiedades activas para distribuir." });
      return;
    }
    if (!hasReceipt) {
      toast.error("Sube el estado de cuenta", { description: "Necesitamos comprobantes para procesar la distribución." });
      return;
    }
    if (gross <= 0) {
      toast.error("Renta bruta inválida", { description: "Ingresa el monto cobrado este mes." });
      return;
    }
    toast.success("Distribución programada", {
      description: `${project.name} · ${currentMonth} · ${formatUSD(net, { decimals: 0 })} netos a inversores`,
    });
    setGross(0);
    setExpenses(0);
    setHasReceipt(false);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pagos y distribuciones"
        subtitle="Reporta la renta cobrada y ejecuta distribuciones a inversores"
      />

      {/* Report new rent */}
      <div className="rounded-lg border border-border bg-[hsl(var(--surface))] p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl">Reportar renta de {currentMonth}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Una vez confirmado, Propix ejecutará la distribución proporcional a cada inversor según sus fracciones.
            </p>
          </div>
          <StatusPill tone="warning"><Calendar className="h-3 w-3" /> Vence el 5 de mayo</StatusPill>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Proyecto</label>
            {activeProjects.length > 0 ? (
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full h-10 rounded-md bg-background border border-border px-3 text-sm focus:outline-none focus:border-primary/50"
              >
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.developer}</option>
                ))}
              </select>
            ) : (
              <div className="w-full h-10 rounded-md bg-muted/40 border border-dashed border-border px-3 text-sm text-muted-foreground flex items-center">
                Sin proyectos activos. Crea una propiedad primero.
              </div>
            )}
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Mes a reportar</label>
            <input
              value={currentMonth}
              disabled
              className="w-full h-10 rounded-md bg-muted/40 border border-border px-3 text-sm font-mono text-muted-foreground"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Renta bruta cobrada (USD)</label>
            <input
              type="number"
              value={gross}
              onChange={(e) => setGross(Number(e.target.value))}
              className="w-full h-10 rounded-md bg-background border border-border px-3 text-sm font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Gastos / mantenimiento (USD)</label>
            <input
              type="number"
              value={expenses}
              onChange={(e) => setExpenses(Number(e.target.value))}
              className="w-full h-10 rounded-md bg-background border border-border px-3 text-sm font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {/* Net summary */}
        <div className="rounded-md border border-primary/30 bg-gradient-gold-soft p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Neto a distribuir</div>
            <div className="font-mono text-3xl text-primary mt-0.5">{formatUSD(net, { decimals: 0 })}</div>
          </div>
          <div className="text-right text-xs text-muted-foreground space-y-0.5">
            <div>Bruta: <span className="font-mono text-foreground">{formatUSD(gross, { decimals: 0 })}</span></div>
            <div>− Gastos: <span className="font-mono text-foreground">{formatUSD(expenses, { decimals: 0 })}</span></div>
            <div>= Margen: <span className="font-mono text-secondary">{gross > 0 ? ((net / gross) * 100).toFixed(1) : "0.0"}%</span></div>
          </div>
        </div>

        {/* Documents upload */}
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">
            Estado de cuenta bancario (comprobante)
          </label>
          <button
            onClick={() => setHasReceipt((v) => !v)}
            className={`w-full border-2 border-dashed rounded-md p-6 text-center transition-colors ${
              hasReceipt ? "border-success/40 bg-success/5" : "border-border hover:border-primary/40"
            }`}
          >
            {hasReceipt ? (
              <div className="flex items-center justify-center gap-2 text-success">
                <Check className="h-5 w-5" />
                <span className="text-sm font-medium">estado-cuenta-abr-2026.pdf · 1.4 MB</span>
              </div>
            ) : (
              <div className="text-muted-foreground">
                <Upload className="h-6 w-6 mx-auto mb-2" />
                <div className="text-sm">Sube el estado de cuenta del banco</div>
                <div className="text-xs mt-0.5">PDF, máx 10MB</div>
              </div>
            )}
          </button>
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <button
            onClick={submit}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-gradient-gold text-primary-foreground text-sm font-semibold hover:shadow-glow transition-shadow"
          >
            <Send className="h-4 w-4" /> Ejecutar distribución
          </button>
        </div>
      </div>

      {/* Distribution history */}
      <div className="rounded-lg border border-border bg-[hsl(var(--surface))] overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl">Historial de distribuciones</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Registro completo de pagos a inversores</p>
          </div>
          <button className="text-xs text-primary hover:underline inline-flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5" /> Exportar todo
          </button>
        </div>

        {rentReports.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="h-12 w-12 mx-auto rounded-full bg-muted/40 grid place-items-center mb-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Aún no hay distribuciones registradas</p>
            <p className="text-xs text-muted-foreground/80 mt-1">El historial aparecerá aquí cuando reportes la primera renta</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/20">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Mes</th>
                  <th className="text-left px-4 py-3 font-medium">Proyecto</th>
                  <th className="text-left px-4 py-3 font-medium">Desarrolladora</th>
                  <th className="text-right px-4 py-3 font-medium">Renta bruta</th>
                  <th className="text-right px-4 py-3 font-medium">Gastos</th>
                  <th className="text-right px-4 py-3 font-medium">Neto distribuido</th>
                  <th className="text-left px-4 py-3 font-medium">Estado</th>
                  <th className="text-right px-4 py-3 font-medium">Fecha</th>
                  <th className="text-right px-4 py-3 font-medium">PDF</th>
                </tr>
              </thead>
              <tbody>
                {rentReports.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{r.month}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.projectName}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{r.developer}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatUSD(r.gross, { decimals: 0 })}</td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">−{formatUSD(r.expenses, { decimals: 0 })}</td>
                    <td className="px-4 py-3 text-right font-mono text-primary">{formatUSD(r.net, { decimals: 0 })}</td>
                    <td className="px-4 py-3">
                      <StatusPill tone={r.status === "Pagada" ? "success" : r.status === "En revisión" ? "warning" : "muted"}>
                        {r.status}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">{r.date}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="h-7 w-7 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors inline-flex items-center justify-center">
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
