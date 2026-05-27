import { useState, useEffect } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import EmptyState from "@/components/EmptyState";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatDateEs, formatUSD } from "@/lib/format";
import { AlertTriangle, CheckCircle2, MessageSquareWarning } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Dispute {
  id: string;
  transactionId: string;
  userId: string;
  userName: string;
  amount: number;
  type: string;
  date: string;
  reason: string;
  status: string;
  createdAt: string;
}

export default function Reportes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "disputes"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Dispute[];
      setDisputes(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const markResolved = async (id: string) => {
    try {
      await updateDoc(doc(db, "disputes", id), {
        status: "Resuelto",
        resolvedAt: new Date().toISOString()
      });
      toast.success("Reporte marcado como resuelto");
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar reporte");
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const pendientes = disputes.filter(d => d.status === "Pendiente");
  const resueltos = disputes.filter(d => d.status === "Resuelto");

  return (
    <div className="pb-8">
      <ScreenHeader title="Reportes y Reclamos" subtitle="Gestión de inconvenientes de transacciones" />

      <div className="p-5 space-y-6 max-w-4xl">
        
        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-4 border border-warning/20">
            <div className="flex items-center gap-2 text-warning mb-2">
              <MessageSquareWarning className="h-5 w-5" />
              <h3 className="font-semibold text-sm uppercase tracking-wider">Pendientes</h3>
            </div>
            <p className="text-3xl font-display">{pendientes.length}</p>
          </div>
          <div className="glass rounded-2xl p-4 border border-success/20">
            <div className="flex items-center gap-2 text-success mb-2">
              <CheckCircle2 className="h-5 w-5" />
              <h3 className="font-semibold text-sm uppercase tracking-wider">Resueltos</h3>
            </div>
            <p className="text-3xl font-display">{resueltos.length}</p>
          </div>
        </div>

        {/* Lista de Reportes */}
        <div className="space-y-4">
          <h3 className="font-display text-xl">Todos los reportes</h3>
          
          {disputes.length > 0 ? (
            <div className="grid gap-4">
              {disputes.map((dispute) => (
                <motion.div 
                  key={dispute.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`glass rounded-2xl p-5 border ${dispute.status === "Pendiente" ? "border-warning/30" : "border-border"}`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          dispute.status === "Pendiente" ? "bg-warning/20 text-warning" : "bg-success/20 text-success"
                        }`}>
                          {dispute.status}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatDateEs(dispute.createdAt)}</span>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">Inversor: <span className="text-foreground font-medium">{dispute.userName}</span></p>
                        <p className="text-sm text-muted-foreground">Transacción: <span className="font-mono">{dispute.transactionId.slice(0, 8)}...</span> ({dispute.type})</p>
                        <p className="text-sm text-muted-foreground">Monto: <span className="text-foreground font-mono font-medium">{formatUSD(dispute.amount)}</span></p>
                      </div>

                      <div className="bg-black/20 rounded-xl p-3 border border-border/50">
                        <p className="text-xs text-warning font-semibold flex items-center gap-1.5 mb-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Motivo del reclamo
                        </p>
                        <p className="text-sm italic text-foreground/90">"{dispute.reason}"</p>
                      </div>
                    </div>

                    {dispute.status === "Pendiente" && (
                      <button
                        onClick={() => markResolved(dispute.id)}
                        className="h-10 px-4 rounded-xl bg-success/20 text-success hover:bg-success/30 transition text-sm font-semibold whitespace-nowrap"
                      >
                        Marcar como Resuelto
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState 
              title="No hay reportes" 
              subtitle="Los inversores no han reportado problemas con sus transacciones." 
            />
          )}
        </div>
      </div>
    </div>
  );
}
