import { useState, useEffect } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import EmptyState from "@/components/EmptyState";
import { formatPct, formatUSD } from "@/lib/format";
import { ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart, Line } from "recharts";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { collection, onSnapshot, query as fsQuery, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

import type { Property } from "@/lib/mockData";

interface Investment {
  id: string;
  userId: string;
  propertyId: string;
  propertyName: string;
  propertyImage: string;
  location: string;
  fractionsCount: number;
  investedAmount: number;
  monthlyIncomeEstimate: number;
  roiAnnual: number;
  date: string;
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

const ranges = ["3M", "6M", "1A"] as const;

export default function Portafolio() {
  const currentUser = useAppStore((s) => s.user);
  const [range, setRange] = useState<typeof ranges[number]>("6M");

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Subscribe to properties to get latest statuses and info
    const unsubscribeProps = onSnapshot(collection(db, "properties"), (snapshot) => {
      setProperties(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as unknown as Property[]);
    });

    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    // 2. Subscribe to user investments
    const qInv = fsQuery(collection(db, "investments"), where("userId", "==", currentUser.uid));
    const unsubscribeInv = onSnapshot(qInv, (snapshot) => {
      setInvestments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as unknown as Investment[]);
    });

    // 3. Subscribe to user transactions
    const qTx = fsQuery(collection(db, "transactions"), where("userId", "==", currentUser.uid));
    const unsubscribeTx = onSnapshot(qTx, (snapshot) => {
      setTransactions(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as unknown as Transaction[]);
      setLoading(false);
    });

    return () => {
      unsubscribeProps();
      unsubscribeInv();
      unsubscribeTx();
    };
  }, [currentUser?.uid]);

  // Aggregate stats from real investments
  const totalInvested = investments.reduce((sum, inv) => sum + (inv.investedAmount || 0), 0);
  const monthlyIncome = investments.reduce((sum, inv) => {
    const prop = properties.find((p) => p.id === inv.propertyId);
    if (prop && prop.roiAnnual) {
      return sum + ((inv.investedAmount || 0) * (prop.roiAnnual / 100)) / 12;
    }
    return sum + (inv.monthlyIncomeEstimate || 0);
  }, 0);
  const roiAnnual = totalInvested > 0 ? ((monthlyIncome * 12) / totalInvested) * 100 : 0;

  const distributions = transactions.filter(
    (t) => t.type === "Distribución" && t.status === "Completada"
  );

  const totalEarned = distributions.reduce((sum, t) => sum + (t.amount || 0), 0);

  // Group distributions for chart
  let chartData: { month: string; value: number }[] = [];
  if (distributions.length > 0) {
    const sorted = [...distributions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const grouped: { [key: string]: number } = {};
    sorted.forEach((t) => {
      const d = new Date(t.date);
      const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const key = `${monthNames[d.getMonth()]}`;
      grouped[key] = (grouped[key] || 0) + t.amount;
    });
    chartData = Object.entries(grouped).map(([month, value]) => ({ month, value }));
  } else {
    // Fallback/projection chart if no distributions paid yet (12 months forward)
    const d = new Date();
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    chartData = Array.from({ length: 12 }).map((_, i) => ({
      month: monthNames[(d.getMonth() + i + 1) % 12], // Next 12 months
      value: monthlyIncome,
    }));
  }

  const isProjection = distributions.length === 0;

  // Handle range slice
  let filteredChartData = chartData;
  if (range === "3M") {
    filteredChartData = isProjection ? chartData.slice(0, 3) : chartData.slice(-3);
  } else if (range === "6M") {
    filteredChartData = isProjection ? chartData.slice(0, 6) : chartData.slice(-6);
  } else if (range === "1A") {
    filteredChartData = isProjection ? chartData.slice(0, 12) : chartData.slice(-12);
  }

  return (
    <div className="pb-4">
      <ScreenHeader title="Mi Portafolio" subtitle="Resumen y rendimiento" />

      <div className="px-5 space-y-5">
        {/* Summary */}
        <div className="glass-strong rounded-3xl p-6 grain-overlay relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total invertido</p>
          <p className="font-display text-5xl mt-2">{formatUSD(totalInvested, { decimals: 0 })}</p>
          <div className="grid grid-cols-3 gap-2 mt-5 pt-5 border-t border-border">
            <SmallStat label="Ganado" value={formatUSD(totalEarned)} accent="success" />
            <SmallStat label="ROI" value={formatPct(roiAnnual)} accent="teal" />
            <SmallStat label="Mes" value={`+${formatUSD(monthlyIncome)}`} accent="success" />
          </div>
        </div>

        {/* Chart */}
        {filteredChartData.length > 0 && (
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground">{isProjection ? `Proyecciones de ganancias (${range})` : `Ganancias (${range})`}</p>
                <p className="font-mono text-lg">+{formatUSD(filteredChartData.reduce((s, d) => s + d.value, 0))}</p>
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
                <AreaChart data={filteredChartData} margin={{ top: 10, right: 6, bottom: 0, left: -20 }}>
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
          {investments.length > 0 ? (
            <div className="space-y-3">
              {investments.map((inv) => {
                const p = properties.find((pr) => pr.id === inv.propertyId);
                const name = p?.name || inv.propertyName;
                const image = p?.image || inv.propertyImage;
                const status = p?.status || "rentando";
                return (
                  <Link
                    key={inv.id}
                    to={`/app/propiedad/${inv.propertyId}`}
                    className="block glass rounded-2xl p-3 flex items-center gap-3 active:scale-[0.99] transition"
                  >
                    <img src={image} alt={name} className="h-16 w-16 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {inv.fractionsCount} fracc. · {formatUSD(inv.investedAmount, { decimals: 0 })}
                      </p>
                      <span className="inline-block mt-1.5 text-[10px] text-secondary bg-secondary/15 px-2 py-0.5 rounded-full capitalize">
                        {status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm text-success">+{formatUSD(inv.monthlyIncomeEstimate)}</p>
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
        {distributions.length > 0 ? (
          <section>
            <h2 className="font-display text-2xl mb-3">Historial de ganancias</h2>
            <div className="glass rounded-2xl divide-y divide-border">
              {distributions.slice().reverse().map((e, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-success/15 grid place-items-center">
                      <ArrowUpRight className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Distribución - {e.property}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {e.date ? new Date(e.date).toLocaleDateString() : ""} · {e.status}
                      </p>
                    </div>
                  </div>
                  <p className="font-mono text-sm text-success">+{formatUSD(e.amount)}</p>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section>
            <h2 className="font-display text-2xl mb-3">Historial de ganancias</h2>
            <EmptyState subtitle="Tus distribuciones mensuales de alquiler aparecerán listadas aquí." />
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
