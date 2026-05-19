import { useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import {
  CheckCircle2, FileCheck2, IdCard, ScanFace, Upload, Receipt, FileSignature,
  Landmark, ShieldAlert, Clock,
} from "lucide-react";
import { toast } from "sonner";

type Status = "verified" | "pending" | "review";

interface Doc {
  id: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  status: Status;
  date: string;
  required?: boolean;
}

const initialDocs: Doc[] = [
  // Requeridos KYC RD
  { id: "cedula", label: "Cédula (frontal y reverso)", hint: "JCE — vigente y legible", icon: IdCard, status: "verified", date: "12 ene 2026", required: true },
  { id: "selfie", label: "Selfie con cédula", hint: "Validación biométrica con Veriff", icon: ScanFace, status: "verified", date: "12 ene 2026", required: true },
  { id: "address", label: "Comprobante de dirección", hint: "Factura EDE/CAASD/telefonía no mayor a 3 meses", icon: FileCheck2, status: "pending", date: "—", required: true },
  { id: "income", label: "Comprobante de ingresos", hint: "Carta de trabajo, últimos 3 estados de cuenta o IR-1/IR-2", icon: Receipt, status: "pending", date: "—", required: true },
  // Para inversiones grandes
  { id: "bank", label: "Certificación bancaria", hint: "Requerido para inversiones > US$10,000", icon: Landmark, status: "pending", date: "—" },
  { id: "rnc", label: "Constancia de RNC", hint: "Solo si invertirás como persona jurídica", icon: FileSignature, status: "pending", date: "—" },
  { id: "pep", label: "Declaración PEP / fuente de fondos", hint: "Origen lícito de los recursos (Ley 155-17)", icon: ShieldAlert, status: "review", date: "Subido 20 abr 2026" },
];

export default function DocumentosKYC() {
  const [docs, setDocs] = useState<Doc[]>(initialDocs);

  const handleUpload = (id: string) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, status: "review", date: "Subido hoy" } : d)));
    toast.success("Documento enviado a revisión");
  };

  const verifiedCount = docs.filter((d) => d.status === "verified").length;
  const requiredCount = docs.filter((d) => d.required).length;
  const requiredVerified = docs.filter((d) => d.required && d.status === "verified").length;
  const fullyVerified = requiredVerified === requiredCount;

  return (
    <div className="pb-10">
      <ScreenHeader title="Documentos KYC" back showBell={false} />
      <div className="px-5 mt-2 space-y-4">
        {/* Status header */}
        <div className="glass rounded-2xl p-5 flex items-center gap-3">
          <div className={`h-12 w-12 rounded-xl grid place-items-center ${fullyVerified ? "bg-secondary/15" : "bg-primary/15"}`}>
            {fullyVerified ? (
              <CheckCircle2 className="h-5 w-5 text-secondary" />
            ) : (
              <Clock className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-lg">
              {fullyVerified ? "Identidad verificada" : "Verificación en proceso"}
            </p>
            <p className="text-xs text-muted-foreground">
              {requiredVerified}/{requiredCount} documentos requeridos · cumplimiento Ley 155-17 (UAF) y SIB.
            </p>
          </div>
          <span className="font-mono text-sm text-primary">{verifiedCount}/{docs.length}</span>
        </div>

        {/* Required docs */}
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground px-1">Documentos requeridos</p>
        <div className="glass rounded-2xl divide-y divide-border">
          {docs.filter((d) => d.required).map((d) => (
            <DocRow key={d.id} doc={d} onUpload={() => handleUpload(d.id)} />
          ))}
        </div>

        {/* Optional docs */}
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground px-1 pt-2">
          Documentos adicionales
        </p>
        <div className="glass rounded-2xl divide-y divide-border">
          {docs.filter((d) => !d.required).map((d) => (
            <DocRow key={d.id} doc={d} onUpload={() => handleUpload(d.id)} />
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          Tus documentos están cifrados de extremo a extremo y se usan únicamente para cumplimiento regulatorio
          (Ley 155-17 contra el lavado de activos y normativa SIB de la República Dominicana).
        </p>
      </div>
    </div>
  );
}

function DocRow({ doc, onUpload }: { doc: Doc; onUpload: () => void }) {
  return (
    <div className="p-4 flex items-start gap-3">
      <doc.icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm">{doc.label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{doc.hint}</p>
        <p className="text-[10px] text-muted-foreground mt-1 font-mono">{doc.date}</p>
      </div>
      <div className="flex-shrink-0">
        {doc.status === "verified" && (
          <span className="text-[10px] text-secondary bg-secondary/15 px-2 py-1 rounded-full">Verificado</span>
        )}
        {doc.status === "review" && (
          <span className="text-[10px] text-primary bg-primary/15 px-2 py-1 rounded-full">En revisión</span>
        )}
        {doc.status === "pending" && (
          <button
            onClick={onUpload}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:opacity-80"
          >
            <Upload className="h-3.5 w-3.5" /> Subir
          </button>
        )}
      </div>
    </div>
  );
}
