import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, CreditCard, Landmark, Minus, Plus, Wallet, X } from "lucide-react";
import { formatUSD } from "@/lib/format";
import { Link } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { doc, collection, addDoc, updateDoc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

import type { Property } from "@/lib/mockData";

interface Props {
  open: boolean;
  onClose: () => void;
  property: Property;
  initialAmount: number;
}

type Step = "amount" | "method" | "confirm" | "success";

export default function InvestSheet({ open, onClose, property, initialAmount }: Props) {
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState(initialAmount);
  const [method, setMethod] = useState<"bank" | "card" | "wallet">("bank");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUser = useAppStore((s) => s.user);
  const { balance } = useWalletBalance(currentUser?.uid);

  useEffect(() => {
    if (open) {
      setStep("amount");
      setAmount(initialAmount);
    }
  }, [open, initialAmount]);

  const pricePerFraction = property.pricePerFraction || 0;
  const subtotal = amount * pricePerFraction;
  const fee = Math.round(subtotal * 0.02);
  const total = subtotal + fee;

  const handleConfirmInvestment = async () => {
    if (!currentUser) {
      toast.error("Debes iniciar sesión para invertir.");
      return;
    }
    if (balance < total) {
      toast.error("Balance insuficiente.", { description: "Por favor recarga tu balance en Pagos." });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const propertyRef = doc(db, "properties", property.id);
      const userRef = doc(db, "users", currentUser.uid);

      await runTransaction(db, async (transaction) => {
        const propDoc = await transaction.get(propertyRef);
        if (!propDoc.exists()) {
          throw new Error("La propiedad no existe.");
        }

        const data = propDoc.data();
        const currentFractionsSold = data.fractionsSold || 0;
        const currentTotalFractions = data.totalFractions || 1;

        if (currentFractionsSold + amount > currentTotalFractions) {
          throw new Error("No quedan suficientes fracciones disponibles en esta propiedad.");
        }

        // 1. Update property sold fractions count and total unique investor count
        const prevInvestorsCount = data.investorsCount || 0;
        transaction.update(propertyRef, {
          fractionsSold: currentFractionsSold + amount,
          investorsCount: prevInvestorsCount + 1,
        });
      });

      // 2. Create investment document
      const monthlyIncomeForFractions = ((property.monthlyIncomeEstimate || 0) / (property.totalFractions || 1)) * amount;
      await addDoc(collection(db, "investments"), {
        userId: currentUser.uid,
        propertyId: property.id,
        propertyName: property.name,
        propertyImage: property.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        location: property.location || "República Dominicana",
        fractionsCount: amount,
        investedAmount: subtotal,
        monthlyIncomeEstimate: monthlyIncomeForFractions,
        roiAnnual: property.roiAnnual || 0,
        date: new Date().toISOString(),
      });

      // 3. Write transaction log
      await addDoc(collection(db, "transactions"), {
        userId: currentUser.uid,
        investor: currentUser.name || currentUser.displayName || "Inversionista",
        property: property.name,
        type: "Inversión",
        amount: total,
        fee: fee,
        method: method === "bank" ? "Transferencia" : method === "card" ? "Tarjeta" : "Wallet",
        status: "Completada",
        date: new Date().toISOString(),
      });

      // 4. Update user's aggregate portfolios stats (Legacy, removing because they conflict with KYC data and are calculated dynamically on the fly)

      setStep("success");
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Error al procesar la inversión";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="fixed bottom-0 inset-x-0 z-50 max-w-md mx-auto"
          >
            <div className="rounded-t-3xl glass-strong shadow-elevated safe-bottom max-h-[92vh] overflow-y-auto">
              <div className="sticky top-0 z-10 backdrop-blur-xl bg-surface/60 px-5 pt-3 pb-4 rounded-t-3xl">
                <div className="mx-auto h-1 w-10 rounded-full bg-muted mb-4" />
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl">
                    {step === "amount" && "Invertir"}
                    {step === "method" && "Método de pago"}
                    {step === "confirm" && "Confirmar inversión"}
                    {step === "success" && "¡Listo!"}
                  </h2>
                  <button onClick={onClose} className="h-9 w-9 rounded-full bg-surface grid place-items-center">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="px-5 pb-6">
                {step === "amount" && (
                  <div className="space-y-5">
                    <div className="glass rounded-2xl p-3 flex items-center gap-3">
                      <img src={property.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{property.name}</p>
                        <p className="text-xs text-muted-foreground">{property.location}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Selecciona fracciones</p>
                      <div className="flex items-center justify-between glass rounded-2xl p-2">
                        <button
                          onClick={() => setAmount(Math.max(1, amount - 1))}
                          className="h-12 w-12 rounded-xl bg-surface grid place-items-center"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <div className="text-center">
                          <p className="font-mono text-3xl">{amount}</p>
                          <p className="text-[10px] text-muted-foreground">× ${pricePerFraction.toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => setAmount(Math.min((property.totalFractions || 1) - (property.fractionsSold || 0), amount + 1))}
                          className="h-12 w-12 rounded-xl bg-gradient-gold text-primary-foreground grid place-items-center shadow-gold"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <Row label={`${amount} fracciones`} value={formatUSD(subtotal, { decimals: 0 })} />
                      <Row label="Comisión plataforma (2%)" value={formatUSD(fee, { decimals: 0 })} muted />
                      <div className="border-t border-border pt-3 flex justify-between font-semibold">
                        <span>Total a pagar</span>
                        <span className="font-mono">{formatUSD(total, { decimals: 0 })}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setStep("method")}
                      className="h-14 w-full rounded-2xl bg-gradient-gold text-primary-foreground font-semibold shadow-gold flex items-center justify-center gap-2"
                    >
                      Continuar <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {step === "method" && (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 mb-4">
                      <p className="text-sm font-medium text-primary">Método de Pago</p>
                      <p className="text-xs text-muted-foreground mt-1">Para invertir, debes utilizar el Balance Disponible en tu Billetera. Puedes recargarlo desde la sección de Pagos.</p>
                    </div>

                    <MethodTile
                      icon={<Wallet className="h-5 w-5" />}
                      title="Saldo en Billetera Propix"
                      desc={`Disponible: ${formatUSD(balance)}`}
                      selected={method === "wallet"}
                      onClick={() => setMethod("wallet")}
                    />

                    {balance < total && (
                      <div className="p-3 bg-destructive/10 text-destructive rounded-xl text-xs mt-2 font-medium">
                        Tu balance actual ({formatUSD(balance)}) es menor al total requerido ({formatUSD(total)}). Por favor recarga en la sección de Pagos.
                      </div>
                    )}

                    <button
                      onClick={() => {
                        if (balance < total) {
                          toast.error("Balance insuficiente para continuar.");
                          return;
                        }
                        setStep("confirm");
                      }}
                      className="mt-3 h-14 w-full rounded-2xl bg-gradient-gold text-primary-foreground font-semibold shadow-gold disabled:opacity-50"
                    >
                      Continuar
                    </button>
                  </div>
                )}

                {step === "confirm" && (
                  <div className="space-y-5">
                    <div className="glass rounded-2xl p-4 space-y-3">
                      <div className="flex gap-3">
                        <img src={property.image} alt="" className="h-16 w-16 rounded-xl object-cover" />
                        <div>
                          <p className="font-display text-xl leading-tight">{property.name}</p>
                          <p className="text-xs text-muted-foreground">{property.location}</p>
                        </div>
                      </div>
                      <div className="border-t border-border pt-3 space-y-2 text-sm">
                        <Row label="Fracciones" value={amount.toString()} />
                        <Row label="Inversión" value={formatUSD(subtotal, { decimals: 0 })} />
                        <Row label="Renta mensual est." value={`+${formatUSD(((property.monthlyIncomeEstimate || 0) / (property.totalFractions || 1)) * amount)}`} highlight />
                        <Row label="Método" value="Billetera Propix" />
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Al confirmar aceptas el contrato de fideicomiso. Las inversiones inmobiliarias conllevan riesgos
                      y los retornos no están garantizados. Propix cumple con la regulación SIB de la República Dominicana.
                    </p>

                    <button
                      disabled={isSubmitting}
                      onClick={handleConfirmInvestment}
                      className="h-14 w-full rounded-2xl bg-gradient-gold text-primary-foreground font-semibold shadow-gold flex items-center justify-center"
                    >
                      {isSubmitting ? "Procesando..." : `Confirmar inversión · ${formatUSD(total, { decimals: 0 })}`}
                    </button>
                    <button onClick={onClose} disabled={isSubmitting} className="h-12 w-full text-sm text-muted-foreground">
                      Cancelar
                    </button>
                  </div>
                )}

                {step === "success" && (
                  <div className="text-center py-6">
                    <div className="relative h-24 w-24 mx-auto">
                      <span className="absolute inset-0 rounded-full bg-success/20 animate-ping" />
                      <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-success to-secondary grid place-items-center shadow-glow">
                        <Check className="h-12 w-12 text-background" strokeWidth={3} />
                      </div>
                    </div>
                    <h3 className="font-display text-3xl mt-6">¡Inversión exitosa!</h3>
                    <p className="text-sm text-muted-foreground mt-2 text-balance">
                      Eres propietario de <span className="text-foreground font-semibold">{amount} fracciones</span> en{" "}
                      <span className="text-foreground font-semibold">{property.name}</span>.
                    </p>
                    <div className="glass rounded-2xl p-4 mt-6 text-sm">
                      <p className="text-muted-foreground text-xs">Primer pago estimado</p>
                      <p className="font-mono mt-1">15 de Junio, 2026</p>
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <button onClick={onClose} className="h-12 rounded-2xl glass text-sm">
                        Compartir
                      </button>
                      <Link
                        to="/app/portafolio"
                        onClick={onClose}
                        className="h-12 rounded-2xl bg-gradient-gold text-primary-foreground font-semibold grid place-items-center text-sm shadow-gold"
                      >
                        Ver mi portafolio
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Row({
  label,
  value,
  muted,
  highlight,
}: {
  label: string;
  value: string;
  muted?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className={muted ? "text-muted-foreground text-xs" : "text-muted-foreground"}>{label}</span>
      <span className={`font-mono ${highlight ? "text-success" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

function MethodTile({
  icon,
  title,
  desc,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full glass rounded-2xl p-4 flex items-center gap-3 text-left transition-all ${
        selected ? "border-primary/50 shadow-glow" : ""
      }`}
    >
      <div
        className={`h-11 w-11 rounded-xl grid place-items-center ${
          selected ? "bg-gradient-gold text-primary-foreground" : "bg-surface text-primary"
        }`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <span
        className={`h-5 w-5 rounded-full border-2 grid place-items-center ${
          selected ? "border-primary bg-primary" : "border-muted"
        }`}
      >
        {selected && <Check className="h-3 w-3 text-primary-foreground" />}
      </span>
    </button>
  );
}
