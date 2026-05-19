import { DollarSign, Users, Building2, ArrowLeftRight, TrendingUp, Percent, Check, X } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";
import StatCard from "@/components/admin/StatCard";
import PageHeader from "@/components/admin/PageHeader";
import StatusPill from "@/components/admin/StatusPill";
import {
  adminKpis,
  capitalByMonth,
  distributionByProperty,
  newInvestorsWeekly,
  platformRevenueByMonth,
  adminTransactions,
  adminInvestors,
} from "@/lib/adminMockData";
import { formatUSD } from "@/lib/format";

const tooltipStyle = {
  background: "hsl(var(--surface-elevated))",
  border: "1px solid hsl(var(--border-strong))",
  borderRadius: 8,
  fontSize: 12,
  fontFamily: "JetBrains Mono",
};

export default function Dashboard() {
  const pendingKyc = adminInvestors.filter((i) => i.kycStatus === "Pendiente" || i.kycStatus === "En revisión").slice(0, 5);
  const recentTx = adminTransactions.slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard General" subtitle="Visión consolidada de la plataforma · Abril 2026" />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Capital total" value={formatUSD(adminKpis.totalCapital, { decimals: 0 })} change={adminKpis.capitalChange} icon={DollarSign} accent="gold" />
        <StatCard label="Inversores activos" value={adminKpis.activeInvestors.toString()} change={adminKpis.investorsChange} icon={Users} accent="teal" />
        <StatCard label="Propiedades activas" value={adminKpis.activeProperties.toString()} change={adminKpis.propertiesChange} icon={Building2} />
        <StatCard label="Tx este mes" value={adminKpis.monthlyTransactions.toString()} change={adminKpis.transactionsChange} icon={ArrowLeftRight} />
        <StatCard label="Ingresos plataforma" value={formatUSD(adminKpis.monthlyRevenue, { decimals: 0 })} change={adminKpis.revenueChange} icon={TrendingUp} accent="gold" />
        <StatCard label="Conversión" value={`${adminKpis.conversionRate}%`} change={adminKpis.conversionChange} icon={Percent} accent="teal" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 rounded-lg border border-border bg-[hsl(var(--surface))] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-xl">Capital total invertido</h3>
              <p className="text-xs text-muted-foreground">Últimos 12 meses · acumulado</p>
            </div>
            <div className="font-mono text-xs text-primary">+171% YoY</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={capitalByMonth}>
                <defs>
                  <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatUSD(v, { decimals: 0 })} />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: "hsl(var(--primary))", r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-lg border border-border bg-[hsl(var(--surface))] p-5">
          <h3 className="font-display text-xl mb-1">Distribución por propiedad</h3>
          <p className="text-xs text-muted-foreground mb-4">Capital recaudado</p>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={distributionByProperty} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  {distributionByProperty.map((d, i) => (
                    <Cell key={i} fill={d.color} stroke="hsl(var(--surface))" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatUSD(v, { decimals: 0 })} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 mt-2 max-h-24 overflow-y-auto">
            {distributionByProperty.slice(0, 4).map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-mono">{formatUSD(d.value, { decimals: 0 })}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-[hsl(var(--surface))] p-5">
          <h3 className="font-display text-xl mb-1">Nuevos inversores por semana</h3>
          <p className="text-xs text-muted-foreground mb-4">Últimas 8 semanas</p>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={newInvestorsWeekly}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
                <Bar dataKey="value" fill="hsl(var(--secondary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-[hsl(var(--surface))] p-5">
          <h3 className="font-display text-xl mb-1">Ingresos de la plataforma</h3>
          <p className="text-xs text-muted-foreground mb-4">Fees por categoría · últimos 6 meses</p>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={platformRevenueByMonth}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `$${v}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="listing" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                <Bar dataKey="fondeo" stackId="a" fill="hsl(var(--secondary))" />
                <Bar dataKey="admin" stackId="a" fill="hsl(38 60% 75%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-lg border border-border bg-[hsl(var(--surface))]">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-display text-xl">Transacciones recientes</h3>
            <a href="/admin/transacciones" className="text-xs text-primary hover:underline">Ver todas →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/20">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Inversor</th>
                  <th className="text-left px-4 py-2.5 font-medium">Propiedad</th>
                  <th className="text-right px-4 py-2.5 font-medium">Monto</th>
                  <th className="text-left px-4 py-2.5 font-medium">Tipo</th>
                  <th className="text-left px-4 py-2.5 font-medium">Estado</th>
                  <th className="text-right px-4 py-2.5 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentTx.map((tx) => (
                  <tr key={tx.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 truncate max-w-[140px]">{tx.investor}</td>
                    <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[120px]">{tx.property}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{formatUSD(tx.amount, { decimals: 0 })}</td>
                    <td className="px-4 py-2.5">
                      <StatusPill tone={tx.type === "Inversión" ? "gold" : tx.type === "Distribución" ? "teal" : tx.type === "Retiro" ? "muted" : "info"}>
                        {tx.type}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusPill tone={tx.status === "Completada" ? "success" : tx.status === "Pendiente" ? "warning" : tx.status === "Fallida" ? "danger" : "muted"}>
                        {tx.status}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">{tx.date.split(" ")[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-[hsl(var(--surface))]">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl">KYC pendientes</h3>
              <p className="text-xs text-muted-foreground">{pendingKyc.length} requieren acción</p>
            </div>
            <a href="/admin/kyc" className="text-xs text-primary hover:underline">Revisar →</a>
          </div>
          <div className="divide-y divide-border">
            {pendingKyc.map((inv) => (
              <div key={inv.id} className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-muted/40 border border-border flex items-center justify-center text-xs font-medium shrink-0">
                  {inv.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{inv.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{inv.email}</div>
                </div>
                <button className="h-7 w-7 rounded-md bg-success/10 text-success hover:bg-success/20 transition-colors flex items-center justify-center">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button className="h-7 w-7 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex items-center justify-center">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
