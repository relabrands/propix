import ScreenHeader from "@/components/ScreenHeader";
import { ExternalLink, FileText, Shield } from "lucide-react";

const docs = [
  { icon: FileText, title: "Términos y condiciones", desc: "Reglas de uso de la plataforma Propix." },
  { icon: Shield, title: "Política de privacidad", desc: "Cómo tratamos tus datos personales." },
  { icon: FileText, title: "Política AML / KYC", desc: "Cumplimiento contra lavado de activos." },
  { icon: FileText, title: "Acuerdo del inversor", desc: "Marco contractual de cada inversión." },
];

export default function Terminos() {
  return (
    <div className="pb-10">
      <ScreenHeader title="Términos y privacidad" back showBell={false} />
      <div className="px-5 mt-2 space-y-3">
        {docs.map((d) => (
          <button
            key={d.title}
            className="w-full glass rounded-2xl p-4 flex items-center gap-3 text-left active:bg-surface/40 transition-colors"
          >
            <d.icon className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm">{d.title}</p>
              <p className="text-[11px] text-muted-foreground">{d.desc}</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
        <p className="text-[11px] text-muted-foreground text-center pt-3">
          Propix · v1.0.0 · Regulado en República Dominicana
        </p>
      </div>
    </div>
  );
}
