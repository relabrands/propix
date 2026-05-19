import { useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import EmptyState from "@/components/EmptyState";
import { earningsHistory, myInvestments, portfolioStats, properties } from "@/lib/mockData";
import { formatPct, formatUSD } from "@/lib/format";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const ranges = ["3M", "6M", "1A"] as const;

export default function Portafolio() {
  const [range, setRange] = useState<typeof ranges[number]>("6M");
  const data =
    range === "3M" ? earningsHistory.slice(-3) : range === "6M" ? earningsHistory.slice(-6) : earningsHistory;

  return (
    <div className="pb-4">
      <ScreenHeader title="Mi Portafolio" subtitle="Resumen y rendimiento" />

      <div className="px-5 space-y-5">
        {/* Summary */}
        <div className="glass-strong rounded-3xl p-6 grain-overlay relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total invertido</p>
          <p className="font-display text-5xl mt-2">{formatUSD(portfolioStats.totalInvested, { decimals: 0 })}</p>
          <div className="grid grid-cols-3 gap-2 mt-5 pt-5 border-t border-border">
            <SmallStat label="Ganado" value={formatUSD(portfolioStats.totalEarned)} accent="success" />
            <SmallStat label="ROI" value={formatPct(portfolioStats.roiAnnual)} accent="teal" />
            <SmallStat label="Mes" value={`+${formatUSD(portfolioStats.monthlyIncome)}`} accent="success" />
          </div>
        </div>

        {/* Chart */}
        {data.length > 0 && (
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground">Ganancias mensuales</p>
                <p className="font-mono text-lg">+{formatUSD(data.reduce((s, d) => s + d.value, 0))}</p>
              </div>
              <div className="flex gap-1 p-1 rounded-full glass">
                {ranges.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`h-7 px-3 text-[11px] rounded-full transition-all ${
                      range === r ? "bg-gradient-gold text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 6, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(38 60% 55%)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(38 60% 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "hsl(220 9% 65%)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fill: "hsl(220 9% 65%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(222 39% 13%)",
                      border: "1px solid hsl(38 46% 61% / 0.25)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "hsl(220 9% 65%)" }}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, "Ganancia"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(38 60% 60%)"
                    strokeWidth={2.5}
                    fill="url(#goldGrad)"
                  />
                  <Line type="monotone" dataKey="value" stroke="hsl(38 70% 70%)" strokeWidth={0} dot={{ r: 3, fill: "hsl(38 60% 60%)" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Investments */}
        <section>
          <h2 className="font-display text-2xl mb-3">Mis inversiones</h2>
          {myInvestments.length > 0 ? (
            <div className="space-y-3">
              {myInvestments.map((inv) => {
                const p = properties.find((pr) => pr.id === inv.propertyId);
                if (!p) return null;
                return (
                  <Link
                    key={inv.propertyId}
                    to={`/app/propiedad/${p.id}`}
                    className="block glass rounded-2xl p-3 flex items-center gap-3 active:scale-[0.99] transition"
                  >
                    <img src={p.image} alt={p.name} className="h-16 w-16 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {inv.fractions} fracc. · {formatUSD(inv.invested, { decimals: 0 })}
                      </p>
                      <span className="inline-block mt-1.5 text-[10px] text-secondary bg-secondary/15 px-2 py-0.5 rounded-full">
                        {inv.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm text-success">+{formatUSD(inv.monthlyIncome)}</p>
                      <p className="text-[10px] text-muted-foreground">/ mes</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState subtitle="Cuando inviertas en una propiedad aparecerá aquí." />
          )}
        </section>

        {/* Earnings history */}
        {earningsHistory.length > 0 && (
          <section>
            <h2 className="font-display text-2xl mb-3">Historial de ganancias</h2>
            <div className="glass rounded-2xl divide-y divide-border">
              {earningsHistory.slice().reverse().map((e, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-success/15 grid place-items-center">
                      <ArrowUpRight className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Renta {e.month} 2026</p>
                      <p className="text-[11px] text-muted-foreground">{portfolioStats.propertiesCount} propiedades · Pagado</p>
                    </div>
                  </div>
                  <p className="font-mono text-sm text-success">+{formatUSD(e.value)}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function SmallStat({ label, value, accent }: { label: string; value: string; accent: "success" | "teal" }) {
  const color = accent === "success" ? "text-success" : "text-secondary";
  return (
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`font-mono text-sm mt-1 ${color}`}>{value}</p>
    </div>
  );
}
