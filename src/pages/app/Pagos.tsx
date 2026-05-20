import { useState, useEffect } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import EmptyState from "@/components/EmptyState";
import { formatDateEs, formatUSD } from "@/lib/format";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { collection, addDoc, doc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion } from "framer-motion";
import { useWalletBalance } from "@/hooks/useWalletBalance";

const filters = ["Todos", "Recibidos", "Retirados"] as const;

interface BankAccount {
  id: string;
  bank: string;
  last4: string;
  verified: boolean;
  type: string;
}

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

export default function Pagos() {
  const currentUser = useAppStore((s) => s.user);
  const [filter, setFilter] = useState<typeof filters[number]>("Todos");

  // Modals state
  const [showAddBank, setShowAddBank] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);

  // Form states
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState("Ahorros");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedBankId, setSelectedBankId] = useState("");
  
  // Deposit form state
  const [depositAmount, setDepositAmount] = useState("");
  const [depositFile, setDepositFile] = useState<File | null>(null);
  const [uploadingDeposit, setUploadingDeposit] = useState(false);

  // Use new wallet balance hook
  const { balance: availableBalance, transactions, loading } = useWalletBalance(currentUser?.uid);

  // Load bank accounts from user doc
  const userBankAccounts: BankAccount[] = currentUser?.bankAccounts || [];

  // Filters mapping
  const filtered = transactions.filter((t) => {
    if (filter === "Todos") return true;
    if (filter === "Recibidos") return t.type === "Distribución" || t.type === "Depósito";
    return t.type === "Retiro" || t.type === "Inversión";
  });

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid) {
      toast.error("Sesión inválida");
      return;
    }

    if (!bankName || !accountNumber) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (accountNumber.length < 4) {
      toast.error("El número de cuenta es muy corto");
      return;
    }

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const newBank: BankAccount = {
        id: `bank_${Date.now()}`,
        bank: bankName,
        last4: accountNumber.slice(-4),
        verified: true, // auto-verified for demo/ease of use
        type: accountType,
      };

      await setDoc(userRef, {
        bankAccounts: arrayUnion(newBank),
      }, { merge: true });

      toast.success("Cuenta bancaria agregada exitosamente");
      setShowAddBank(false);
      setBankName("");
      setAccountNumber("");
    } catch (error) {
      console.error(error);
      toast.error("Error al agregar la cuenta bancaria");
    }
  };

  const handleDeleteBank = async (bankToDelete: BankAccount) => {
    if (!currentUser?.uid) return;
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, {
        bankAccounts: arrayRemove(bankToDelete),
      }, { merge: true });
      toast.success("Cuenta eliminada");
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar la cuenta");
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Por favor ingresa un monto válido");
      return;
    }

    if (amountNum > availableBalance) {
      toast.error("Fondos insuficientes");
      return;
    }

    const selectedBank = userBankAccounts.find((b) => b.id === selectedBankId);
    if (!selectedBank) {
      toast.error("Por favor selecciona una cuenta de destino");
      return;
    }

    try {
      // Add withdrawal transaction
      await addDoc(collection(db, "transactions"), {
        userId: currentUser.uid,
        investor: currentUser.name || currentUser.email,
        property: `Retiro a ${selectedBank.bank} (•••• ${selectedBank.last4})`,
        type: "Retiro",
        amount: amountNum,
        fee: 0,
        method: "Transferencia",
        status: "Pendiente",
        date: new Date().toISOString(),
      });

      toast.success("Solicitud de retiro enviada");
      setShowWithdraw(false);
      setWithdrawAmount("");
    } catch (error) {
      console.error(error);
      toast.error("Error al enviar la solicitud");
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid) return;

    const amountNum = parseFloat(depositAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Por favor ingresa un monto válido");
      return;
    }

    if (!depositFile) {
      toast.error("Por favor sube el comprobante de transferencia");
      return;
    }

    try {
      setUploadingDeposit(true);

      // Clean filename
      const safeFilename = depositFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storageRef = ref(storage, `deposits/${currentUser.uid}/${Date.now()}_${safeFilename}`);
      await uploadBytes(storageRef, depositFile);
      const url = await getDownloadURL(storageRef);

      // Add deposit transaction
      await addDoc(collection(db, "transactions"), {
        userId: currentUser.uid,
        investor: currentUser.name || currentUser.email,
        property: "Recarga de Billetera",
        type: "Depósito",
        amount: amountNum,
        fee: 0,
        method: "Transferencia Bancaria",
        status: "Pendiente",
        date: new Date().toISOString(),
        receiptUrl: url
      });

      toast.success("Depósito reportado. En revisión por administración.");
      setShowDeposit(false);
      setDepositAmount("");
      setDepositFile(null);
    } catch (error) {
      console.error(error);
      toast.error("Error al procesar el depósito");
    } finally {
      setUploadingDeposit(false);
    }
  };

  return (
    <div className="pb-4">
      <ScreenHeader title="Pagos" subtitle="Cuentas y transacciones" />

      <div className="px-5 space-y-5">
        {/* Available balance / Pending banner */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-gold-soft border border-primary/30 grid place-items-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Balance Disponible</p>
            <p className="text-xl font-bold font-mono mt-0.5">{formatUSD(availableBalance)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Fondos listos para invertir o retirar.</p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => setShowDeposit(true)}
              className="h-9 px-4 rounded-xl bg-gradient-gold text-primary-foreground text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition shadow-gold"
            >
              Depositar
            </button>
            {availableBalance > 0 && (
              <button
                onClick={() => {
                  if (userBankAccounts.length === 0) {
                    toast.error("Por favor agrega una cuenta bancaria primero");
                    return;
                  }
                  setSelectedBankId(userBankAccounts[0].id);
                  setShowWithdraw(true);
                }}
                className="h-9 px-4 rounded-xl bg-white/5 border border-border text-xs font-semibold hover:bg-white/10 active:scale-[0.98] transition"
              >
                Retirar
              </button>
            )}
          </div>
        </div>

        {/* Bank accounts */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-2xl">Cuentas bancarias</h2>
            <button
              onClick={() => setShowAddBank(true)}
              className="h-8 w-8 rounded-full glass grid place-items-center active:scale-[0.95] transition"
              aria-label="Agregar"
            >
              <Plus className="h-4 w-4 text-primary" />
            </button>
          </div>
          <div className="space-y-2">
            {userBankAccounts.length > 0 ? (
              userBankAccounts.map((b) => (
                <div key={b.id} className="glass rounded-2xl p-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-gold-soft border border-primary/30 grid place-items-center">
                    <span className="font-display text-lg text-primary">{b.bank[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{b.bank}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{b.type} · •••• {b.last4}</p>
                  </div>
                  {b.verified ? (
                    <span className="text-[10px] text-success bg-success/15 px-2 py-1 rounded-full font-medium">✓ Verificada</span>
                  ) : (
                    <span className="text-[10px] text-warning bg-warning/15 px-2 py-1 rounded-full font-medium">Pendiente</span>
                  )}
                  <button
                    onClick={() => handleDeleteBank(b)}
                    className="ml-2 h-8 w-8 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors"
                    title="Eliminar cuenta"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6 glass rounded-2xl">
                No tienes cuentas bancarias registradas.
              </p>
            )}
          </div>
        </section>

        {/* Filters */}
        <div className="-mx-5 px-5 flex gap-2 overflow-x-auto no-scrollbar">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 h-9 px-4 rounded-full text-xs font-medium transition-all ${
                filter === f ? "bg-gradient-gold text-primary-foreground shadow-gold" : "glass text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Transactions */}
        <section>
          <h2 className="font-display text-2xl mb-3">Transacciones</h2>
          {filtered.length > 0 ? (
            <div className="glass rounded-2xl divide-y divide-border">
              {filtered.map((t) => {
                const isReceived = t.type === "Distribución";
                const isWithdraw = t.type === "Retiro";
                const isInvestment = t.type === "Inversión";

                return (
                  <div key={t.id} className="flex items-center gap-3 p-4">
                    <div
                      className={`h-10 w-10 rounded-xl grid place-items-center ${
                        isReceived ? "bg-success/15 text-success" : isWithdraw ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {isReceived ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {isInvestment ? `Inversión: ${t.property}` : isReceived ? `${t.type}: ${t.property}` : t.property || "Retiro de fondos"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {t.date ? formatDateEs(t.date) : ""} · <span className={t.status === "Pendiente" ? "text-warning" : ""}>{t.status}</span>
                      </p>
                    </div>
                    <p
                      className={`font-mono text-sm font-semibold ${
                        isReceived ? "text-success" : isWithdraw ? "text-warning" : "text-destructive"
                      }`}
                    >
                      {isReceived ? "+" : "-"}
                      {formatUSD(t.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Aún no hay transacciones"
              subtitle="Tus pagos y retiros aparecerán aquí."
            />
          )}
        </section>
      </div>

      {/* Add Bank Account Modal */}
      {showAddBank && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="w-full max-w-md glass-strong rounded-t-3xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl">Agregar Cuenta Bancaria</h3>
              <button onClick={() => setShowAddBank(false)} className="h-8 w-8 rounded-full glass grid place-items-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddBank} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase font-semibold">Banco</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-border focus:border-primary text-sm focus:outline-none"
                >
                  <option value="" className="bg-[#12141c]">Selecciona un banco</option>
                  <option value="Banco Popular" className="bg-[#12141c]">Banco Popular</option>
                  <option value="Banreservas" className="bg-[#12141c]">Banreservas</option>
                  <option value="BHD" className="bg-[#12141c]">Banco BHD</option>
                  <option value="Scotiabank" className="bg-[#12141c]">Scotiabank</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase font-semibold">Tipo de Cuenta</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Ahorros", "Corriente"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAccountType(type)}
                      className={`h-11 rounded-xl text-xs font-semibold border transition ${
                        accountType === type ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-border"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase font-semibold">Número de Cuenta</label>
                <input
                  type="text"
                  placeholder="Ej. 1234567890"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-border focus:border-primary text-sm focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-gold text-primary-foreground font-semibold text-sm active:scale-[0.98] transition mt-2"
              >
                Guardar Cuenta
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="w-full max-w-md glass-strong rounded-t-3xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl">Solicitar Retiro</h3>
              <button onClick={() => setShowWithdraw(false)} className="h-8 w-8 rounded-full glass grid place-items-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="bg-white/5 rounded-2xl p-4 text-center">
                <p className="text-xs text-muted-foreground">Balance Disponible</p>
                <p className="text-2xl font-bold font-mono text-success mt-1">{formatUSD(availableBalance)}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase font-semibold">Destino</label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-border focus:border-primary text-sm focus:outline-none"
                >
                  {userBankAccounts.map((b) => (
                    <option key={b.id} value={b.id} className="bg-[#12141c]">
                      {b.bank} (•••• {b.last4})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase font-semibold">Monto a Retirar (USD)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    placeholder="Ej. 100"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full h-12 pl-4 pr-16 rounded-xl bg-white/5 border border-border focus:border-primary text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(availableBalance.toFixed(2))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary"
                  >
                    MÁX
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-gold text-primary-foreground font-semibold text-sm active:scale-[0.98] transition mt-2"
              >
                Confirmar Retiro
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDeposit && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="w-full max-w-md glass-strong rounded-t-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl">Recargar Balance</h3>
              <button onClick={() => setShowDeposit(false)} className="h-8 w-8 rounded-full glass grid place-items-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
              <p className="text-sm font-medium text-primary">Instrucciones de Transferencia</p>
              <p className="text-xs text-muted-foreground">Para recargar tu balance, transfiere a la siguiente cuenta y sube tu comprobante. Nuestro equipo lo verificará en breve.</p>
              
              <div className="mt-3 p-3 bg-black/20 rounded-xl space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Banco:</span>
                  <span className="font-semibold">Banco Popular</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Titular:</span>
                  <span className="font-semibold">Propix SRL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo de cuenta:</span>
                  <span className="font-semibold">Corriente</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Moneda:</span>
                  <span className="font-semibold">Dólares (USD)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cuenta:</span>
                  <span className="font-semibold text-primary">123-456789-0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cédula / RNC:</span>
                  <span className="font-semibold">1-32-45678-9</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase font-semibold">Monto Transferido (USD Equivalent)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="Ej. 1000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                  className="w-full h-12 px-4 rounded-xl bg-white/5 border border-border focus:border-primary text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase font-semibold">Comprobante (Foto o PDF)</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setDepositFile(e.target.files?.[0] || null)}
                    required
                    className="w-full h-12 px-4 py-3 rounded-xl bg-white/5 border border-border focus:border-primary text-sm focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={uploadingDeposit}
                className="w-full h-12 rounded-xl bg-gradient-gold text-primary-foreground font-semibold text-sm active:scale-[0.98] transition mt-2 disabled:opacity-50 flex items-center justify-center"
              >
                {uploadingDeposit ? "Procesando..." : "Enviar Comprobante"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
