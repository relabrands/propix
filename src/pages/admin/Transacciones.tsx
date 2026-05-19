import { useState } from "react";
import { Calendar, Download, Eye, Check, RotateCcw, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import StatusPill from "@/components/admin/StatusPill";
import StatCard from "@/components/admin/StatCard";
import { ArrowLeftRight, DollarSign, Clock, AlertOctagon } from "lucide-react";
import { adminTransactions, type TxType, type TxStatus } from "@/lib/adminMockData";
import { formatUSD } from "@/lib/format";
import { cn } from "@/lib/utils";

const TYPES: ("Todos" | TxType)[] = ["Todos", "Inversión", "Distribución", "Retiro", "Fee"];
const STATUSES: ("Todos" | TxStatus)[] = ["Todos", "Completada", "Pendiente", "Fallida", "Reembolsada"];

export default function Transacciones() {
  const [type, setType] = useState<(typeof TYPES)[number]>("Todos");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("Todos");

  const filtered = adminTransactions.filter((tx) => {
    if (type !== "Todos" && tx.type !== type) return false;
    if (status !== "Todos" && tx.status !== status) return false;
    return true;
  });

  const totalMoved = adminTransactions.reduce((s, t) => s + (t.type === "Inversión" || t.type === "Distribución" ? t.amount : 0), 0);
  const totalFees = adminTransactions.reduce((s, t) => s + t.fee, 0);
  const pendingCount = adminTransactions.filter((t) => t.status === "Pendiente").length;
  const failedCount = adminTransactions.filter((t) => t.status === "Fallida").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Transacciones"
        subtitle="Movimientos en la plataforma"
        actions={
          <>
            <button className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border text-sm hover:border-border-strong transition-colors">
              <Calendar className="h-4 w-4" /> Abr 1 — Abr 23
            </button>
            <button className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-gradient-gold text-primary-foreground text-sm font-medium hover:shadow-glow transition-shadow">
              <Download className="h-4 w-4" /> Exportar
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Movido este mes" value={formatUSD(totalMoved, { decimals: 0 })} icon={ArrowLeftRight} accent="gold" change={14.2} />
        <StatCard label="Fees cobrados" value={formatUSD(totalFees, { decimals: 0 })} icon={DollarSign} accent="teal" change={22.8} />
        <StatCard label="Pendientes" value={pendingCount.toString()} icon={Clock} hint={pendingCount > 0 ? "Requiere acción" : "Sin pendientes"} />
        <StatCard label="Fallidas" value={failedCount.toString()} icon={AlertOctagon} hint={failedCount > 0 ? "Revisar" : "Sin alertas"} />
      </div>

      {pendingCount > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          <div className="text-sm">
            Hay <span className="font-mono text-warning">{pendingCount}</span> transacciones pendientes de confirmación bancaria.
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
              {filtered.map((tx) => (
                <tr key={tx.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.id}</td>
                  <td className="px-4 py-3 font-mono text-xs">{tx.date}</td>
                  <td className="px-4 py-3 truncate max-w-[140px]">{tx.investor}</td>
                  <td className="px-4 py-3 text-muted-foreground truncate max-w-[140px]">{tx.property}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={tx.type === "Inversión" ? "gold" : tx.type === "Distribución" ? "teal" : tx.type === "Retiro" ? "muted" : "info"}>
                      {tx.type}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{formatUSD(tx.amount, { decimals: 0 })}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{tx.fee ? `$${tx.fee}` : "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[160px]">{tx.method}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={tx.status === "Completada" ? "success" : tx.status === "Pendiente" ? "warning" : tx.status === "Fallida" ? "danger" : "muted"}>
                      {tx.status}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button title="Ver" className="h-7 w-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center"><Eye className="h-3.5 w-3.5" /></button>
                      <button title="Marcar completada" className="h-7 w-7 rounded hover:bg-success/10 text-muted-foreground hover:text-success flex items-center justify-center"><Check className="h-3.5 w-3.5" /></button>
                      <button title="Reembolsar" className="h-7 w-7 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center"><RotateCcw className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
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
