import { useState } from "react";
import { FileText, Camera, Eye, Check, X, ZoomIn } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import StatusPill from "@/components/admin/StatusPill";
import { kycQueue } from "@/lib/adminMockData";
import { cn } from "@/lib/utils";

type Card = (typeof kycQueue.pending)[number] & { decision?: "approved" | "rejected" };

export default function KYC() {
  const [open, setOpen] = useState<Card | null>(null);

  const columns = [
    { key: "pending", title: "Pendientes de revisión", tone: "warning" as const, items: kycQueue.pending },
    { key: "review", title: "En revisión", tone: "info" as const, items: kycQueue.inReview },
    { key: "done", title: "Completados hoy", tone: "success" as const, items: kycQueue.done },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="KYC / Verificaciones"
        subtitle={`${kycQueue.pending.length + kycQueue.inReview.length} casos requieren acción · ${kycQueue.done.length} completados hoy`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {columns.map((col) => (
          <div key={col.key} className="rounded-lg border border-border bg-[hsl(var(--surface))] flex flex-col min-h-[60vh]">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{col.title}</span>
                <StatusPill tone={col.tone}>{col.items.length}</StatusPill>
              </div>
            </div>
            <div className="p-3 space-y-2 flex-1">
              {col.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-md border border-border bg-background/40 p-3 hover:border-border-strong transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-gold/30 border border-primary/30 flex items-center justify-center text-xs font-medium shrink-0">
                      {item.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.investor}</div>
                      <div className="text-[11px] text-muted-foreground">{item.submittedAt}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-[11px] text-muted-foreground">
                    <DocChip ok={item.cedula}><FileText className="h-3 w-3" /> Cédula</DocChip>
                    <DocChip ok={item.selfie}><Camera className="h-3 w-3" /> Selfie</DocChip>
                  </div>
                  {"decision" in item && item.decision ? (
                    <div className="mt-3">
                      <StatusPill tone={item.decision === "approved" ? "success" : "danger"}>
                        {item.decision === "approved" ? "Aprobado" : "Rechazado"}
                      </StatusPill>
                    </div>
                  ) : (
                    <button
                      onClick={() => setOpen(item)}
                      className="mt-3 w-full h-8 rounded-md bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" /> Revisar documentos
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Document viewer modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <div
            className="bg-[hsl(var(--surface-elevated))] border border-border-strong rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="font-display text-xl">{open.investor}</div>
                <div className="text-xs text-muted-foreground">Verificación KYC · enviado {open.submittedAt}</div>
              </div>
              <button onClick={() => setOpen(null)} className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              {["Cédula (frente)", "Cédula (reverso)", "Selfie"].map((label) => (
                <div key={label} className="space-y-2">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
                  <div className="aspect-[3/4] rounded-md bg-gradient-to-br from-muted to-background border border-border flex items-center justify-center relative group cursor-zoom-in overflow-hidden">
                    <FileText className="h-12 w-12 text-muted-foreground/40" />
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 pb-5">
              <div className="rounded-md border border-border bg-background/40 p-4 space-y-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Verificación de coincidencia</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Nombre cédula</span>
                    <span className="font-mono">{open.investor}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Nombre cuenta</span>
                    <span className="font-mono">{open.investor}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Match facial</span>
                    <StatusPill tone="success">98.4%</StatusPill>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Documento válido</span>
                    <StatusPill tone="success">Verificado</StatusPill>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-2">
              <button className="h-9 px-4 rounded-md border border-destructive/40 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors inline-flex items-center gap-2">
                <X className="h-4 w-4" /> Rechazar
              </button>
              <button className="h-9 px-4 rounded-md bg-success text-success-foreground text-sm font-medium hover:bg-success/90 transition-colors inline-flex items-center gap-2">
                <Check className="h-4 w-4" /> Aprobar verificación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocChip({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px]",
        ok ? "border-success/30 text-success bg-success/5" : "border-destructive/30 text-destructive bg-destructive/5",
      )}
    >
      {children}
      {ok ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
    </span>
  );
}
