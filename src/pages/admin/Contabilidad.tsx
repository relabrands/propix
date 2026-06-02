import { useState, useEffect, useMemo } from "react";
import {
  BookOpen, TrendingUp, TrendingDown, DollarSign, FileText,
  Download, Filter, ChevronDown, AlertTriangle, Building2,
  Users, ArrowUpRight, ArrowDownRight, Percent, Calendar,
  Receipt, PieChart as PieChartIcon, BarChart2, Scale,
} from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import StatCard from "@/components/admin/StatCard";
import StatusPill from "@/components/admin/StatusPill";
import { formatUSD } from "@/lib/format";
import { cn } from "@/lib/utils";
import { collection, onSnapshot, query as fsQuery, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart,
} from "recharts";

// ─── Constants ─────────────────────────────────────────────────────────────────
const ISRPF_RATE = 0.10; // 10% retención sobre dividendos — Ley 179-09 RD
const MONTHS_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const CURRENT_YEAR = new Date().getFullYear();
const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(38 60% 65%)",
  "hsl(180 40% 55%)",
  "hsl(270 40% 60%)",
];

const tooltipStyle = {
  background: "hsl(var(--surface-elevated))",
  border: "1px solid hsl(var(--border-strong))",
  borderRadius: 8,
  fontSize: 12,
  fontFamily: "JetBrains Mono",
};

