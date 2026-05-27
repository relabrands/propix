import { useState, useEffect, useMemo } from "react";
import {
  Send, Upload, Download, Check, Calendar, ChevronDown, ChevronUp,
  Users, DollarSign, Percent, AlertTriangle, Eye, X, FileText, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/admin/PageHeader";
import StatusPill from "@/components/admin/StatusPill";
import StatCard from "@/components/admin/StatCard";
import {
  collection, query as fsQuery, where, onSnapshot,
  addDoc, doc, updateDoc, orderBy, getDocs,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { formatUSD } from "@/lib/format";
import { cn } from "@/lib/utils";

// ── Constants ────────────────────────────────────────────────────────────────
const MGMT_FEE_PCT   = 0.05;   // 5% management fee sobre gross del inversor
const ISRPF_PCT      = 0.10;   // 10% retención ISRPF (Ley 179-09 RD)

// ── Types ────────────────────────────────────────────────────────────────────
interface InvestorRow {
  userId: string;
  investorName: string;
  investorEmail: string;
  fractionsCount: number;
  ownershipPct: number;       // % del total de fracciones
  grossShare: number;         // su parte proporcional de la renta neta de gastos
  managementFee: number;      // 5% del grossShare
  afterMgmt: number;          // grossShare − managementFee
  isrpf: number;              // 10% de afterMgmt
  netPayout: number;          // afterMgmt − isrpf
}

interface HistoryRecord {
  id: string;
  propertyId: string;
  propertyName: string;
  month: string;
  grossRent: number;
  operatingExpenses: number;
  rentAfterExpenses: number;
  totalMgmtFees: number;
  totalIsrpf: number;
  totalNetPaid: number;
  investorCount: number;
  status: string;
  date: string;
  receiptUrl?: string;
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function Distribuciones() {
  // Properties
  const [properties, setProperties] = useState<any[]>([]);
  const [propertyId, setPropertyId] = useState("");

  // Form state
  const [grossRent, setGrossRent] = useState(0);
  const [operatingExpenses, setOperatingExpenses] = useState(0);
  const [reportMonth, setReportMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Investors for selected property
  const [investments, setInvestments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingInvestors, setLoadingInvestors] = useState(false);

  // History
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [historyDetail, setHistoryDetail] = useState<Record<string, any[]>>({});

  // Preview modal
  const [showPreview, setShowPreview] = useState(false);

  // ── Fetch active properties ──────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "properties"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProperties(data);
      if (data.length > 0 && !propertyId) setPropertyId(data[0].id);
    });
    return () => unsubscribe();
  }, []);

  // ── Fetch investments for selected property ──────────────────────────────
  useEffect(() => {
    if (!propertyId) return;
    setLoadingInvestors(true);
    const q = fsQuery(collection(db, "investments"), where("propertyId", "==", propertyId));
    const unsub = onSnapshot(q, async (snap) => {
      const invs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setInvestments(invs);

      // Fetch user names/emails
      const uids = [...new Set(invs.map((i: any) => i.userId))];
      const userDocs = await Promise.all(
        uids.map((uid) => getDocs(fsQuery(collection(db, "users"), where("__name__", "==", uid))))
      );
      const usersData = userDocs.flatMap((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
      setUsers(usersData);
      setLoadingInvestors(false);
    });
    return () => unsub();
  }, [propertyId]);

  // ── Fetch distribution history ───────────────────────────────────────────
  useEffect(() => {
    const q = fsQuery(
      collection(db, "distributions"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() } as HistoryRecord)));
    }, () => setHistory([]));
    return () => unsub();
  }, []);

  // ── Selected property details ────────────────────────────────────────────
  const selectedProperty = properties.find((p) => p.id === propertyId);
  const totalFractions = selectedProperty?.totalFractions || 1;

  // ── Consolidate investments by userId (group multiple purchases) ─────────
  const consolidatedInvestments = useMemo(() => {
    const map: Record<string, { userId: string; fractionsCount: number }> = {};
    investments.forEach((inv) => {
      if (!map[inv.userId]) map[inv.userId] = { userId: inv.userId, fractionsCount: 0 };
      map[inv.userId].fractionsCount += inv.fractionsCount || 0;
    });
    return Object.values(map);
  }, [investments]);

  // ── Calculate per-investor breakdown ────────────────────────────────────
  const rentAfterExpenses = Math.max(0, grossRent - operatingExpenses);

  const investorRows: InvestorRow[] = useMemo(() => {
    return consolidatedInvestments.map((inv) => {
      const user = users.find((u) => u.id === inv.userId);
      const ownershipPct = totalFractions > 0 ? inv.fractionsCount / totalFractions : 0;
      const grossShare = rentAfterExpenses * ownershipPct;
      const managementFee = grossShare * MGMT_FEE_PCT;
      const afterMgmt = grossShare - managementFee;
      const isrpf = afterMgmt * ISRPF_PCT;
      const netPayout = afterMgmt - isrpf;
      return {
        userId: inv.userId,
        investorName: user?.name || user?.displayName || "Inversor",
        investorEmail: user?.email || "—",
        fractionsCount: inv.fractionsCount,
        ownershipPct,
        grossShare,
        managementFee,
        afterMgmt,
        isrpf,
        netPayout,
      };
    });
  }, [consolidatedInvestments, users, rentAfterExpenses, totalFractions]);

  // ── Totals ───────────────────────────────────────────────────────────────
  const totals = useMemo(() => ({
    grossShare:    investorRows.reduce((s, r) => s + r.grossShare, 0),
    managementFee: investorRows.reduce((s, r) => s + r.managementFee, 0),
    isrpf:         investorRows.reduce((s, r) => s + r.isrpf, 0),
    netPayout:     investorRows.reduce((s, r) => s + r.netPayout, 0),
  }), [investorRows]);

  // ── Month label ──────────────────────────────────────────────────────────
  const monthLabel = useMemo(() => {
    const [y, m] = reportMonth.split("-");
    return new Date(Number(y), Number(m) - 1).toLocaleDateString("es-DO", { month: "long", year: "numeric" });
  }, [reportMonth]);

  // ── Submit distribution ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedProperty) { toast.error("Selecciona una propiedad"); return; }
    if (grossRent <= 0) { toast.error("Ingresa la renta bruta cobrada"); return; }
    if (investorRows.length === 0) { toast.error("No hay inversores activos en esta propiedad"); return; }
    if (!receiptFile) { toast.error("Sube el estado de cuenta del banco como comprobante"); return; }

    setSubmitting(true);
    try {
      // 1. Upload receipt
      const ext = receiptFile.name.split(".").pop();
      const fileRef = ref(storage, `distributions/${propertyId}_${reportMonth}_${Date.now()}.${ext}`);
      await uploadBytes(fileRef, receiptFile);
      const receiptUrl = await getDownloadURL(fileRef);

      // 2. Create parent distribution record
      const distRef = await addDoc(collection(db, "distributions"), {
        propertyId,
        propertyName: selectedProperty.name,
        month: monthLabel,
        reportMonth,
        grossRent,
        operatingExpenses,
        rentAfterExpenses,
        totalMgmtFees: totals.managementFee,
        totalIsrpf: totals.isrpf,
        totalNetPaid: totals.netPayout,
        investorCount: investorRows.length,
        status: "Completada",
        receiptUrl,
        createdAt: new Date().toISOString(),
        date: new Date().toLocaleDateString("es-DO"),
      });

      // 3. Create one transaction per investor
      await Promise.all(
        investorRows.map((row) =>
          addDoc(collection(db, "transactions"), {
            userId: row.userId,
            investor: row.investorName,
            property: selectedProperty.name,
            propertyId,
            distributionId: distRef.id,
            type: "Distribución",
            month: monthLabel,
            fractionsCount: row.fractionsCount,
            ownershipPct: row.ownershipPct,
            grossShare: row.grossShare,
            managementFee: row.managementFee,
            managementFeePct: MGMT_FEE_PCT,
            afterManagement: row.afterMgmt,
            isrpf: row.isrpf,
            isrpfPct: ISRPF_PCT,
            amount: row.netPayout,          // net amount received by investor
            status: "Completada",
            receiptUrl,
            date: new Date().toISOString(),
          })
        )
      );

      toast.success("Distribución ejecutada", {
        description: `${investorRows.length} inversores · ${formatUSD(totals.netPayout)} distribuidos netos`,
      });

      // Reset form
      setGrossRent(0);
      setOperatingExpenses(0);
      setReceiptFile(null);
      setShowPreview(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al ejecutar la distribución");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Load history detail ──────────────────────────────────────────────────
  const loadHistoryDetail = async (distId: string) => {
    if (historyDetail[distId]) return;
    const q = fsQuery(
      collection(db, "transactions"),
      where("distributionId", "==", distId)
    );
    const snap = await getDocs(q);
    setHistoryDetail((prev) => ({
      ...prev,
      [distId]: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pagos y Distribuciones"
        subtitle="Reporta la renta cobrada y ejecuta distribuciones por inversor"
      />

      {/* ── KPIs ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Distribuciones ejecutadas" value={history.length.toString()} icon={Calendar} />
        <StatCard label="Total distribuido (neto)" value={formatUSD(history.reduce((s, h) => s + (h.totalNetPaid || 0), 0), { decimals: 0 })} icon={DollarSign} accent="gold" />
        <StatCard label="Total retenido ISRPF" value={formatUSD(history.reduce((s, h) => s + (h.totalIsrpf || 0), 0), { decimals: 0 })} icon={Percent} accent="teal" hint="Ley 179-09 RD" />
        <StatCard label="Total Mgmt Fees" value={formatUSD(history.reduce((s, h) => s + (h.totalMgmtFees || 0), 0), { decimals: 0 })} icon={Users} />
      </div>

      {/* ── Distribution Form ──────────────────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-[hsl(var(--surface))] p-6 space-y-6">
        <div>
          <h3 className="font-display text-xl">Nueva distribución</h3>
          <p className="text-xs text-muted-foreground mt-1">
            El sistema calculará automáticamente el desglose por inversor: Management Fee (5%) e ISRPF (10%).
          </p>
        </div>

        {/* Row 1: Property + Month */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Propiedad</label>
            {properties.length > 0 ? (
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full h-10 rounded-md bg-background border border-border px-3 text-sm focus:outline-none focus:border-primary/50"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            ) : (
              <div className="w-full h-10 rounded-md bg-muted/40 border border-dashed border-border px-3 text-sm text-muted-foreground flex items-center">
                No hay propiedades. Crea una primero.
              </div>
            )}
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Mes a reportar</label>
            <input
              type="month"
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
              className="w-full h-10 rounded-md bg-background border border-border px-3 text-sm font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {/* Row 2: Rent + Expenses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Renta bruta cobrada (USD)</label>
            <input
              type="number"
              min="0"
              value={grossRent || ""}
              onChange={(e) => setGrossRent(Number(e.target.value))}
              placeholder="Ej: 2000"
              className="w-full h-10 rounded-md bg-background border border-border px-3 text-sm font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Gastos operativos (USD)</label>
            <input
              type="number"
              min="0"
              value={operatingExpenses || ""}
              onChange={(e) => setOperatingExpenses(Number(e.target.value))}
              placeholder="Luz, agua, mantenimiento…"
              className="w-full h-10 rounded-md bg-background border border-border px-3 text-sm font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {/* Summary banner */}
        {grossRent > 0 && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Renta bruta</p>
              <p className="font-mono text-xl mt-0.5">{formatUSD(grossRent)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">− Gastos operativos</p>
              <p className="font-mono text-xl mt-0.5 text-muted-foreground">−{formatUSD(operatingExpenses)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">− Mgmt Fees (5%)</p>
              <p className="font-mono text-xl mt-0.5 text-secondary">−{formatUSD(totals.managementFee)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Neto inversores</p>
              <p className="font-mono text-xl mt-0.5 text-primary font-bold">{formatUSD(totals.netPayout)}</p>
            </div>
          </div>
        )}

        {/* Investor breakdown table preview */}
        {grossRent > 0 && investorRows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Desglose por inversor · {selectedProperty?.name}</h4>
              {loadingInvestors && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/20">
                    <tr>
                      <th className="text-left px-3 py-2.5 font-medium">Inversor</th>
                      <th className="text-right px-3 py-2.5 font-medium">Fracciones</th>
                      <th className="text-right px-3 py-2.5 font-medium">%</th>
                      <th className="text-right px-3 py-2.5 font-medium">Gross Share</th>
                      <th className="text-right px-3 py-2.5 font-medium">Mgmt Fee (5%)</th>
                      <th className="text-right px-3 py-2.5 font-medium">Tras fee</th>
                      <th className="text-right px-3 py-2.5 font-medium">ISRPF (10%)</th>
                      <th className="text-right px-3 py-2.5 font-medium font-bold">Neto a pagar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investorRows.map((row) => (
                      <tr key={row.userId} className="border-t border-border hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2.5">
                          <div className="font-medium">{row.investorName}</div>
                          <div className="text-muted-foreground text-[10px]">{row.investorEmail}</div>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono">{row.fractionsCount}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">
                          {(row.ownershipPct * 100).toFixed(2)}%
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono">{formatUSD(row.grossShare)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-secondary">−{formatUSD(row.managementFee)}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{formatUSD(row.afterMgmt)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-amber-400">−{formatUSD(row.isrpf)}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-success">
                          {formatUSD(row.netPayout)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-border bg-muted/10">
                    <tr>
                      <td colSpan={3} className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Totales · {investorRows.length} inversores
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold">{formatUSD(totals.grossShare)}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-secondary">−{formatUSD(totals.managementFee)}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold">{formatUSD(totals.grossShare - totals.managementFee)}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-amber-400">−{formatUSD(totals.isrpf)}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-success">{formatUSD(totals.netPayout)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {grossRent > 0 && investorRows.length === 0 && !loadingInvestors && (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No hay inversores activos en esta propiedad todavía.
          </div>
        )}

        {/* Receipt upload */}
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">
            Comprobante de renta (estado de cuenta bancario) <span className="text-destructive">*</span>
          </label>
          <label
            className={cn(
              "w-full border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors block",
              receiptFile ? "border-success/40 bg-success/5" : "border-border hover:border-primary/40 hover:bg-primary/5"
            )}
          >
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            />
            {receiptFile ? (
              <div className="flex items-center justify-center gap-2 text-success">
                <Check className="h-5 w-5" />
                <span className="text-sm font-medium">{receiptFile.name}</span>
                <button
                  onClick={(e) => { e.preventDefault(); setReceiptFile(null); }}
                  className="ml-2 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="text-muted-foreground">
                <Upload className="h-6 w-6 mx-auto mb-2" />
                <div className="text-sm">Arrastra o haz clic para subir</div>
                <div className="text-xs mt-0.5">PDF, JPG, PNG · máx 10MB</div>
              </div>
            )}
          </label>
        </div>

        {/* ISRPF info */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-amber-300">Retención ISRPF (10%)</span> — Ley 179-09 RD.
            El sistema calcula y registra la retención sobre cada distribución individual.
            Total a depositar a DGII este mes:{" "}
            <span className="font-mono text-amber-300">{formatUSD(totals.isrpf)}</span>
          </p>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2 border-t border-border">
          <button
            onClick={handleSubmit}
            disabled={submitting || grossRent <= 0 || investorRows.length === 0}
            className="inline-flex items-center gap-2 h-10 px-6 rounded-md bg-gradient-gold text-primary-foreground text-sm font-semibold hover:shadow-glow transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Procesando…</>
            ) : (
              <><Send className="h-4 w-4" /> Ejecutar distribución · {investorRows.length} inversores</>
            )}
          </button>
        </div>
      </div>

      {/* ── History ─────────────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-[hsl(var(--surface))] overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl">Historial de distribuciones</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Cada fila expande el desglose individual por inversor</p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="h-12 w-12 mx-auto rounded-full bg-muted/40 grid place-items-center mb-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Aún no hay distribuciones registradas</p>
            <p className="text-xs text-muted-foreground/80 mt-1">El historial aparecerá aquí al ejecutar la primera</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {history.map((h) => (
              <div key={h.id}>
                {/* Summary row */}
                <button
                  onClick={async () => {
                    if (expandedHistory === h.id) {
                      setExpandedHistory(null);
                    } else {
                      setExpandedHistory(h.id);
                      await loadHistoryDetail(h.id);
                    }
                  }}
                  className="w-full text-left px-5 py-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{h.propertyName}</span>
                        <span className="text-muted-foreground text-xs">·</span>
                        <span className="text-xs text-muted-foreground capitalize">{h.month}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="font-mono">Bruta: {formatUSD(h.grossRent, { decimals: 0 })}</span>
                        <span>·</span>
                        <span className="font-mono text-secondary">Mgmt: −{formatUSD(h.totalMgmtFees, { decimals: 0 })}</span>
                        <span>·</span>
                        <span className="font-mono text-amber-400">ISRPF: −{formatUSD(h.totalIsrpf, { decimals: 0 })}</span>
                        <span>·</span>
                        <span className="font-mono text-success font-bold">Neto: {formatUSD(h.totalNetPaid, { decimals: 0 })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusPill tone="success">{h.status}</StatusPill>
                      <span className="text-xs text-muted-foreground font-mono">{h.date}</span>
                      {h.receiptUrl && (
                        <a
                          href={h.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                          title="Ver comprobante"
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {expandedHistory === h.id
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </button>

                {/* Expanded per-investor detail */}
                {expandedHistory === h.id && (
                  <div className="border-t border-border bg-muted/5 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Desglose por inversor · {h.investorCount} participantes
                    </p>
                    {historyDetail[h.id] ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            <tr>
                              <th className="text-left pb-2 font-medium">Inversor</th>
                              <th className="text-right pb-2 font-medium">Fracciones</th>
                              <th className="text-right pb-2 font-medium">%</th>
                              <th className="text-right pb-2 font-medium">Gross</th>
                              <th className="text-right pb-2 font-medium">Mgmt 5%</th>
                              <th className="text-right pb-2 font-medium">ISRPF 10%</th>
                              <th className="text-right pb-2 font-medium">Neto pagado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {historyDetail[h.id].map((tx) => (
                              <tr key={tx.id} className="hover:bg-muted/10">
                                <td className="py-2 pr-3">
                                  <div className="font-medium">{tx.investor}</div>
                                </td>
                                <td className="py-2 text-right font-mono">{tx.fractionsCount}</td>
                                <td className="py-2 text-right font-mono text-muted-foreground">
                                  {((tx.ownershipPct || 0) * 100).toFixed(2)}%
                                </td>
                                <td className="py-2 text-right font-mono">{formatUSD(tx.grossShare || 0)}</td>
                                <td className="py-2 text-right font-mono text-secondary">−{formatUSD(tx.managementFee || 0)}</td>
                                <td className="py-2 text-right font-mono text-amber-400">−{formatUSD(tx.isrpf || 0)}</td>
                                <td className="py-2 text-right font-mono font-bold text-success">{formatUSD(tx.amount || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando detalle…
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
