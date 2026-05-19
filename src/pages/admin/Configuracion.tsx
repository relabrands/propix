import { useState } from "react";
import { Save, Upload, FileText, Plus, Shield } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import StatusPill from "@/components/admin/StatusPill";
import { teamMembers, platformBankAccounts, auditLog } from "@/lib/adminMockData";

function Section({ title, description, children, action }: { title: string; description?: string; children: React.ReactNode; action?: React.ReactNode }) {
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

function FeeRow({ label, value, suffix = "%" }: { label: string; value: number; suffix?: string }) {
  const [v, setV] = useState(value);
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      <div className="flex-1 text-sm">{label}</div>
      <div className="relative">
        <input
          type="number"
          step="0.1"
          value={v}
          onChange={(e) => setV(Number(e.target.value))}
          className="w-24 h-9 rounded-md bg-background border border-border px-3 pr-7 text-sm font-mono text-right focus:outline-none focus:border-primary/50"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">{suffix}</span>
      </div>
    </div>
  );
}

export default function Configuracion() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Configuración"
        subtitle="Ajustes de plataforma, equipo y documentos legales"
        actions={
          <button className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-gradient-gold text-primary-foreground text-sm font-medium hover:shadow-glow transition-shadow">
            <Save className="h-4 w-4" /> Guardar cambios
          </button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Section title="Comisiones de plataforma" description="Modificaciones afectan nuevas operaciones">
          <FeeRow label="Listing fee (cobrado al desarrollador)" value={2.5} />
          <FeeRow label="Fondeo fee (cobrado al inversor)" value={2.0} />
          <FeeRow label="Admin fee (mensual sobre renta)" value={1.5} />
          <FeeRow label="Exit fee (al venderse la propiedad)" value={3.0} />
        </Section>

        <Section title="Reglas de inversión">
          <FeeRow label="Inversión mínima" value={2000} suffix="USD" />
          <FeeRow label="Inversión máxima por usuario" value={50000} suffix="USD" />
          <FeeRow label="Fracciones máximas por inversor" value={30} suffix="%" />
          <FeeRow label="Período de cooling off" value={48} suffix="hrs" />
        </Section>
      </div>

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

      <Section title="Documentos legales" description="Plantillas y políticas vigentes">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { name: "Términos y Condiciones", version: "v3.2", date: "15 mar 2026" },
            { name: "Política de Privacidad", version: "v2.1", date: "08 feb 2026" },
            { name: "Plantilla Acuerdo Inversor", version: "v4.0", date: "01 abr 2026" },
          ].map((doc) => (
            <div key={doc.name} className="rounded-md border border-border p-4 hover:border-border-strong transition-colors">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{doc.name}</div>
                  <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{doc.version} · {doc.date}</div>
                </div>
              </div>
              <button className="mt-3 w-full h-8 rounded border border-border text-xs hover:border-primary/50 hover:text-primary transition-colors inline-flex items-center justify-center gap-1.5">
                <Upload className="h-3.5 w-3.5" /> Actualizar
              </button>
            </div>
          ))}
        </div>
      </Section>

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