type Tab = "resumen" | "ingresos" | "egresos" | "fiscal";

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function Contabilidad() {
  const [tab, setTab] = useState<Tab>("resumen");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterYear, setFilterYear] = useState<number>(CURRENT_YEAR);
  const [filterMonth, setFilterMonth] = useState<number | "all">("all");
  const [filterType, setFilterType] = useState<string>("Todos");

  useEffect(() => {
    const unsubTx = onSnapshot(
      fsQuery(collection(db, "transactions"), orderBy("date", "desc")),
      (snap) => {
        setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );
    const unsubProp = onSnapshot(collection(db, "properties"), (snap) =>
      setProperties(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) =>
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => { unsubTx(); unsubProp(); unsubUsers(); };
  }, []);

  // ── All completed transactions for the selected year ──
  const txsInYear = useMemo(() =>
    transactions.filter((t) => {
      if (!t.date) return false;
      return new Date(t.date).getFullYear() === filterYear && t.status === "Completada";
    }),
  [transactions, filterYear]);

  // ── Apply month filter ──
  const applyMonthFilter = (arr: any[]) => {
    if (filterMonth === "all") return arr;
    return arr.filter((t) => t.date && new Date(t.date).getMonth() === filterMonth);
  };

  // ── Ingresos: Fees cobrados por la plataforma ──
  const allIngresos = useMemo(() =>
    txsInYear.filter((t) => t.type === "Fee" || (t.fee && t.fee > 0) || t.type === "Depósito"),
  [txsInYear]);

  // Platform fees derived from all investments (fee field)
  const feeRows = useMemo(() =>
    txsInYear
      .filter((t) => t.fee && t.fee > 0)
      .map((t) => ({
        id: t.id,
        date: t.date,
        concepto: `Fee de ${t.type}`,
        propiedad: t.property || "—",
        inversor: t.investor || "—",
        tipo: t.type === "Inversión" ? "Fondeo fee" : t.type === "Distribución" ? "Admin fee" : "Listing fee",
        monto: t.fee,
        estado: t.status,
      })),
  [txsInYear]);

  // ── Egresos: Distribuciones + Retiros ──
  const egresoRows = useMemo(() =>
    txsInYear
      .filter((t) => t.type === "Distribución" || t.type === "Retiro")
      .map((t) => {
        const bruto = t.amount || 0;
        const retencion = t.type === "Distribución" ? bruto * ISRPF_RATE : 0;
        const neto = bruto - retencion;
        return {
          id: t.id,
          date: t.date,
          concepto: t.property || (t.type === "Retiro" ? "Retiro de fondos" : "Distribución"),
          propiedad: t.property || "—",
          beneficiario: t.investor || "—",
          tipo: t.type,
          bruto,
          retencion,
          neto,
          estado: t.status,
          bankDetails: t.bankDetails,
        };
      }),
  [txsInYear]);

  // ── KPIs ──
  const totalIngresos = useMemo(() => feeRows.reduce((s, r) => s + r.monto, 0), [feeRows]);
  const totalCapital = useMemo(() =>
    txsInYear.filter((t) => t.type === "Inversión").reduce((s, t) => s + (t.amount || 0), 0),
  [txsInYear]);
  const totalDistribuciones = useMemo(() =>
    egresoRows.filter((r) => r.tipo === "Distribución").reduce((s, r) => s + r.bruto, 0),
  [egresoRows]);
  const totalRetenciones = useMemo(() => egresoRows.reduce((s, r) => s + r.retencion, 0), [egresoRows]);
  const totalRetiros = useMemo(() =>
    egresoRows.filter((r) => r.tipo === "Retiro").reduce((s, r) => s + r.bruto, 0),
  [egresoRows]);
  const balanceNeto = totalIngresos - totalDistribuciones - totalRetiros;

  // ── Monthly chart data ──
  const monthlyData = useMemo(() =>
    MONTHS_ES.map((m, idx) => {
      const txsMonth = txsInYear.filter((t) => t.date && new Date(t.date).getMonth() === idx);
      const ingresos = txsMonth.filter((t) => t.fee).reduce((s, t) => s + (t.fee || 0), 0);
      const distribuciones = txsMonth.filter((t) => t.type === "Distribución").reduce((s, t) => s + (t.amount || 0), 0);
      const inversiones = txsMonth.filter((t) => t.type === "Inversión").reduce((s, t) => s + (t.amount || 0), 0);
      const retiros = txsMonth.filter((t) => t.type === "Retiro").reduce((s, t) => s + (t.amount || 0), 0);
      return { mes: m, ingresos, distribuciones, inversiones, retiros };
    }),
  [txsInYear]);

  // ── Fee breakdown for pie ──
  const feeBreakdown = useMemo(() => {
    const groups: Record<string, number> = {};
    feeRows.forEach((r) => { groups[r.tipo] = (groups[r.tipo] || 0) + r.monto; });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [feeRows]);

  // ── Fiscal: by investor ──
  const fiscalByInvestor = useMemo(() => {
    const map: Record<string, { name: string; distribuciones: number; retencion: number; neto: number }> = {};
    egresoRows.filter((r) => r.tipo === "Distribución").forEach((r) => {
      if (!map[r.beneficiario]) map[r.beneficiario] = { name: r.beneficiario, distribuciones: 0, retencion: 0, neto: 0 };
      map[r.beneficiario].distribuciones += r.bruto;
      map[r.beneficiario].retencion += r.retencion;
      map[r.beneficiario].neto += r.neto;
    });
    return Object.values(map);
  }, [egresoRows]);

  // ── Filtered rows for tables ──
  const filteredFeeRows = applyMonthFilter(
    filterType !== "Todos" ? feeRows.filter((r) => r.tipo === filterType) : feeRows
  );
  const filteredEgresoRows = applyMonthFilter(
    filterType !== "Todos" ? egresoRows.filter((r) => r.tipo === filterType) : egresoRows
  );

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

  const exportIngresos = () =>
    exportCSV(
      filteredFeeRows.map((r) => ({
        fecha: r.date ? new Date(r.date).toLocaleDateString("es-DO") : "",
        concepto: r.concepto,
        propiedad: r.propiedad,
        inversor: r.inversor,
        tipo_fee: r.tipo,
        monto_usd: r.monto.toFixed(2),
      })),
      ["fecha","concepto","propiedad","inversor","tipo_fee","monto_usd"],
      "propix_libro_ingresos"
    );

  const exportEgresos = () =>
    exportCSV(
      filteredEgresoRows.map((r) => ({
        fecha: r.date ? new Date(r.date).toLocaleDateString("es-DO") : "",
        concepto: r.concepto,
        propiedad: r.propiedad,
        beneficiario: r.beneficiario,
        tipo: r.tipo,
        bruto_usd: r.bruto.toFixed(2),
        retencion_isrpf: r.retencion.toFixed(2),
        neto_usd: r.neto.toFixed(2),
      })),
      ["fecha","concepto","propiedad","beneficiario","tipo","bruto_usd","retencion_isrpf","neto_usd"],
      "propix_libro_egresos"
    );

  const exportFiscal = () =>
    exportCSV(
      fiscalByInvestor.map((r) => ({
        inversor: r.name,
        total_distribuido_usd: r.distribuciones.toFixed(2),
        retencion_isrpf_10pct: r.retencion.toFixed(2),
        neto_pagado_usd: r.neto.toFixed(2),
      })),
      ["inversor","total_distribuido_usd","retencion_isrpf_10pct","neto_pagado_usd"],
      "propix_retencion_dgii"
    );

  return (
    <div className="space-y-6 min-w-0">
      <PageHeader
        title="Contabilidad"
        subtitle={`Registros financieros y cumplimiento DGII · ${filterYear}`}
        actions={
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
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/30 border border-border overflow-x-auto">
        {([
          { id: "resumen", label: "Resumen", icon: BarChart2 },
          { id: "ingresos", label: "Libro de Ingresos", icon: TrendingUp },
          { id: "egresos", label: "Libro de Egresos", icon: TrendingDown },
          { id: "fiscal", label: "Reportes DGII", icon: Scale },
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

      {/* ── TAB: RESUMEN ──────────────────────────────────────────────────────── */}
      {tab === "resumen" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Capital captado" value={formatUSD(totalCapital, { decimals: 0 })} icon={Building2} accent="gold" change={12.4} />
            <StatCard label="Ingresos de plataforma" value={formatUSD(totalIngresos, { decimals: 0 })} icon={TrendingUp} accent="teal" change={8.1} />
            <StatCard label="Distribuciones pagadas" value={formatUSD(totalDistribuciones, { decimals: 0 })} icon={TrendingDown} />
            <StatCard label="Balance neto plataforma" value={formatUSD(balanceNeto, { decimals: 0 })} icon={Scale} accent={balanceNeto >= 0 ? "gold" : "default"} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Retiros procesados" value={formatUSD(totalRetiros, { decimals: 0 })} icon={DollarSign} />
            <StatCard label="Retenciones ISRPF (10%)" value={formatUSD(totalRetenciones, { decimals: 0 })} icon={Percent} accent="teal" hint="Ley 179-09 RD" />
            <StatCard label="Inversores con distribución" value={fiscalByInvestor.length.toString()} icon={Users} />
            <StatCard label="Tx completadas" value={txsInYear.length.toString()} icon={Receipt} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Ingresos vs Egresos */}
            <div className="lg:col-span-3 rounded-lg border border-border bg-[hsl(var(--surface))] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-xl">Ingresos vs Distribuciones</h3>
                  <p className="text-xs text-muted-foreground">Por mes · {filterYear}</p>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary inline-block" />Ingresos plataforma</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-secondary inline-block" />Distribuciones</span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={monthlyData} barGap={4}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatUSD(v, { decimals: 0 })} />
                    <Bar dataKey="ingresos" name="Ingresos plataforma" fill="hsl(var(--primary))" radius={[4,4,0,0]} maxBarSize={28} />
                    <Bar dataKey="distribuciones" name="Distribuciones" fill="hsl(var(--secondary))" radius={[4,4,0,0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Fee breakdown pie */}
            <div className="lg:col-span-2 rounded-lg border border-border bg-[hsl(var(--surface))] p-5">
              <h3 className="font-display text-xl mb-1">Desglose de Fees</h3>
              <p className="text-xs text-muted-foreground mb-3">Por tipo de ingreso</p>
              {feeBreakdown.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Sin fees registrados</div>
              ) : (
                <>
                  <div className="h-48">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={feeBreakdown} dataKey="value" nameKey="name" innerRadius={44} outerRadius={80} paddingAngle={3}>
                          {feeBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="hsl(var(--surface))" />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatUSD(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1 mt-1">
                    {feeBreakdown.map((d, i) => (
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

          {/* Capital Flow line chart */}
          <div className="rounded-lg border border-border bg-[hsl(var(--surface))] p-5">
            <h3 className="font-display text-xl mb-1">Flujo de Capital Mensual</h3>
            <p className="text-xs text-muted-foreground mb-4">Inversiones captadas por mes · {filterYear}</p>
            <div className="h-52">
              <ResponsiveContainer>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="goldArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatUSD(v, { decimals: 0 })} />
                  <Area type="monotone" dataKey="inversiones" name="Inversiones" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#goldArea)" dot={{ fill: "hsl(var(--primary))", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: LIBRO DE INGRESOS ────────────────────────────────────────────── */}
      {tab === "ingresos" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl">Libro de Ingresos</h2>
              <p className="text-sm text-muted-foreground">Fees cobrados por Propix · {filterYear}</p>
            </div>
            <button
              onClick={exportIngresos}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-gradient-gold text-primary-foreground text-sm font-medium hover:shadow-glow transition-shadow"
            >
              <Download className="h-3.5 w-3.5" /> Exportar CSV
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard label="Total ingresos" value={formatUSD(totalIngresos)} accent="gold" />
            <SummaryCard label="Fondeo fees" value={formatUSD(feeRows.filter((r) => r.tipo === "Fondeo fee").reduce((s, r) => s + r.monto, 0))} />
            <SummaryCard label="Admin fees" value={formatUSD(feeRows.filter((r) => r.tipo === "Admin fee").reduce((s, r) => s + r.monto, 0))} />
            <SummaryCard label="Listing fees" value={formatUSD(feeRows.filter((r) => r.tipo === "Listing fee").reduce((s, r) => s + r.monto, 0))} />
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border bg-[hsl(var(--surface))] overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/20">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Fecha</th>
                    <th className="text-left px-4 py-3 font-medium">Concepto</th>
                    <th className="text-left px-4 py-3 font-medium">Propiedad</th>
                    <th className="text-left px-4 py-3 font-medium">Inversor</th>
                    <th className="text-left px-4 py-3 font-medium">Tipo</th>
                    <th className="text-right px-4 py-3 font-medium">Monto (USD)</th>
                    <th className="text-left px-4 py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                  ) : filteredFeeRows.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No hay ingresos en el período seleccionado</td></tr>
                  ) : (
                    filteredFeeRows.map((r) => (
                      <tr key={r.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{r.date ? new Date(r.date).toLocaleDateString("es-DO") : "—"}</td>
                        <td className="px-4 py-3 truncate max-w-[160px]">{r.concepto}</td>
                        <td className="px-4 py-3 text-muted-foreground truncate max-w-[140px]">{r.propiedad}</td>
                        <td className="px-4 py-3 truncate max-w-[140px]">{r.inversor}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                            {r.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-success">+{formatUSD(r.monto)}</td>
                        <td className="px-4 py-3">
                          <StatusPill tone="success">{r.estado}</StatusPill>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredFeeRows.length > 0 && (
                  <tfoot className="border-t border-border bg-muted/10">
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-success">
                        +{formatUSD(filteredFeeRows.reduce((s, r) => s + r.monto, 0))}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: LIBRO DE EGRESOS ─────────────────────────────────────────────── */}
      {tab === "egresos" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl">Libro de Egresos</h2>
              <p className="text-sm text-muted-foreground">Distribuciones y retiros · {filterYear} · Retención ISRPF {ISRPF_RATE * 100}%</p>
            </div>
            <button
              onClick={exportEgresos}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-gradient-gold text-primary-foreground text-sm font-medium hover:shadow-glow transition-shadow"
            >
              <Download className="h-3.5 w-3.5" /> Exportar CSV
            </button>
          </div>

          {/* Alert ISRPF */}
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold text-amber-300">Retención ISRPF aplicada:</span>
              <span className="text-muted-foreground ml-1">
                {ISRPF_RATE * 100}% sobre dividendos de inversión inmobiliaria (Ley 179-09, Art. 308 Código Tributario RD).
                Total retenido en el período: <span className="font-mono text-amber-300">{formatUSD(totalRetenciones)}</span>
              </span>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard label="Total bruto egresado" value={formatUSD(totalDistribuciones + totalRetiros)} />
            <SummaryCard label="Distribuciones brutas" value={formatUSD(totalDistribuciones)} />
            <SummaryCard label="Retención ISRPF (10%)" value={formatUSD(totalRetenciones)} accent="amber" />
            <SummaryCard label="Retiros procesados" value={formatUSD(totalRetiros)} />
          </div>

          {/* Table */}
          <div className="rounded-lg border border-border bg-[hsl(var(--surface))] overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[780px]">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/20">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Fecha</th>
                    <th className="text-left px-4 py-3 font-medium">Concepto</th>
                    <th className="text-left px-4 py-3 font-medium">Beneficiario</th>
                    <th className="text-left px-4 py-3 font-medium">Tipo</th>
                    <th className="text-right px-4 py-3 font-medium">Bruto (USD)</th>
                    <th className="text-right px-4 py-3 font-medium">Retención ISRPF</th>
                    <th className="text-right px-4 py-3 font-medium">Neto (USD)</th>
                    <th className="text-left px-4 py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                  ) : filteredEgresoRows.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No hay egresos en el período seleccionado</td></tr>
                  ) : (
                    filteredEgresoRows.map((r) => (
                      <tr key={r.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{r.date ? new Date(r.date).toLocaleDateString("es-DO") : "—"}</td>
                        <td className="px-4 py-3 truncate max-w-[160px]">{r.concepto}</td>
                        <td className="px-4 py-3 truncate max-w-[140px]">{r.beneficiario}</td>
                        <td className="px-4 py-3">
                          <StatusPill tone={r.tipo === "Distribución" ? "teal" : "muted"}>{r.tipo}</StatusPill>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">−{formatUSD(r.bruto)}</td>
                        <td className="px-4 py-3 text-right font-mono text-amber-400">
                          {r.retencion > 0 ? `${formatUSD(r.retencion)}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold">
                          {formatUSD(r.neto)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill tone="success">{r.estado}</StatusPill>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredEgresoRows.length > 0 && (
                  <tfoot className="border-t-2 border-border bg-muted/10">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Totales</td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        −{formatUSD(filteredEgresoRows.reduce((s, r) => s + r.bruto, 0))}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-amber-400">
                        {formatUSD(filteredEgresoRows.reduce((s, r) => s + r.retencion, 0))}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        {formatUSD(filteredEgresoRows.reduce((s, r) => s + r.neto, 0))}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: REPORTES FISCALES DGII ──────────────────────────────────────── */}
      {tab === "fiscal" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl">Reportes Fiscales — DGII</h2>
              <p className="text-sm text-muted-foreground">República Dominicana · Período fiscal {filterYear}</p>
            </div>
            <button
              onClick={exportFiscal}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-gradient-gold text-primary-foreground text-sm font-medium hover:shadow-glow transition-shadow"
            >
              <Download className="h-3.5 w-3.5" /> Exportar declaración CSV
            </button>
          </div>

          {/* Legal info banner */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-sm">Marco Legal Aplicable — República Dominicana</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Retención ISRPF</p>
                <p className="font-mono text-primary">10%</p>
                <p className="text-xs text-muted-foreground">Ley 179-09, Art. 308 Código Tributario. Aplica sobre dividendos e intereses pagados a personas físicas.</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Obligación</p>
                <p className="font-mono text-foreground">Agente Retenedor</p>
                <p className="text-xs text-muted-foreground">Propix actúa como agente retenedor. Debe depositar retenciones a la DGII en los primeros 10 días de cada mes.</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Formulario DGII</p>
                <p className="font-mono text-foreground">IR-17</p>
                <p className="text-xs text-muted-foreground">Declaración jurada de retenciones del impuesto sobre la renta. Frecuencia: mensual.</p>
              </div>
            </div>
          </div>

          {/* KPI Resumen fiscal */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-border bg-[hsl(var(--surface))] p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Inversores con distribución</p>
              <p className="font-mono text-2xl font-semibold">{fiscalByInvestor.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-[hsl(var(--surface))] p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total distribuido (bruto)</p>
              <p className="font-mono text-2xl font-semibold">{formatUSD(totalDistribuciones)}</p>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-[10px] uppercase tracking-wider text-amber-400/80 mb-1">Total retenido ISRPF</p>
              <p className="font-mono text-2xl font-semibold text-amber-300">{formatUSD(totalRetenciones)}</p>
            </div>
            <div className="rounded-lg border border-border bg-[hsl(var(--surface))] p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Neto pagado a inversores</p>
              <p className="font-mono text-2xl font-semibold text-success">{formatUSD(totalDistribuciones - totalRetenciones)}</p>
            </div>
          </div>

          {/* Declaración por inversor */}
          <div className="rounded-lg border border-border bg-[hsl(var(--surface))] overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-xl">Declaración de Dividendos por Inversor</h3>
                <p className="text-xs text-muted-foreground">Para presentar al banco y la DGII · Formulario IR-17</p>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-primary border border-primary/30 rounded-full px-3 py-1">
                Período {filterYear}
              </span>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/20">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">#</th>
                    <th className="text-left px-4 py-3 font-medium">Inversor / Beneficiario</th>
                    <th className="text-right px-4 py-3 font-medium">Total distribuido (USD)</th>
                    <th className="text-right px-4 py-3 font-medium">Retención ISRPF 10%</th>
                    <th className="text-right px-4 py-3 font-medium">Neto pagado (USD)</th>
                    <th className="text-left px-4 py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {fiscalByInvestor.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No hay distribuciones registradas para el período seleccionado
                      </td>
                    </tr>
                  ) : (
                    fiscalByInvestor.map((inv, i) => (
                      <tr key={inv.name} className="border-t border-border hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</td>
                        <td className="px-4 py-3 font-medium">{inv.name}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatUSD(inv.distribuciones)}</td>
                        <td className="px-4 py-3 text-right font-mono text-amber-400">{formatUSD(inv.retencion)}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-success">{formatUSD(inv.neto)}</td>
                        <td className="px-4 py-3">
                          <StatusPill tone="teal">Reportado</StatusPill>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {fiscalByInvestor.length > 0 && (
                  <tfoot className="border-t-2 border-border bg-muted/10">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-xs font-bold uppercase tracking-wider">Totales del período</td>
                      <td className="px-4 py-3 text-right font-mono font-bold">{formatUSD(totalDistribuciones)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-amber-400">{formatUSD(totalRetenciones)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-success">{formatUSD(totalDistribuciones - totalRetenciones)}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
              </div>
            </div>
          </div>

          {/* Mensajes de acción */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-[hsl(var(--surface))] p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-sm">Próximos pasos — Retenciones</h4>
              </div>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>Exportar el CSV de esta declaración.</li>
                <li>Completar el formulario <span className="font-mono text-foreground">IR-17</span> en la Oficina Virtual DGII.</li>
                <li>Depositar las retenciones acumuladas a la cuenta de la DGII antes del día 10 del siguiente mes.</li>
                <li>Conservar el comprobante fiscal como soporte contable.</li>
              </ol>
            </div>
            <div className="rounded-lg border border-border bg-[hsl(var(--surface))] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Receipt className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-sm">Retenciones pendientes por mes</h4>
              </div>
              <div className="space-y-2">
                {MONTHS_ES.slice(0, new Date().getMonth() + 1).map((m, i) => {
                  const dist = txsInYear.filter(
                    (t) => t.type === "Distribución" && t.date && new Date(t.date).getMonth() === i
                  ).reduce((s, t) => s + (t.amount || 0), 0);
                  const ret = dist * ISRPF_RATE;
                  if (ret === 0) return null;
                  return (
                    <div key={m} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{m} {filterYear}</span>
                      <span className="font-mono text-amber-300">{formatUSD(ret)}</span>
                    </div>
                  );
                }).filter(Boolean)}
                {MONTHS_ES.slice(0, new Date().getMonth() + 1).every((_, i) => {
                  const dist = txsInYear.filter(
                    (t) => t.type === "Distribución" && t.date && new Date(t.date).getMonth() === i
                  ).reduce((s, t) => s + (t.amount || 0), 0);
                  return dist * ISRPF_RATE === 0;
                }) && (
                  <p className="text-sm text-muted-foreground text-center py-2">Sin retenciones pendientes</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small helper components ────────────────────────────────────────────────────
function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: "gold" | "amber" }) {
  return (
    <div className={cn(
      "rounded-lg border p-4",
      accent === "gold" && "border-primary/30 bg-primary/5",
      accent === "amber" && "border-amber-500/30 bg-amber-500/10",
      !accent && "border-border bg-[hsl(var(--surface))]"
    )}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className={cn("font-mono text-xl font-semibold", accent === "gold" && "text-primary", accent === "amber" && "text-amber-300")}>{value}</p>
    </div>
  );
}
