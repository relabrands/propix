import { useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import { ChevronDown, Mail, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";

const faqs = [
  { q: "¿Qué es la inversión fraccionada?", a: "Es la posibilidad de invertir en propiedades inmobiliarias por una fracción de su valor total, recibiendo una porción proporcional de las rentas y la apreciación." },
  { q: "¿Cuál es el monto mínimo de inversión?", a: "Puedes comenzar desde US$ 2,000 por fracción." },
  { q: "¿Cómo recibo mis rentas?", a: "Las distribuciones mensuales se acreditan automáticamente a tu balance dentro de Propix y puedes retirarlas a tu cuenta bancaria en cualquier momento." },
  { q: "¿Cuánto tarda un retiro?", a: "Los retiros a cuentas dominicanas se procesan en 1–2 días hábiles." },
  { q: "¿Es segura la plataforma?", a: "Sí. Cumplimos con la normativa local, hacemos KYC a todos los inversores y los activos están respaldados por contratos legales." },
];

export default function CentroAyuda() {
  const [open, setOpen] = useState<number | null>(0);
  const [msg, setMsg] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (msg.trim().length < 5) return toast.error("Cuéntanos un poco más");
    setMsg("");
    toast.success("Mensaje enviado, te contactamos pronto");
  };

  return (
    <div className="pb-10">
      <ScreenHeader title="Centro de ayuda" back showBell={false} />
      <div className="px-5 mt-2 space-y-5">
        <div className="grid grid-cols-3 gap-2">
          <Contact icon={MessageCircle} label="Chat" onClick={() => toast.success("Abriendo chat…")} />
          <Contact icon={Mail} label="Email" onClick={() => toast.success("soporte@propix.do")} />
          <Contact icon={Phone} label="Teléfono" onClick={() => toast.success("+1 809 200 1234")} />
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2 px-1">Preguntas frecuentes</p>
          <div className="glass rounded-2xl divide-y divide-border">
            {faqs.map((f, i) => (
              <button
                key={i}
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex-1 text-sm">{f.q}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open === i ? "rotate-180" : ""}`} />
                </div>
                {open === i && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{f.a}</p>}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="glass rounded-2xl p-5 space-y-3">
          <p className="font-display text-lg">¿No encuentras respuesta?</p>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={4}
            placeholder="Escribe tu consulta…"
            className="w-full rounded-xl bg-surface border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary/60 resize-none"
          />
          <button className="w-full h-11 rounded-xl bg-gradient-gold text-primary-foreground text-sm font-semibold shadow-gold">
            Enviar consulta
          </button>
        </form>
      </div>
    </div>
  );
}

function Contact({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="glass rounded-2xl p-4 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
    >
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-xs">{label}</span>
    </button>
  );
}
