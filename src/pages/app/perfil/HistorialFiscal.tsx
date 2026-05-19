import ScreenHeader from "@/components/ScreenHeader";
import { Download } from "lucide-react";
import { toast } from "sonner";

const years = [
  { year: 2025, income: 0, withheld: 0 },
  { year: 2024, income: 0, withheld: 0 },
];

export default function HistorialFiscal() {
  return (
    <div className="pb-10">
      <ScreenHeader title="Historial fiscal" back showBell={false} />
      <div className="px-5 mt-2 space-y-4">
        <div className="glass rounded-2xl p-5">
          <p className="font-display text-lg">Constancias para DGII</p>
          <p className="text-xs text-muted-foreground">Descarga tus constancias de retención e ingresos por año.</p>
        </div>

        <div className="glass rounded-2xl divide-y divide-border">
          {years.map((y) => (
            <div key={y.year} className="p-4">
              <div className="flex items-center justify-between">
                <p className="font-display text-xl">{y.year}</p>
                <button
                  onClick={() => toast.success(`Descargando constancia ${y.year}`)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
                >
                  <Download className="h-3.5 w-3.5" /> Constancia
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <Stat label="Ingresos brutos" value={`US$ ${y.income.toLocaleString()}`} />
                <Stat label="Retenido" value={`US$ ${y.withheld.toLocaleString()}`} />
              </div>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground text-center">
          Esta información es referencial. Consulta a tu contador para tu declaración anual.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface/60 border border-border p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-mono text-sm mt-0.5">{value}</p>
    </div>
  );
}
