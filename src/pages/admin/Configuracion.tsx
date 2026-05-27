import { useState, useEffect } from "react";
import { Save, Upload, FileText, Plus, Shield, Loader2 } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import StatusPill from "@/components/admin/StatusPill";
import { teamMembers, platformBankAccounts, auditLog } from "@/lib/adminMockData";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

// ─── Reusable editable fee row ────────────────────────────────────────────────
function FeeRow({
  label,
  description,
  value,
  onChange,
  suffix = "%",
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      <div className="flex-1">
        <p className="text-sm">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="relative">
        <input
          type="number"
          step="0.1"
          min="0"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 h-9 rounded-md bg-background border border-border px-3 pr-7 text-sm font-mono text-right focus:outline-none focus:border-primary/50"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">{suffix}</span>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-[hsl(var(--surface))] overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-xl">{title}</h3>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function Configuracion() {
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Platform commissions (3 real business commissions)
  const [upfrontFee, setUpfrontFee] = useState(2.0);       // % of investment (paid upfront)
  const [managementFee, setManagementFee] = useState(5.0); // % of monthly rent
  const [successFee, setSuccessFee] = useState(15.0);      // % of net capital gain at exit

  // Investment rules
  const [minInvestment, setMinInvestment] = useState(2000);
  const [maxInvestment, setMaxInvestment] = useState(50000);
  const [maxFractionsPct, setMaxFractionsPct] = useState(30);
  const [coolingOffHrs, setCoolingOffHrs] = useState(48);

  // Load from Firestore on mount
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "config", "platformFees"));
        if (snap.exists()) {
          const d = snap.data();
          if (d.upfrontFee !== undefined) setUpfrontFee(d.upfrontFee);
          if (d.managementFee !== undefined) setManagementFee(d.managementFee);
          if (d.successFee !== undefined) setSuccessFee(d.successFee);
          if (d.minInvestment !== undefined) setMinInvestment(d.minInvestment);
          if (d.maxInvestment !== undefined) setMaxInvestment(d.maxInvestment);
          if (d.maxFractionsPct !== undefined) setMaxFractionsPct(d.maxFractionsPct);
          if (d.coolingOffHrs !== undefined) setCoolingOffHrs(d.coolingOffHrs);
        }
      } catch {
        // silent fail — defaults remain
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(
        doc(db, "config", "platformFees"),
        {
          upfrontFee,
          managementFee,
          successFee,
          minInvestment,
          maxInvestment,
          maxFractionsPct,
          coolingOffHrs,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      toast.success("Configuración guardada correctamente.");
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando configuración...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Configuración"
        subtitle="Ajustes de plataforma, equipo y documentos legales"
        actions={
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-gradient-gold text-primary-foreground text-sm font-medium hover:shadow-glow transition-shadow disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Section
          title="Comisiones de plataforma"
          description="Modificaciones afectan nuevas operaciones. Los porcentajes aquí configurados se aplican globalmente."
        >
          {/* Comisión 1 */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold shrink-0">1</div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Comisión de Inversión (Upfront Fee)</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Se cobra una sola vez al momento de invertir, sobre el monto total de la inversión. Ej: inversión de $10,000 → comisión de ${(10000 * upfrontFee / 100).toFixed(0)}.</p>
              </div>
            </div>
            <FeeRow
              label="Upfront Fee"
              description="% del monto de inversión · cobrado al confirmar"
              value={upfrontFee}
              onChange={setUpfrontFee}
            />
          </div>

          {/* Comisión 2 */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/5 border border-secondary/20">
              <div className="h-8 w-8 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-sm font-bold shrink-0">2</div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Comisión de Gestión (Management Fee)</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Se cobra mensualmente sobre la renta bruta generada por la propiedad. Ej: renta de $1,000/mes → comisión de ${(1000 * managementFee / 100).toFixed(0)}/mes. El inversor recibe el resto.</p>
              </div>
            </div>
            <FeeRow
              label="Management Fee"
              description="% de la renta mensual bruta · cobrado cada mes"
              value={managementFee}
              onChange={setManagementFee}
            />
          </div>

          {/* Comisión 3 */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <div className="h-8 w-8 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center text-sm font-bold shrink-0">3</div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Comisión de Éxito (Success Fee / Carried Interest)</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Se cobra una única vez al momento del Exit (~3 años), sobre la plusvalía neta. Ej: propiedad comprada en $100,000 y vendida en $150,000 → sobre $50,000 de ganancia, Propix retiene ${(50000 * successFee / 100).toFixed(0)} y distribuye el resto.</p>
              </div>
            </div>
            <FeeRow
              label="Success Fee"
              description="% de la plusvalía neta al momento del Exit · única vez"
              value={successFee}
              onChange={setSuccessFee}
            />
          </div>
        </Section>

        {/* ── Investment rules ───────────────────────────────────────────── */}
        <Section title="Reglas de inversión">
          <FeeRow label="Inversión mínima" value={minInvestment} onChange={setMinInvestment} suffix="USD" />
          <FeeRow label="Inversión máxima por usuario" value={maxInvestment} onChange={setMaxInvestment} suffix="USD" />
          <FeeRow label="Fracciones máximas por inversor" value={maxFractionsPct} onChange={setMaxFractionsPct} suffix="%" />
          <FeeRow label="Período de cooling off" value={coolingOffHrs} onChange={setCoolingOffHrs} suffix="hrs" />
        </Section>
      </div>

      {/* ── Bank accounts ────────────────────────────────────────────────── */}
      <Section
        title="Cuentas bancarias de la plataforma"
        description="Cuentas para recibir transferencias de inversores"
        action={
          <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border text-xs hover:border-border-strong">
            <Plus className="h-3.5 w-3.5" /> Agregar cuenta
          </button>
        }
      >
        <div className="space-y-2">
          {platformBankAccounts.map((b) => (
            <div key={b.id} className="flex items-center gap-4 px-3 py-2.5 rounded-md border border-border hover:border-border-strong transition-colors">
              <div className="h-9 w-9 rounded bg-muted/40 flex items-center justify-center text-xs font-semibold uppercase">
                {b.bank.slice(0, 3)}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{b.bank}</div>
                <div className="text-[11px] text-muted-foreground">{b.type}</div>
              </div>
              <div className="font-mono text-sm">{b.account}</div>
              {b.verified && <StatusPill tone="success">Verificada</StatusPill>}
            </div>
          ))}
        </div>
      </Section>

      {/* ── Legal documents ───────────────────────────────────────────────── */}
      <Section title="Documentos legales" description="Plantillas y políticas vigentes">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { name: "Términos y Condiciones", version: "v3.2", date: "15 mar 2026" },
            { name: "Política de Privacidad", version: "v2.1", date: "08 feb 2026" },
            { name: "Plantilla Acuerdo Inversor", version: "v4.0", date: "01 abr 2026" },
          ].map((document) => (
            <div key={document.name} className="rounded-md border border-border p-4 hover:border-border-strong transition-colors">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{document.name}</div>
                  <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    {document.version} · {document.date}
                  </div>
                </div>
              </div>
              <button className="mt-3 w-full h-8 rounded border border-border text-xs hover:border-primary/50 hover:text-primary transition-colors inline-flex items-center justify-center gap-1.5">
                <Upload className="h-3.5 w-3.5" /> Actualizar
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Admin team ────────────────────────────────────────────────────── */}
      <Section
        title="Equipo administrativo"
        description="Usuarios con acceso al panel"
        action={
          <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border text-xs hover:border-border-strong">
            <Plus className="h-3.5 w-3.5" /> Invitar admin
          </button>
        }
      >
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border">
              <th className="text-left py-2 font-medium">Usuario</th>
              <th className="text-left py-2 font-medium">Rol</th>
              <th className="text-right py-2 font-medium">Última actividad</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-gold/30 border border-primary/30 flex items-center justify-center text-xs font-medium">
                      {m.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <div className="text-sm">{m.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{m.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <StatusPill tone={m.role === "Super Admin" ? "gold" : m.role === "Operations" ? "teal" : m.role === "Finance" ? "info" : "muted"}>
                    <Shield className="h-2.5 w-2.5" /> {m.role}
                  </StatusPill>
                </td>
                <td className="text-right font-mono text-xs text-muted-foreground">{m.lastActive}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* ── Audit log ─────────────────────────────────────────────────────── */}
      <Section title="Audit log" description="Acciones administrativas recientes">
        <div className="space-y-1">
          {auditLog.map((l) => (
            <div key={l.id} className="grid grid-cols-12 gap-3 py-2 px-3 rounded hover:bg-muted/30 transition-colors text-sm">
              <div className="col-span-3 font-mono text-xs text-muted-foreground">{l.time}</div>
              <div className="col-span-3 text-xs font-mono">{l.user}</div>
              <div className="col-span-3 text-xs">{l.action}</div>
              <div className="col-span-3 text-xs text-muted-foreground truncate">{l.target}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
