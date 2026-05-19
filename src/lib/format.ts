export const formatUSD = (n: number, opts: { decimals?: number; sign?: boolean } = {}) => {
  const { decimals = 2, sign = false } = opts;
  const abs = Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const prefix = sign && n > 0 ? "+" : n < 0 ? "-" : "";
  return `${prefix}$${abs}`;
};

export const formatPct = (n: number, decimals = 1) =>
  `${n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`;

export const formatDateEs = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
};
