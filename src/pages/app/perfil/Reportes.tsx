import ScreenHeader from "@/components/ScreenHeader";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

import { useState, useEffect } from "react";
import { collection, query as fsQuery, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/store/useAppStore";
import EmptyState from "@/components/EmptyState";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Reportes() {
  const currentUser = useAppStore((s) => s.user);
  const [months, setMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;
    
    const q = fsQuery(
      collection(db, "transactions"),
      where("userId", "==", currentUser.uid),
      where("status", "==", "Completada")
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const activeMonths = new Set<string>();
      snap.docs.forEach(d => {
        const date = new Date(d.data().date);
        const monthKey = format(date, "MMMM yyyy", { locale: es });
        activeMonths.add(monthKey);
      });
      
      // Sort months descending? We'd have to parse it or sort the dates before formatting.
      // But let's just sort the dates.
      const dateList = snap.docs.map(d => new Date(d.data().date));
      dateList.sort((a, b) => b.getTime() - a.getTime());
      
      const sortedActive = new Set<string>();
      dateList.forEach(date => {
        sortedActive.add(format(date, "MMMM yyyy", { locale: es }));
      });
      
      setMonths(Array.from(sortedActive));
      setLoading(false);
    });
    
    return () => unsub();
  }, [currentUser?.uid]);

  const year = new Date().getFullYear();

  return (
    <div className="pb-10">
      <ScreenHeader title="Reportes y estados de cuenta" back showBell={false} />
      <div className="px-5 mt-2 space-y-4">
        {loading ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Cargando...</div>
        ) : months.length === 0 ? (
          <EmptyState 
            title="Sin reportes disponibles"
            subtitle="Aún no tienes estados de cuenta generados. El primer reporte aparecerá al finalizar tu primer mes de inversión."
          />
        ) : (
          <>
            <div className="glass rounded-2xl p-5">
              <p className="font-display text-lg capitalize">Resumen anual {year}</p>
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
                    <div className="flex-1 capitalize">
                      <p className="text-sm font-medium">{m}</p>
                      <p className="text-[11px] text-muted-foreground">PDF · ~120 KB</p>
                    </div>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
