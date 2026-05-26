import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Edit, Pause, Archive, CheckCircle, Clock, PieChart, 
  DollarSign, Users, AlertTriangle, Building
} from "lucide-react";
import { toast } from "sonner";
import { doc, onSnapshot, collection, query, where, orderBy, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatUSD } from "@/lib/format";
import PageHeader from "@/components/admin/PageHeader";
import StatusPill from "@/components/admin/StatusPill";
import StatCard from "@/components/admin/StatCard";

export default function AdminDetallePropiedad() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // Fetch Property
    const unsubProp = onSnapshot(doc(db, "properties", id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProperty({ id: docSnap.id, ...data });
        
        // Fetch Transactions for this property
        // The mock data currently stores the property name as a string in tx.property
        const q = query(
          collection(db, "transactions"), 
          where("property", "==", data.name || ""),
          orderBy("date", "desc")
        );
        
        const unsubTx = onSnapshot(q, (txSnap) => {
          const txs = txSnap.docs.map(t => ({ id: t.id, ...t.data() }));
          setTransactions(txs);
          setLoading(false);
        });

        return () => unsubTx();
      } else {
        toast.error("Propiedad no encontrada");
        navigate("/admin/propiedades");
      }
    });

    return () => unsubProp();
  }, [id, navigate]);

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      if (!id) return;
      await updateDoc(doc(db, "properties", id), { status: newStatus });
      toast.success(`Estado actualizado a: ${newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar el estado");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando detalles de la propiedad...</div>;
  }

  if (!property) return null;

  const raised = (property.fractionsSold || 0) * (property.pricePerFraction || 0);
  const total = property.totalPrice || 0;
  const progress = total > 0 ? (raised / total) * 100 : 0;
  
  // Calculate unique investors based on transactions
  const investors = new Set(transactions.filter(t => t.type === "Inversión").map(t => t.investor)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate("/admin/propiedades")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a Propiedades
        </button>
        <div className="flex items-center gap-2">
          <StatusPill tone={
            property.status === "disponible" ? "success" : 
            property.status === "fondeada" ? "info" : 
            property.status === "rentando" ? "gold" : 
            "muted"
          }>
            {property.status}
          </StatusPill>
        </div>
      </div>

      <PageHeader 
        title={property.name}
        subtitle={`${property.location} · ${property.developer?.name || "Desarrollador"}`}
        actions={
          <>
            <button 
              onClick={() => toast.info("Edición en desarrollo", { description: "Próximamente podrás editar todos los campos aquí." })}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border text-sm hover:border-border-strong transition-colors"
            >
              <Edit className="h-4 w-4" /> Editar
            </button>
            {property.status !== "rentando" && (
              <button 
                onClick={() => handleUpdateStatus("rentando")}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border text-sm hover:border-border-strong hover:bg-success/10 hover:text-success transition-colors"
              >
                <CheckCircle className="h-4 w-4" /> Marcar Rentando
              </button>
            )}
            {property.status !== "pausada" && (
              <button 
                onClick={() => handleUpdateStatus("pausada")}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border text-sm hover:border-border-strong transition-colors"
              >
                <Pause className="h-4 w-4" /> Pausar
              </button>
            )}
            {property.status !== "archivada" && (
              <button 
                onClick={() => {
                  if(confirm("¿Estás seguro de archivar esta propiedad?")) {
                    handleUpdateStatus("archivada");
                  }
                }}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Archive className="h-4 w-4" /> Archivar
              </button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Fondeado" value={formatUSD(raised, { decimals: 0 })} icon={DollarSign} accent="gold" />
        <StatCard label="Progreso" value={`${progress.toFixed(1)}%`} icon={PieChart} accent="teal" />
        <StatCard label="Inversores" value={investors.toString()} icon={Users} accent="indigo" />
        <StatCard label="Fracciones Disp." value={(property.totalFractions - property.fractionsSold).toString()} icon={Building} accent="info" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-lg border border-border bg-[hsl(var(--surface))] p-5">
            <h3 className="font-display text-lg mb-4">Métricas Financieras</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Precio Total</p>
                <p className="font-mono text-lg">{formatUSD(property.totalPrice, { decimals: 0 })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Precio por Fracción</p>
                <p className="font-mono text-lg">{formatUSD(property.pricePerFraction, { decimals: 0 })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">ROI Anual</p>
                <p className="font-mono text-lg">{property.roiAnnual}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Renta Mensual Estimada</p>
                <p className="font-mono text-lg">{formatUSD(property.monthlyIncomeEstimate, { decimals: 0 })}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-[hsl(var(--surface))] p-5">
            <h3 className="font-display text-lg mb-4">Transacciones Recientes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/20">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Fecha</th>
                    <th className="text-left px-4 py-3 font-medium">Inversor</th>
                    <th className="text-left px-4 py-3 font-medium">Tipo</th>
                    <th className="text-right px-4 py-3 font-medium">Monto</th>
                    <th className="text-right px-4 py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No hay transacciones registradas para esta propiedad.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{tx.date ? new Date(tx.date).toLocaleDateString() : "—"}</td>
                        <td className="px-4 py-3">{tx.investor || "—"}</td>
                        <td className="px-4 py-3">
                          <StatusPill tone={tx.type === "Inversión" ? "gold" : tx.type === "Distribución" ? "teal" : "muted"}>
                            {tx.type}
                          </StatusPill>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">{formatUSD(tx.amount || 0, { decimals: 0 })}</td>
                        <td className="px-4 py-3 text-right">
                          <StatusPill tone={tx.status === "Completada" ? "success" : tx.status === "Pendiente" ? "warning" : "danger"}>
                            {tx.status}
                          </StatusPill>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-[hsl(var(--surface))] overflow-hidden">
            <div className="aspect-video bg-muted relative">
              {property.image ? (
                <img src={property.image} alt={property.name} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
                </div>
              )}
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Días Restantes</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-medium">{property.daysLeft || 0} días</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Fracciones Vendidas</p>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-1 mb-2">
                  <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{property.fractionsSold || 0} / {property.totalFractions}</span>
                  <span className="text-muted-foreground">{progress.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
