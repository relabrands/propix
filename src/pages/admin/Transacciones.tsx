import { useState, useEffect } from "react";
import { Calendar, Download, Eye, Check, RotateCcw, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import StatusPill from "@/components/admin/StatusPill";
import StatCard from "@/components/admin/StatCard";
import { ArrowLeftRight, DollarSign, Clock, AlertOctagon } from "lucide-react";
import { type TxType, type TxStatus } from "@/lib/adminMockData";
import { formatUSD } from "@/lib/format";
import { cn } from "@/lib/utils";
import { collection, onSnapshot, query as fsQuery, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

const TYPES: ("Todos" | TxType)[] = ["Todos", "Inversión", "Distribución", "Retiro", "Fee"];
const STATUSES: ("Todos" | TxStatus)[] = ["Todos", "Completada", "Pendiente", "Fallida", "Reembolsada"];

export default function Transacciones() {
  const [type, setType] = useState<(typeof TYPES)[number]>("Todos");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("Todos");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = fsQuery(collection(db, "transactions"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setTransactions(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleComplete = async (txId: string) => {
    try {
      await updateDoc(doc(db, "transactions", txId), { status: "Completada" });
      toast.success("Transacción confirmada y completada");
    } catch (err: any) {
      toast.error("Error al completar la transacción");
    }
  };

  const handleRefund = async (txId: string) => {
    try {
      await updateDoc(doc(db, "transactions", txId), { status: "Reembolsada" });
      toast.success("Transacción reembolsada");
    } catch (err: any) {
      toast.error("Error al reembolsar la transacción");
    }
  };

  const filtered = transactions.filter((tx) => {
    if (type !== "Todos" && tx.type !== type) return false;
    if (status !== "Todos" && tx.status !== status) return false;
    return true;
  });

  const totalMoved = transactions.reduce((s, t) => s + (t.type === "Inversión" || t.type === "Distribución" ? (t.amount || 0) : 0), 0);
  const totalFees = transactions.reduce((s, t) => s + (t.fee || 0), 0);
  const pendingCount = transactions.filter((t) => t.status === "Pendiente").length;
  const failedCount = transactions.filter((t) => t.status === "Fallida").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Transacciones"
        subtitle="Movimientos en la plataforma"
        actions={
          <>
            <button className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border text-sm hover:border-border-strong transition-colors">
              <Calendar className="h-4 w-4" /> Mayo 2026
            </button>
            <button className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-gradient-gold text-primary-foreground text-sm font-medium hover:shadow-glow transition-shadow">
              <Download className="h-4 w-4" /> Exportar
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Movido total" value={formatUSD(totalMoved, { decimals: 0 })} icon={ArrowLeftRight} accent="gold" change={14.2} />
        <StatCard label="Fees cobrados" value={formatUSD(totalFees, { decimals: 0 })} icon={DollarSign} accent="teal" change={22.8} />
        <StatCard label="Pendientes" value={pendingCount.toString()} icon={Clock} hint={pendingCount > 0 ? "Requiere acción" : "Sin pendientes"} />
        <StatCard label="Fallidas" value={failedCount.toString()} icon={AlertOctagon} hint={failedCount > 0 ? "Revisar" : "Sin alertas"} />
      </div>

      {pendingCount > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          <div className="text-sm">
            Hay <span className="font-mono text-warning">{pendingCount}</span> transacciones pendientes de confirmación bancaria o retiro.
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <FilterGroup label="Tipo" options={TYPES} value={type} onChange={(v) => setType(v as typeof type)} />
        <FilterGroup label="Estado" options={STATUSES} value={status} onChange={(v) => setStatus(v as typeof status)} />
      </div>

      <div className="rounded-lg border border-border bg-[hsl(var(--surface))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/20">
              <tr>
                <th className="text-left px-4 py-3 font-medium">ID</th>
                <th className="text-left px-4 py-3 font-medium">Fecha</th>
                <th className="text-left px-4 py-3 font-medium">Inversor</th>
                <th className="text-left px-4 py-3 font-medium">Propiedad</th>
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-right px-4 py-3 font-medium">Monto</th>
                <th className="text-right px-4 py-3 font-medium">Fee</th>
                <th className="text-left px-4 py-3 font-medium">Método</th>
                <th className="text-left px-4 py-3 font-medium">Estado</th>
                <th className="text-right px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                    {loading ? "Cargando transacciones..." : "No se encontraron transacciones"}
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground truncate max-w-[80px]" title={tx.id}>{tx.id}</td>
                    <td className="px-4 py-3 font-mono text-xs">{tx.date ? new Date(tx.date).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3 truncate max-w-[140px]">{tx.investor || "Inversor"}</td>
                    <td className="px-4 py-3 text-muted-foreground truncate max-w-[140px]">{tx.property || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusPill tone={tx.type === "Inversión" ? "gold" : tx.type === "Distribución" ? "teal" : tx.type === "Retiro" ? "muted" : "info"}>
                        {tx.type}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{formatUSD(tx.amount || 0, { decimals: 0 })}</td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">{tx.fee ? `$${tx.fee}` : "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[160px]">{tx.method || "Transferencia"}</td>
                    <td className="px-4 py-3">
                      <StatusPill tone={tx.status === "Completada" ? "success" : tx.status === "Pendiente" ? "warning" : tx.status === "Fallida" || tx.status === "Reembolsada" ? "danger" : "muted"}>
                        {tx.status}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button title="Ver" className="h-7 w-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center"><Eye className="h-3.5 w-3.5" /></button>
                        {tx.status === "Pendiente" && (
                          <>
                            <button
                              onClick={() => handleComplete(tx.id)}
                              title="Marcar completada"
                              className="h-7 w-7 rounded hover:bg-success/10 text-muted-foreground hover:text-success flex items-center justify-center"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleRefund(tx.id)}
                              title="Reembolsar"
                              className="h-7 w-7 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
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

function FilterGroup<T extends string>({ label, options, value, onChange }: { label: string; options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}:</span>
      <div className="inline-flex items-center gap-1 p-1 rounded-md bg-[hsl(var(--surface))] border border-border">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              "px-2.5 h-7 rounded text-xs font-medium transition-colors",
              value === opt ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
