import ScreenHeader from "@/components/ScreenHeader";
import EmptyState from "@/components/EmptyState";
import { bankAccounts, portfolioStats, transactions } from "@/lib/mockData";
import { formatDateEs, formatUSD } from "@/lib/format";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const filters = ["Todos", "Recibidos", "Retirados"] as const;

export default function Pagos() {
  const [filter, setFilter] = useState<typeof filters[number]>("Todos");
  const filtered = transactions.filter((t) => {
    if (filter === "Todos") return true;
    if (filter === "Recibidos") return t.type === "received";
    return t.type === "withdrawn";
  });

  return (
    <div className="pb-4">
      <ScreenHeader title="Pagos" subtitle="Cuentas y transacciones" />

      <div className="px-5 space-y-5">
        {/* Pending banner — only when there's a balance */}
        {portfolioStats.monthlyIncome > 0 && (
          <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-warning/20 grid place-items-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Tienes <span className="font-mono">{formatUSD(portfolioStats.monthlyIncome)}</span> disponibles</p>
              <p className="text-xs text-muted-foreground mt-0.5">Próximo pago programado en {portfolioStats.nextPaymentDays} días.</p>
            </div>
            <button
              onClick={() => toast.success("Retiro solicitado · llegará en 1-2 días hábiles")}
              className="h-9 px-3 rounded-xl bg-gradient-gold text-primary-foreground text-xs font-semibold"
            >
              Retirar
            </button>
          </div>
        )}

        {/* Bank accounts */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-2xl">Cuentas bancarias</h2>
            <button className="h-8 w-8 rounded-full glass grid place-items-center" aria-label="Agregar">
              <Plus className="h-4 w-4 text-primary" />
            </button>
          </div>
          <div className="space-y-2">
            {bankAccounts.map((b) => (
              <div key={b.id} className="glass rounded-2xl p-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-gold-soft border border-primary/30 grid place-items-center">
                  <span className="font-display text-lg text-primary">{b.bank[0]}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{b.bank}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">•••• {b.last4}</p>
                </div>
                {b.verified ? (
                  <span className="text-[10px] text-success bg-success/15 px-2 py-1 rounded-full">✓ Verificada</span>
                ) : (
                  <span className="text-[10px] text-warning bg-warning/15 px-2 py-1 rounded-full">Pendiente</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Filters */}
        <div className="-mx-5 px-5 flex gap-2 overflow-x-auto no-scrollbar">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 h-9 px-4 rounded-full text-xs font-medium transition-all ${
                filter === f ? "bg-gradient-gold text-primary-foreground shadow-gold" : "glass text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Transactions */}
        <section>
          <h2 className="font-display text-2xl mb-3">Transacciones</h2>
          {filtered.length > 0 ? (
            <div className="glass rounded-2xl divide-y divide-border">
              {filtered.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-4">
                  <div
                    className={`h-10 w-10 rounded-xl grid place-items-center ${
                      t.type === "received" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {t.type === "received" ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.description}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDateEs(t.date)} · {t.status}
                    </p>
                  </div>
                  <p
                    className={`font-mono text-sm ${
                      t.type === "received" ? "text-success" : "text-destructive"
                    }`}
                  >
                    {t.type === "received" ? "+" : ""}
                    {formatUSD(t.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aún no hay transacciones"
              subtitle="Tus pagos y retiros aparecerán aquí."
            />
          )}
        </section>
      </div>
    </div>
  );
}
