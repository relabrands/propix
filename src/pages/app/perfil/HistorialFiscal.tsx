import ScreenHeader from "@/components/ScreenHeader";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { useState, useEffect } from "react";
import { collection, query as fsQuery, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/store/useAppStore";
import EmptyState from "@/components/EmptyState";

interface YearData {
  year: number;
  income: number;
  withheld: number;
}

export default function HistorialFiscal() {
  const currentUser = useAppStore((s) => s.user);
  const [years, setYears] = useState<YearData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;
    
    const q = fsQuery(
      collection(db, "transactions"),
      where("userId", "==", currentUser.uid),
      where("status", "==", "Completada"),
      where("type", "==", "Distribución")
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const yearMap = new Map<number, YearData>();
      
      snap.docs.forEach(d => {
        const data = d.data();
        const date = new Date(data.date);
        const year = date.getFullYear();
        
        if (!yearMap.has(year)) {
          yearMap.set(year, { year, income: 0, withheld: 0 });
        }
        
        const yData = yearMap.get(year)!;
        yData.income += data.amount || 0;
        // Mock withholding to 10% just to have data, since we don't have taxes modeled yet
        yData.withheld += (data.amount || 0) * 0.10; 
      });
      
      const yearList = Array.from(yearMap.values()).sort((a, b) => b.year - a.year);
      setYears(yearList);
      setLoading(false);
    });
    
    return () => unsub();
  }, [currentUser?.uid]);

  return (
    <div className="pb-10">
      <ScreenHeader title="Historial fiscal" back showBell={false} />
      <div className="px-5 mt-2 space-y-4">
        {loading ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Cargando...</div>
        ) : years.length === 0 ? (
          <EmptyState 
            title="Sin historial fiscal"
            subtitle="Aún no tienes ingresos registrados o retenidos. Tu primera constancia aparecerá aquí al generar ingresos."
          />
        ) : (
          <>
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
                    <Stat label="Ingresos brutos" value={`US$ ${y.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                    <Stat label="Retenido (Est.)" value={`US$ ${y.withheld.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              Esta información es referencial. Consulta a tu contador para tu declaración anual.
            </p>
          </>
        )}
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
