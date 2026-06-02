import { useState, useEffect, useMemo } from "react";
import {
  BookOpen, TrendingUp, TrendingDown, DollarSign, FileText,
  Download, Plus, AlertTriangle, Building2, Wallet,
  Users, BarChart2, Scale, Receipt, X, Loader2, Check,
} from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import StatCard from "@/components/admin/StatCard";
import StatusPill from "@/components/admin/StatusPill";
import { formatUSD } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  collection, onSnapshot, query as fsQuery, orderBy,
  addDoc, deleteDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  Area, AreaChart, PieChart, Pie, Cell,
} from "recharts";

// ─── Constants ─────────────────────────────────────────────────────────────────
const MONTHS_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const CURRENT_YEAR = new Date().getFullYear();
const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(38 60% 65%)",
  "hsl(180 40% 55%)",
  "hsl(270 40% 60%)",
  "hsl(340 50% 60%)",
];

const EXPENSE_CATEGORIES = [
  "Sueldos y salarios",
  "Servidores y hosting",
  "Marketing y publicidad",
  "Legal y notaría",
  "Oficina y renta",
  "Software y licencias",
  "Contabilidad externa",
  "Viajes y representación",
  "Otros gastos",
];

const tooltipStyle = {
  background: "hsl(var(--surface-elevated))",
  border: "1px solid hsl(var(--border-strong))",
  borderRadius: 8,
  fontSize: 12,
  fontFamily: "JetBrains Mono",
};

type Tab = "resumen" | "ingresos" | "egresos";

interface PlatformExpense {
  id: string;
  date: string;
  concepto: string;
  categoria: string;
  monto: number;
  proveedor?: string;
  notas?: string;
  createdAt?: any;
}

