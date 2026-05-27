import { useState, useEffect } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import PropertyCard from "@/components/PropertyCard";
import EmptyState from "@/components/EmptyState";
import { formatPct, formatUSD, formatDateEs } from "@/lib/format";
import { ArrowUpRight, Home as HomeIcon, Plus, Sparkles, TrendingUp, AlertCircle, ArrowRight, Clock, ArrowDownLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { collection, onSnapshot, query as fsQuery, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

import type { Property } from "@/lib/mockData";

interface Transaction {
  id: string;
  userId: string;
  investor: string;
  property: string;
  type: string;
  amount: number;
  fee?: number;
  method?: string;
  status: string;
  date: string;
}

export default function Home() {
  const currentUser = useAppStore((s) => s.user);
  const firstName = currentUser?.name?.split(" ")[0] || currentUser?.displayName?.split(" ")[0] || "Inversor";
  const kycStatus = currentUser?.kycStatus || "pending";

  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Subscribe to featured properties
    const qProps = fsQuery(collection(db, "properties"));
    const unsubscribeProps = onSnapshot(qProps, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as unknown as Property[];
      setProperties(data);
      // Filter out only available properties to highlight
      setFeaturedProperties(data.filter((p) => p.status === "disponible" || p.status === "nuevo").slice(0, 3));
    });

    // 2. Subscribe to user transactions (sorted client-side to prevent index exceptions)
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const qTxs = fsQuery(collection(db, "transactions"), where("userId", "==", currentUser.uid));
    const unsubscribeTxs = onSnapshot(qTxs, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as unknown as Transaction[];
      // Sort client side by date descending
      data.sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentTransactions(data);
      setLoading(false);
    });

    // 3. Subscribe to user investments
    const qInv = fsQuery(collection(db, "investments"), where("userId", "==", currentUser.uid));
    const unsubscribeInv = onSnapshot(qInv, (snapshot) => {
      setInvestments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubscribeProps();
      unsubscribeTxs();
      unsubscribeInv();
    };
  }, [currentUser?.uid]);

  // Aggregate stats from real investments (not KYC income)
  const totalInvested = investments.reduce((sum, inv) => sum + (inv.investedAmount || 0), 0);
  const propertiesCount = new Set(investments.map(inv => inv.propertyId)).size;
  const monthlyIncome = investments.reduce((sum, inv) => {
    const prop = properties.find((p) => p.id === inv.propertyId);
    if (prop && prop.roiAnnual) {
      return sum + ((inv.investedAmount || 0) * (prop.roiAnnual / 100)) / 12;
    }
    return sum + (inv.monthlyIncomeEstimate || 0);
  }, 0);
  const roiAnnual = totalInvested > 0 ? (monthlyIncome * 12 / totalInvested) * 100 : 0;

  // Sum all completed distributions for total earned
  const totalEarned = recentTransactions
    .filter((t) => t.type === "Distribución" && t.status === "Completada")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Next payment days count (pays on the 5th of every month)
  let nextPaymentDays = 0;
  if (propertiesCount > 0) {
    const today = new Date();
    let nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), 5);
    
    if (today.getDate() >= 5) {
      nextPaymentDate = new Date(today.getFullYear(), today.getMonth() + 1, 5);
    }
    
    const diffTime = nextPaymentDate.getTime() - today.getTime();
    nextPaymentDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="pb-4">
      <ScreenHeader
        subtitle={`Hola, ${firstName} 👋`}
        title="Buenas tardes"
      />

      <div className="px-5 space-y-6">
        {/* Banner de KYC */}
        {kycStatus === "pending" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 shadow-sm"
          >
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-500">Verificación requerida</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Para poder invertir, debes completar tu perfil. Aún tienes los siguientes pasos pendientes:
              </p>
              <div className="flex flex-col gap-1.5 mt-2">
                {(!currentUser?.cedula || !currentUser?.nationality || !currentUser?.profession || !currentUser?.economicActivity || !currentUser?.fundsSource) && (
                  <Link
                    to="/app/perfil/informacion"
                    className="inline-flex items-center gap-1 text-xs text-amber-500 font-semibold hover:underline"
                  >
                    • Completar Información Personal <ArrowRight className="h-3 w-3 animate-pulse" />
                  </Link>
                )}
                 {(!currentUser?.cedulaUrl || !currentUser?.selfieUrl || !currentUser?.addressUrl || !currentUser?.incomeUrl) && (
                  <Link
                    to="/app/perfil/kyc"
                    className="inline-flex items-center gap-1 text-xs text-amber-500 font-semibold hover:underline"
                  >
                    • Subir Documentos de Identidad KYC <ArrowRight className="h-3 w-3 animate-pulse" />
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}

         {(kycStatus === "submitted" || kycStatus === "inReview") && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3 shadow-sm"
          >
            <Clock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-500">Verificación en revisión</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Tus datos y documentos están siendo verificados por nuestro equipo de cumplimiento. Te avisaremos pronto.
              </p>
            </div>
          </motion.div>
        )}

        {kycStatus === "submitted" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3 shadow-sm"
          >
            <Clock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-500">Verificación enviada</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Hemos recibido tu solicitud de verificación. Un administrador revisará tus documentos en breve.
              </p>
            </div>
          </motion.div>
        )}

        {/* Portfolio summary */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl glass-strong shadow-elevated grain-overlay"
        >
          <div className="absolute -top-24 -right-24 h-60 w-60 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-60 w-60 rounded-full bg-secondary/15 blur-3xl" />

          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Mi Portafolio</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary bg-secondary/10 border border-secondary/30 px-2 py-0.5 rounded-full">
                <TrendingUp className="h-3 w-3" /> {formatPct(roiAnnual)} anual
              </span>
            </div>

            <p className="font-display text-5xl mt-3 tracking-tight">
              <span className="font-mono text-[14px] align-top text-muted-foreground">USD </span>
              {formatUSD(totalInvested, { decimals: 2 })}
            </p>

            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-success">
                <ArrowUpRight className="h-4 w-4" />
                <span className="font-mono">+{formatUSD(monthlyIncome)} / mes</span>
              </div>
              <Link to="/app/portafolio" className="text-xs text-primary">Ver detalle →</Link>
            </div>
          </div>
        </motion.section>

        {/* Quick stats */}
        <section className="grid grid-cols-3 gap-2.5">
          <Stat label="Propiedades" value={propertiesCount.toString()} />
          <Stat label="Próximo pago" value={propertiesCount > 0 ? `${nextPaymentDays}d` : "—"} />
          <Stat label="Total ganado" value={formatUSD(totalEarned, { decimals: 0 })} />
        </section>

        {/* Featured properties */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-display text-2xl">Destacadas</h2>
              <p className="text-xs text-muted-foreground">Propiedades disponibles esta semana</p>
            </div>
            <Link to="/app/explorar" className="text-xs text-primary">Ver todas</Link>
          </div>
          {featuredProperties.length > 0 ? (
            <div className={`-mx-5 px-5 flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar ${featuredProperties.length === 1 ? '*:w-full' : ''}`}>
              {featuredProperties.map((p) => (
                <PropertyCard key={p.id} property={p} variant="horizontal" />
              ))}
            </div>
          ) : (
            <EmptyState subtitle="Estamos curando las próximas propiedades. Te avisaremos cuando estén listas." />
          )}
        </section>

        {/* Activity */}
        <section>
          <h2 className="font-display text-2xl mb-3">Actividad reciente</h2>
          {recentTransactions.length > 0 ? (
            <div className="glass rounded-2xl divide-y divide-border">
              {recentTransactions.slice(0, 5).map((t) => {
                const isReceived = t.type === "Distribución" || t.type === "Depósito";
                const isWithdraw = t.type === "Retiro";
                const isInvestment = t.type === "Inversión";

                return (
                  <Link 
                    key={t.id} 
                    to="/app/pagos"
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors active:bg-white/10"
                  >
                    <div
                      className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 ${
                        isReceived ? "bg-success/15 text-success" : isWithdraw ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {isReceived ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {isInvestment ? `Inversión: ${t.property}` : t.type === "Distribución" ? `Distribución: ${t.property}` : t.property || "Retiro de fondos"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {t.date ? formatDateEs(t.date) : ""} · <span className={t.status === "Pendiente" ? "text-warning" : ""}>{t.status}</span>
                      </p>
                    </div>
                    <p
                      className={`font-mono text-sm font-semibold shrink-0 ${
                        isReceived ? "text-success" : isWithdraw ? "text-warning" : "text-destructive"
                      }`}
                    >
                      {isReceived ? "+" : "-"}
                      {formatUSD(t.amount)}
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Sin actividad todavía"
              subtitle="Tus pagos e inversiones aparecerán aquí."
            />
          )}
        </section>

        {/* Trust banner */}
        <div className="glass rounded-2xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-gold-soft border border-primary/30 grid place-items-center">
            <HomeIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Regulado y auditado</p>
            <p className="text-[11px] text-muted-foreground">Custodia con bancos dominicanos · SSL · KYC</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-3.5 text-center">
      <p className="font-mono text-base">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{label}</p>
    </div>
  );
}
