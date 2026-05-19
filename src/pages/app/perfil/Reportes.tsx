import ScreenHeader from "@/components/ScreenHeader";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

const months = [
  "Marzo 2026", "Febrero 2026", "Enero 2026", "Diciembre 2025", "Noviembre 2025",
];

export default function Reportes() {
  return (
    <div className="pb-10">
      <ScreenHeader title="Reportes y estados de cuenta" back showBell={false} />
      <div className="px-5 mt-2 space-y-4">
        <div className="glass rounded-2xl p-5">
          <p className="font-display text-lg">Resumen anual 2025</p>
          <p className="text-xs text-muted-foreground mb-3">Documento PDF con todos tus movimientos del año.</p>
          <button
            onClick={() => toast.success("Generando PDF…")}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-gold text-primary-foreground text-sm font-semibold shadow-gold"
          >
            <Download className="h-4 w-4" /> Descargar resumen
          </button>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2 px-1">Estados de cuenta mensuales</p>
          <div className="glass rounded-2xl divide-y divide-border">
            {months.map((m) => (
              <button
                key={m}
                onClick={() => toast.success(`Descargando ${m}`)}
                className="w-full p-4 flex items-center gap-3 text-left active:bg-surface/40 transition-colors"
              >
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm">{m}</p>
                  <p className="text-[11px] text-muted-foreground">PDF · ~120 KB</p>
                </div>
                <Download className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
