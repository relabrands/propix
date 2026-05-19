import { useState } from "react";
import { Send, Mail, Smartphone, Calendar, Users } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { emailCampaigns } from "@/lib/adminMockData";

export default function Marketing() {
  const [pushTitle, setPushTitle] = useState("Nueva propiedad disponible");
  const [pushBody, setPushBody] = useState("Torre Cocotal Premium · 19.8% ROI anual. Invierte desde $2,000.");
  const [audience, setAudience] = useState("Todos");

  return (
    <div className="space-y-5">
      <PageHeader title="Marketing" subtitle="Campañas y notificaciones" />

      {/* Push composer + preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-lg border border-border bg-[hsl(var(--surface))] p-5 space-y-4">
          <div>
            <h3 className="font-display text-xl">Enviar push notification</h3>
            <p className="text-xs text-muted-foreground">Notificación instantánea al app de inversores</p>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Título</label>
            <input
              value={pushTitle}
              onChange={(e) => setPushTitle(e.target.value)}
              className="mt-1.5 w-full h-10 rounded-md bg-background border border-border px-3 text-sm focus:outline-none focus:border-primary/50"
              maxLength={60}
            />
            <div className="text-[10px] text-muted-foreground text-right mt-1">{pushTitle.length}/60</div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Cuerpo</label>
            <textarea
              value={pushBody}
              onChange={(e) => setPushBody(e.target.value)}
              rows={3}
              className="mt-1.5 w-full rounded-md bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary/50 resize-none"
              maxLength={140}
            />
            <div className="text-[10px] text-muted-foreground text-right mt-1">{pushBody.length}/140</div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Users className="h-3 w-3" /> Audiencia</label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {["Todos", "Inversores activos", "Pendientes KYC", "Por propiedad"].map((a) => (
                <button
                  key={a}
                  onClick={() => setAudience(a)}
                  className={`h-8 px-3 rounded-md border text-xs transition-colors ${audience === a ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground"}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <button className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border text-sm hover:border-border-strong">
              <Calendar className="h-4 w-4" /> Programar envío
            </button>
            <button className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-gradient-gold text-primary-foreground text-sm font-medium hover:shadow-glow transition-shadow">
              <Send className="h-4 w-4" /> Enviar ahora
            </button>
          </div>
        </div>

        {/* Phone preview */}
        <div className="rounded-lg border border-border bg-[hsl(var(--surface))] p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
            <Smartphone className="h-3 w-3" /> Vista previa
          </div>
          <div className="mx-auto w-[220px] aspect-[9/19] rounded-[2rem] border-4 border-muted bg-gradient-to-b from-background to-[hsl(var(--surface))] p-3 flex flex-col">
            <div className="text-center text-[10px] text-muted-foreground font-mono mb-3">9:41</div>
            <div className="rounded-xl glass p-3 space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded bg-gradient-gold flex items-center justify-center text-[10px] text-primary-foreground font-bold">F</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Propix</div>
                <div className="text-[10px] text-muted-foreground ml-auto">ahora</div>
              </div>
              <div className="text-xs font-semibold leading-tight line-clamp-2">{pushTitle}</div>
              <div className="text-[11px] text-muted-foreground line-clamp-3 leading-snug">{pushBody}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Email campaigns */}
      <div className="rounded-lg border border-border bg-[hsl(var(--surface))] overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl">Campañas de email</h3>
            <p className="text-xs text-muted-foreground">Historial de envíos</p>
          </div>
          <button className="inline-flex items-center gap-2 h-8 px-3 rounded-md border border-border text-xs hover:border-border-strong">
            <Mail className="h-3.5 w-3.5" /> Nueva campaña
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/20">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Asunto</th>
              <th className="text-right px-4 py-3 font-medium">Enviados</th>
              <th className="text-right px-4 py-3 font-medium">Abiertos</th>
              <th className="text-right px-4 py-3 font-medium">Clicks</th>
              <th className="text-right px-4 py-3 font-medium">Open rate</th>
              <th className="text-right px-4 py-3 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {emailCampaigns.map((c) => {
              const rate = ((c.opened / c.sent) * 100).toFixed(1);
              return (
                <tr key={c.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">{c.subject}</td>
                  <td className="px-4 py-3 text-right font-mono">{c.sent}</td>
                  <td className="px-4 py-3 text-right font-mono">{c.opened}</td>
                  <td className="px-4 py-3 text-right font-mono">{c.clicked}</td>
                  <td className="px-4 py-3 text-right font-mono text-secondary">{rate}%</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">{c.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
