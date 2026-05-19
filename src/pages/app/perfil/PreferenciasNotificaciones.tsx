import { useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import { toast } from "sonner";

const groups = [
  {
    title: "Inversiones",
    items: [
      { id: "newProps", label: "Nuevas propiedades", desc: "Te avisamos cuando hay oportunidades" },
      { id: "fundingClose", label: "Fondeos por cerrar", desc: "Avisos cuando una propiedad casi se llena" },
      { id: "rent", label: "Distribuciones de renta", desc: "Cuando recibes un pago mensual" },
    ],
  },
  {
    title: "Cuenta",
    items: [
      { id: "kyc", label: "Estado de KYC", desc: "Cambios en tu verificación" },
      { id: "security", label: "Alertas de seguridad", desc: "Inicios de sesión sospechosos" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { id: "tips", label: "Tips y educación", desc: "Contenido sobre inversión inmobiliaria" },
      { id: "promos", label: "Promociones", desc: "Ofertas y novedades de Propix" },
    ],
  },
];

export default function PreferenciasNotificaciones() {
  const [state, setState] = useState<Record<string, { push: boolean; email: boolean }>>(() =>
    Object.fromEntries(groups.flatMap((g) => g.items.map((i) => [i.id, { push: true, email: i.id !== "promos" }])))
  );

  const save = () => toast.success("Preferencias guardadas");

  return (
    <div className="pb-10">
      <ScreenHeader title="Notificaciones" back showBell={false} />
      <div className="px-5 mt-2 space-y-5">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2 px-1">{g.title}</p>
            <div className="glass rounded-2xl divide-y divide-border">
              {g.items.map((it) => (
                <div key={it.id} className="p-4">
                  <p className="text-sm">{it.label}</p>
                  <p className="text-[11px] text-muted-foreground">{it.desc}</p>
                  <div className="flex gap-2 mt-3">
                    <Pill
                      active={state[it.id].push}
                      onClick={() => setState({ ...state, [it.id]: { ...state[it.id], push: !state[it.id].push } })}
                    >
                      Push
                    </Pill>
                    <Pill
                      active={state[it.id].email}
                      onClick={() => setState({ ...state, [it.id]: { ...state[it.id], email: !state[it.id].email } })}
                    >
                      Email
                    </Pill>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button onClick={save} className="w-full h-12 rounded-2xl bg-gradient-gold text-primary-foreground text-sm font-semibold shadow-gold">
          Guardar preferencias
        </button>
      </div>
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`h-7 px-3 rounded-full text-[11px] font-medium border transition-colors ${
        active ? "bg-secondary/15 text-secondary border-secondary/40" : "border-border text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}
