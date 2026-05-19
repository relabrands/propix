import PageHeader from "@/components/admin/PageHeader";
import StatusPill from "@/components/admin/StatusPill";
import { Bell, DollarSign, Home, ShieldCheck, FileText, AlertTriangle } from "lucide-react";

const items = [
  { id: 1, icon: AlertTriangle, tone: "warning" as const, title: "5 KYC pendientes de revisión", body: "Casos esperando aprobación hace más de 24h.", time: "Hace 10 min" },
  { id: 2, icon: DollarSign, tone: "success" as const, title: "Distribución de renta completada", body: "Vista Bávaro · $1,923 enviados a 55 inversores.", time: "Hace 2h" },
  { id: 3, icon: Home, tone: "gold" as const, title: "Nueva propiedad solicitada", body: "Caribe Capital Group envió 'Hacienda Macao Beach'.", time: "Hoy 11:48" },
  { id: 4, icon: ShieldCheck, tone: "teal" as const, title: "Cambio en política aprobado", body: "Fondeo fee: 2.0% → 2.2%.", time: "Ayer 17:30" },
  { id: 5, icon: FileText, tone: "info" as const, title: "Reporte mensual generado", body: "Marzo 2026 · disponible para descarga.", time: "01 abr" },
];

export default function Notificaciones() {
  return (
    <div className="space-y-5">
      <PageHeader title="Notificaciones" subtitle="Eventos y alertas internas" />

      <div className="rounded-lg border border-border bg-[hsl(var(--surface))]">
        <div className="divide-y divide-border">
          {items.map((n) => {
            const Icon = n.icon;
            return (
              <div key={n.id} className="flex items-start gap-4 p-4 hover:bg-muted/20 transition-colors">
                <div className={`h-10 w-10 rounded-md flex items-center justify-center shrink-0 ${
                  n.tone === "warning" ? "bg-warning/10 text-warning" :
                  n.tone === "success" ? "bg-success/10 text-success" :
                  n.tone === "gold" ? "bg-primary/10 text-primary" :
                  n.tone === "teal" ? "bg-secondary/10 text-secondary" :
                  "bg-muted text-muted-foreground"
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{n.title}</div>
                    <StatusPill tone={n.tone}>•</StatusPill>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>
                </div>
                <div className="text-[11px] text-muted-foreground font-mono whitespace-nowrap">{n.time}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