// ─── Add Expense Modal ─────────────────────────────────────────────────────────
function AddExpenseModal({ onClose }: { onClose: () => void }) {
  const [concepto, setConcepto] = useState("");
  const [categoria, setCategoria] = useState(EXPENSE_CATEGORIES[0]);
  const [monto, setMonto] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSave = async () => {
    if (!concepto || !monto || Number(monto) <= 0) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "platform_expenses"), {
        concepto,
        categoria,
        monto: Number(monto),
        proveedor,
        date,
        notas,
        createdAt: serverTimestamp(),
      });
      setDone(true);
      setTimeout(onClose, 800);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-[hsl(var(--surface-elevated))] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-display text-xl">Registrar Gasto</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-md hover:bg-muted/40 flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Concepto *</label>
              <input
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                placeholder="Ej: Pago servidor AWS mayo"
                className="w-full h-9 rounded-md bg-muted/40 border border-border px-3 text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Categoría *</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full h-9 rounded-md bg-muted/40 border border-border px-3 text-sm focus:outline-none focus:border-primary/50"
              >
                {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Monto (USD) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-9 rounded-md bg-muted/40 border border-border pl-6 pr-3 text-sm font-mono focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Fecha *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-9 rounded-md bg-muted/40 border border-border px-3 text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Proveedor</label>
              <input
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                placeholder="Ej: Amazon Web Services"
                className="w-full h-9 rounded-md bg-muted/40 border border-border px-3 text-sm focus:outline-none focus:border-primary/50"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Notas</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={2}
                placeholder="Referencia de factura, detalles adicionales..."
                className="w-full rounded-md bg-muted/40 border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-md border border-border text-sm hover:border-border-strong"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || done || !concepto || !monto}
            className="flex-1 h-10 rounded-md bg-gradient-gold text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60 hover:shadow-glow transition-shadow"
          >
            {done ? <><Check className="h-4 w-4" /> Guardado</> : saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando</> : "Guardar gasto"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Summary Card ──────────────────────────────────────────────────────────────
function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: "gold" | "red" | "green" }) {
  return (
    <div className={cn(
      "rounded-lg border p-4",
      accent === "gold" && "border-primary/30 bg-primary/5",
      accent === "red" && "border-destructive/30 bg-destructive/5",
      accent === "green" && "border-success/30 bg-success/5",
      !accent && "border-border bg-[hsl(var(--surface))]"
    )}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className={cn(
        "font-mono text-xl font-semibold",
        accent === "gold" && "text-primary",
        accent === "red" && "text-destructive",
        accent === "green" && "text-success",
      )}>{value}</p>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function Contabilidad() {
  const [tab, setTab] = useState<Tab>("resumen");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<PlatformExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [filterYear, setFilterYear] = useState<number>(CURRENT_YEAR);
  const [filterMonth, setFilterMonth] = useState<number | "all">("all");
  const [filterCategoria, setFilterCategoria] = useState<string>("Todas");

  useEffect(() => {
    const unsubTx = onSnapshot(
      fsQuery(collection(db, "transactions"), orderBy("date", "desc")),
      (snap) => { setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); },
      () => setLoading(false)
    );
    const unsubExp = onSnapshot(
      fsQuery(collection(db, "platform_expenses"), orderBy("date", "desc")),
      (snap) => setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as PlatformExpense[])
    );
    return () => { unsubTx(); unsubExp(); };
  }, []);

  // ── Platform revenue: fees collected from investment transactions ──
  const feeRows = useMemo(() =>
    transactions
      .filter((t) => {
        if (!t.date) return false;
        const d = new Date(t.date);
        if (d.getFullYear() !== filterYear) return false;
        if (filterMonth !== "all" && d.getMonth() !== filterMonth) return false;
        return t.fee && t.fee > 0 && t.status === "Completada";
      })
      .map((t) => ({
        id: t.id,
        date: t.date,
        concepto: `Fee · ${t.type || "Transacción"}`,
        propiedad: t.property || "—",
        inversor: t.investor || "—",
        categoria: t.type === "Inversión" ? "Fondeo fee" : t.type === "Distribución" ? "Admin fee" : "Listing fee",
        monto: t.fee,
      })),
  [transactions, filterYear, filterMonth]);

  // ── Platform expenses (operational costs) ──
  const expenseRows = useMemo(() =>
    expenses.filter((e) => {
      if (!e.date) return false;
      const d = new Date(e.date);
      if (d.getFullYear() !== filterYear) return false;
      if (filterMonth !== "all" && d.getMonth() !== filterMonth) return false;
      if (filterCategoria !== "Todas" && e.categoria !== filterCategoria) return false;
      return true;
    }),
  [expenses, filterYear, filterMonth, filterCategoria]);

  // ── KPIs ──
  const totalIngresos = useMemo(() => feeRows.reduce((s, r) => s + r.monto, 0), [feeRows]);
  const totalEgresos = useMemo(() => expenseRows.reduce((s, r) => s + r.monto, 0), [expenseRows]);
  const utilidadNeta = totalIngresos - totalEgresos;
  const margenPct = totalIngresos > 0 ? (utilidadNeta / totalIngresos) * 100 : 0;

  // ── Also pull capital captado (investments) for context ──
  const totalCapital = useMemo(() =>
    transactions
      .filter((t) => t.date && new Date(t.date).getFullYear() === filterYear && t.type === "Inversión" && t.status === "Completada")
      .reduce((s, t) => s + (t.amount || 0), 0),
  [transactions, filterYear]);

  // ── Monthly chart data ──
  const monthlyData = useMemo(() =>
    MONTHS_ES.map((m, idx) => {
      const txMonth = transactions.filter((t) =>
        t.date && new Date(t.date).getFullYear() === filterYear && new Date(t.date).getMonth() === idx
      );
      const ingresos = txMonth.filter((t) => t.fee && t.status === "Completada").reduce((s, t) => s + (t.fee || 0), 0);
      const expMonth = expenses.filter((e) =>
        e.date && new Date(e.date).getFullYear() === filterYear && new Date(e.date).getMonth() === idx
      );
      const egresos = expMonth.reduce((s, e) => s + e.monto, 0);
      return { mes: m, ingresos, egresos, utilidad: ingresos - egresos };
    }),
  [transactions, expenses, filterYear]);

  // ── Fee breakdown for pie ──
  const feeBreakdown = useMemo(() => {
    const groups: Record<string, number> = {};
    feeRows.forEach((r) => { groups[r.categoria] = (groups[r.categoria] || 0) + r.monto; });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [feeRows]);

  // ── Expense by category for pie ──
  const expenseBreakdown = useMemo(() => {
    const groups: Record<string, number> = {};
    expenseRows.forEach((r) => { groups[r.categoria] = (groups[r.categoria] || 0) + r.monto; });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [expenseRows]);

  // ── CSV Export ──
  const exportCSV = (rows: any[], cols: string[], filename: string) => {
    const header = cols.join(",");
    const body = rows.map((r) => cols.map((c) => `"${r[c] ?? ""}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + header + "\n" + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}_${filterYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("¿Eliminar este gasto?")) return;
    setDeletingId(id);
    try { await deleteDoc(doc(db, "platform_expenses", id)); } finally { setDeletingId(null); }
  };

  // ── Shared filter bar ──
  const FilterBar = () => (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={filterYear}
        onChange={(e) => setFilterYear(Number(e.target.value))}
        className="h-9 px-3 rounded-md bg-muted/40 border border-border text-sm focus:outline-none focus:border-primary/50"
      >
        {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <select
        value={filterMonth === "all" ? "all" : filterMonth}
        onChange={(e) => setFilterMonth(e.target.value === "all" ? "all" : Number(e.target.value))}
        className="h-9 px-3 rounded-md bg-muted/40 border border-border text-sm focus:outline-none focus:border-primary/50"
      >
        <option value="all">Todo el año</option>
        {MONTHS_ES.map((m, i) => <option key={i} value={i}>{m}</option>)}
      </select>
    </div>
  );

  return (
    <div className="space-y-6 min-w-0">
      <PageHeader
        title="Contabilidad"
        subtitle={`P&L interno de la plataforma · ${filterYear}`}
        actions={<FilterBar />}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/30 border border-border overflow-x-auto">
        {([
          { id: "resumen", label: "Resumen P&L", icon: BarChart2 },
          { id: "ingresos", label: "Libro de Ingresos", icon: TrendingUp },
          { id: "egresos", label: "Libro de Egresos", icon: TrendingDown },
        ] as { id: Tab; label: string; icon: any }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-3 md:px-4 h-9 rounded-md text-sm font-medium transition-all whitespace-nowrap shrink-0",
              tab === t.id
                ? "bg-[hsl(var(--surface-elevated))] text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden md:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB: RESUMEN P&L ──────────────────────────────────────────────────── */}
      {tab === "resumen" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Ingresos (fees)" value={formatUSD(totalIngresos, { decimals: 0 })} icon={TrendingUp} accent="gold" />
            <StatCard label="Gastos operativos" value={formatUSD(totalEgresos, { decimals: 0 })} icon={TrendingDown} />
            <StatCard
              label="Utilidad neta"
              value={formatUSD(utilidadNeta, { decimals: 0 })}
              icon={Scale}
              accent={utilidadNeta >= 0 ? "gold" : "default"}
            />
            <StatCard label="Margen operativo" value={`${margenPct.toFixed(1)}%`} icon={Receipt} accent="teal" hint="Utilidad / Ingresos" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Capital captado" value={formatUSD(totalCapital, { decimals: 0 })} icon={Building2} hint="Vol. de inversión" />
            <StatCard label="Fondeo fees" value={formatUSD(feeRows.filter(r => r.categoria === "Fondeo fee").reduce((s,r)=>s+r.monto,0), { decimals: 0 })} icon={Wallet} />
            <StatCard label="Admin fees" value={formatUSD(feeRows.filter(r => r.categoria === "Admin fee").reduce((s,r)=>s+r.monto,0), { decimals: 0 })} icon={FileText} />
            <StatCard label="Gastos registrados" value={expenseRows.length.toString()} icon={Receipt} hint={`en ${filterYear}`} />
          </div>

          {/* P&L Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 rounded-lg border border-border bg-[hsl(var(--surface))] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-xl">Ingresos vs Gastos operativos</h3>
                  <p className="text-xs text-muted-foreground">Por mes · {filterYear}</p>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary inline-block" />Ingresos</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive/70 inline-block" />Gastos</span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={monthlyData} barGap={4}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatUSD(v, { decimals: 0 })} />
                    <Bar dataKey="ingresos" name="Ingresos" fill="hsl(var(--primary))" radius={[4,4,0,0]} maxBarSize={28} />
                    <Bar dataKey="egresos" name="Gastos" fill="hsl(var(--destructive) / 0.7)" radius={[4,4,0,0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expense breakdown pie */}
            <div className="lg:col-span-2 rounded-lg border border-border bg-[hsl(var(--surface))] p-5">
              <h3 className="font-display text-xl mb-1">Gastos por categoría</h3>
              <p className="text-xs text-muted-foreground mb-3">Distribución operativa</p>
              {expenseBreakdown.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sin gastos registrados</div>
              ) : (
                <>
                  <div className="h-48">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={expenseBreakdown} dataKey="value" nameKey="name" innerRadius={44} outerRadius={80} paddingAngle={3}>
                          {expenseBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="hsl(var(--surface))" />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatUSD(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1 mt-1">
                    {expenseBreakdown.map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="h-2 w-2 rounded-full inline-block" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          {d.name}
                        </span>
                        <span className="font-mono">{formatUSD(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Utilidad neta mensual */}
          <div className="rounded-lg border border-border bg-[hsl(var(--surface))] p-5">
            <h3 className="font-display text-xl mb-1">Utilidad Neta Mensual</h3>
            <p className="text-xs text-muted-foreground mb-4">Ingresos − Gastos operativos · {filterYear}</p>
            <div className="h-52">
              <ResponsiveContainer>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="utilGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(1)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatUSD(v, { decimals: 0 })} />
                  <Area type="monotone" dataKey="utilidad" name="Utilidad neta" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#utilGrad)" dot={{ fill: "hsl(var(--primary))", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: LIBRO DE INGRESOS ────────────────────────────────────────────── */}
      {tab === "ingresos" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl">Libro de Ingresos</h2>
              <p className="text-sm text-muted-foreground">Fees e ingresos cobrados por la plataforma · {filterYear}</p>
            </div>
            <button
              onClick={() => exportCSV(
                feeRows.map(r => ({
                  fecha: r.date ? new Date(r.date).toLocaleDateString("es-DO") : "",
                  concepto: r.concepto,
                  propiedad: r.propiedad,
                  inversor: r.inversor,
                  categoria: r.categoria,
                  monto_usd: r.monto.toFixed(2),
                })),
                ["fecha","concepto","propiedad","inversor","categoria","monto_usd"],
                "propix_ingresos"
              )}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-gradient-gold text-primary-foreground text-sm font-medium hover:shadow-glow transition-shadow"
            >
              <Download className="h-3.5 w-3.5" /> Exportar CSV
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard label="Total ingresos" value={formatUSD(totalIngresos)} accent="gold" />
            <SummaryCard label="Fondeo fees" value={formatUSD(feeRows.filter(r=>r.categoria==="Fondeo fee").reduce((s,r)=>s+r.monto,0))} />
            <SummaryCard label="Admin fees" value={formatUSD(feeRows.filter(r=>r.categoria==="Admin fee").reduce((s,r)=>s+r.monto,0))} />
            <SummaryCard label="Listing fees" value={formatUSD(feeRows.filter(r=>r.categoria==="Listing fee").reduce((s,r)=>s+r.monto,0))} />
          </div>

          {feeBreakdown.length > 0 && (
            <div className="rounded-lg border border-border bg-[hsl(var(--surface))] p-4">
              <div className="flex gap-4 text-xs">
                {feeBreakdown.map((d, i) => (
                  <span key={d.name} className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full inline-block" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {d.name}: <span className="font-mono text-foreground">{formatUSD(d.value)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg border border-border bg-[hsl(var(--surface))] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/20">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Fecha</th>
                    <th className="text-left px-4 py-3 font-medium">Concepto</th>
                    <th className="text-left px-4 py-3 font-medium">Propiedad</th>
                    <th className="text-left px-4 py-3 font-medium">Inversor</th>
                    <th className="text-left px-4 py-3 font-medium">Categoría</th>
                    <th className="text-right px-4 py-3 font-medium">Monto (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                  ) : feeRows.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Sin ingresos registrados en el período</td></tr>
                  ) : (
                    feeRows.map((r) => (
                      <tr key={r.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{r.date ? new Date(r.date).toLocaleDateString("es-DO") : "—"}</td>
                        <td className="px-4 py-3">{r.concepto}</td>
                        <td className="px-4 py-3 text-muted-foreground truncate max-w-[160px]">{r.propiedad}</td>
                        <td className="px-4 py-3 truncate max-w-[140px]">{r.inversor}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                            {r.categoria}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-success font-semibold">+{formatUSD(r.monto)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {feeRows.length > 0 && (
                  <tfoot className="border-t border-border bg-muted/10">
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-success">+{formatUSD(totalIngresos)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: LIBRO DE EGRESOS ─────────────────────────────────────────────── */}
      {tab === "egresos" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl">Libro de Egresos</h2>
              <p className="text-sm text-muted-foreground">Gastos operativos internos de la plataforma · {filterYear}</p>
            </div>
            <div className="flex gap-2">
              <select
                value={filterCategoria}
                onChange={(e) => setFilterCategoria(e.target.value)}
                className="h-9 px-3 rounded-md bg-muted/40 border border-border text-sm focus:outline-none focus:border-primary/50"
              >
                <option value="Todas">Todas las categorías</option>
                {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <button
                onClick={() => exportCSV(
                  expenseRows.map(r => ({
                    fecha: r.date ? new Date(r.date).toLocaleDateString("es-DO") : "",
                    concepto: r.concepto,
                    categoria: r.categoria,
                    proveedor: r.proveedor || "",
                    monto_usd: r.monto.toFixed(2),
                    notas: r.notas || "",
                  })),
                  ["fecha","concepto","categoria","proveedor","monto_usd","notas"],
                  "propix_egresos"
                )}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border text-sm hover:border-border-strong"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
              <button
                onClick={() => setShowAddExpense(true)}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-gradient-gold text-primary-foreground text-sm font-medium hover:shadow-glow transition-shadow"
              >
                <Plus className="h-3.5 w-3.5" /> Registrar gasto
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard label="Total gastos" value={formatUSD(totalEgresos)} accent="red" />
            {["Sueldos y salarios","Servidores y hosting","Marketing y publicidad"].map((cat) => (
              <SummaryCard
                key={cat}
                label={cat.split(" ")[0]}
                value={formatUSD(expenseRows.filter(r=>r.categoria===cat).reduce((s,r)=>s+r.monto,0))}
              />
            ))}
          </div>

          <div className="rounded-lg border border-border bg-[hsl(var(--surface))] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[740px] text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/20">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Fecha</th>
                    <th className="text-left px-4 py-3 font-medium">Concepto</th>
                    <th className="text-left px-4 py-3 font-medium">Categoría</th>
                    <th className="text-left px-4 py-3 font-medium">Proveedor</th>
                    <th className="text-right px-4 py-3 font-medium">Monto (USD)</th>
                    <th className="text-left px-4 py-3 font-medium">Notas</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {expenseRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <BookOpen className="h-8 w-8 opacity-30" />
                          <p className="text-sm">No hay gastos registrados en este período</p>
                          <button
                            onClick={() => setShowAddExpense(true)}
                            className="mt-2 inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border text-xs hover:border-primary/50 hover:text-primary"
                          >
                            <Plus className="h-3 w-3" /> Registrar primer gasto
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    expenseRows.map((r) => (
                      <tr key={r.id} className="border-t border-border hover:bg-muted/20 transition-colors group">
                        <td className="px-4 py-3 font-mono text-xs">{r.date ? new Date(r.date).toLocaleDateString("es-DO") : "—"}</td>
                        <td className="px-4 py-3 font-medium">{r.concepto}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/50 text-muted-foreground border border-border">
                            {r.categoria}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{r.proveedor || "—"}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-destructive/80">−{formatUSD(r.monto)}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate">{r.notas || "—"}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDeleteExpense(r.id)}
                            disabled={deletingId === r.id}
                            className="h-7 w-7 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-all"
                          >
                            {deletingId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {expenseRows.length > 0 && (
                  <tfoot className="border-t border-border bg-muted/10">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total gastos</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-destructive/80">−{formatUSD(totalEgresos)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* P&L quick summary */}
          {(totalIngresos > 0 || totalEgresos > 0) && (
            <div className="rounded-lg border border-border bg-[hsl(var(--surface))] p-5 space-y-3">
              <h4 className="text-sm font-semibold">Resumen P&L del período</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ingresos de plataforma (fees)</span>
                  <span className="font-mono text-success">+{formatUSD(totalIngresos)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gastos operativos</span>
                  <span className="font-mono text-destructive/80">−{formatUSD(totalEgresos)}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between font-semibold">
                  <span>Utilidad neta</span>
                  <span className={cn("font-mono", utilidadNeta >= 0 ? "text-success" : "text-destructive")}>
                    {utilidadNeta >= 0 ? "+" : ""}{formatUSD(utilidadNeta)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && <AddExpenseModal onClose={() => setShowAddExpense(false)} />}
    </div>
  );
}
