import { useState, useEffect } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import {
  CheckCircle2, FileCheck2, IdCard, ScanFace, Upload, Receipt, FileSignature,
  Landmark, ShieldAlert, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

export default function DocumentosKYC() {
  const currentUser = useAppStore((s) => s.user);
  const kycStatus = currentUser?.kycStatus || "pending";

  const [cedulaUploaded, setCedulaUploaded] = useState(false);
  const [selfieUploaded, setSelfieUploaded] = useState(false);
  const [addressUploaded, setAddressUploaded] = useState(false);
  const [incomeUploaded, setIncomeUploaded] = useState(false);
  const [bankUploaded, setBankUploaded] = useState(false);
  const [rncUploaded, setRncUploaded] = useState(false);
  const [pepUploaded, setPepUploaded] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setCedulaUploaded(!!currentUser.cedulaUploaded || kycStatus !== "pending");
      setSelfieUploaded(!!currentUser.selfieUploaded || kycStatus !== "pending");
      setAddressUploaded(!!currentUser.addressUploaded);
      setIncomeUploaded(!!currentUser.incomeUploaded);
      setBankUploaded(!!currentUser.bankUploaded);
      setRncUploaded(!!currentUser.rncUploaded);
      setPepUploaded(!!currentUser.pepUploaded);
    }
  }, [currentUser, kycStatus]);

  const getRequiredDocStatus = (uploaded: boolean) => {
    if (kycStatus === "verified") return "verified";
    if (kycStatus === "submitted") return "review";
    return uploaded ? "review" : "pending";
  };

  const getRequiredDocDate = (uploaded: boolean) => {
    if (kycStatus === "verified") return "Verificado";
    if (kycStatus === "submitted") return "Subido en registro";
    return uploaded ? "Subido hoy" : "—";
  };

  const docs: Doc[] = [
    {
      id: "cedula",
      label: "Cédula (frontal y reverso)",
      hint: "JCE — vigente y legible",
      icon: IdCard,
      status: getRequiredDocStatus(cedulaUploaded),
      date: getRequiredDocDate(cedulaUploaded),
      required: true
    },
    {
      id: "selfie",
      label: "Selfie con cédula",
      hint: "Validación biométrica con Veriff",
      icon: ScanFace,
      status: getRequiredDocStatus(selfieUploaded),
      date: getRequiredDocDate(selfieUploaded),
      required: true
    },
    {
      id: "address",
      label: "Comprobante de dirección",
      hint: "Factura EDE/CAASD/telefonía no mayor a 3 meses",
      icon: FileCheck2,
      status: kycStatus === "verified" ? "verified" : addressUploaded ? "review" : "pending",
      date: addressUploaded ? "Subido hoy" : "—",
      required: true
    },
    {
      id: "income",
      label: "Comprobante de ingresos",
      hint: "Carta de trabajo, últimos 3 estados de cuenta o IR-1/IR-2",
      icon: Receipt,
      status: kycStatus === "verified" ? "verified" : incomeUploaded ? "review" : "pending",
      date: incomeUploaded ? "Subido hoy" : "—",
      required: true
    },
    { 
      id: "bank", 
      label: "Certificación bancaria", 
      hint: "Requerido para inversiones > US$10,000", 
      icon: Landmark, 
      status: kycStatus === "verified" ? "verified" : bankUploaded ? "review" : "pending", 
      date: bankUploaded ? "Subido hoy" : "—" 
    },
    { 
      id: "rnc", 
      label: "Constancia de RNC", 
      hint: "Solo si invertirás como persona jurídica", 
      icon: FileSignature, 
      status: kycStatus === "verified" ? "verified" : rncUploaded ? "review" : "pending", 
      date: rncUploaded ? "Subido hoy" : "—" 
    },
    { 
      id: "pep", 
      label: "Declaración PEP / fuente de fondos", 
      hint: "Origen lícito de los recursos (Ley 155-17)", 
      icon: ShieldAlert, 
      status: kycStatus === "verified" ? "verified" : pepUploaded ? "review" : "pending", 
      date: pepUploaded ? "Subido hoy" : "—" 
    },
  ];

  const handleUpload = async (id: string) => {
    if (!currentUser?.uid) {
      toast.error("Sesión inválida");
      return;
    }

    let updates: any = {};
    if (id === "cedula") {
      updates.cedulaUploaded = true;
      setCedulaUploaded(true);
      toast.success("Cédula subida con éxito.");
    } else if (id === "selfie") {
      updates.selfieUploaded = true;
      setSelfieUploaded(true);
      toast.success("Selfie subida con éxito.");
    } else if (id === "address") {
      updates.addressUploaded = true;
      setAddressUploaded(true);
      toast.success("Comprobante de dirección subido con éxito.");
    } else if (id === "income") {
      updates.incomeUploaded = true;
      setIncomeUploaded(true);
      toast.success("Comprobante de ingresos subido con éxito.");
    } else if (id === "bank") {
      updates.bankUploaded = true;
      setBankUploaded(true);
      toast.success("Certificación bancaria subida con éxito.");
    } else if (id === "rnc") {
      updates.rncUploaded = true;
      setRncUploaded(true);
      toast.success("Constancia de RNC subida con éxito.");
    } else if (id === "pep") {
      updates.pepUploaded = true;
      setPepUploaded(true);
      toast.success("Declaración PEP subida con éxito.");
    } else {
      toast.success("Documento enviado a revisión");
      return;
    }

    try {
      const isCed = id === "cedula" ? true : cedulaUploaded;
      const isSel = id === "selfie" ? true : selfieUploaded;
      const isAddress = id === "address" ? true : addressUploaded;
      const isIncome = id === "income" ? true : incomeUploaded;

      // If all required items are uploaded, transition the status
      if (isCed && isSel && isAddress && isIncome && kycStatus === "pending") {
        updates.kycStatus = "submitted";
        updates.documentsUploaded = true;
        toast.success("¡Documentos requeridos enviados! Verificación en proceso.");
      }

      await setDoc(doc(db, "users", currentUser.uid), updates, { merge: true });
    } catch (err: any) {
      toast.error("Error al guardar en el servidor");
      console.error(err);
    }
  };

  const verifiedCount = docs.filter((d) => d.status === "verified").length;
  const isKycVerified = kycStatus === "verified";

  return (
    <div className="pb-10">
      <ScreenHeader title="Documentos KYC" back showBell={false} />
      <div className="px-5 mt-2 space-y-4">
        {/* Status header */}
        <div className="glass rounded-2xl p-5 flex items-center gap-3">
          <div className={`h-12 w-12 rounded-xl grid place-items-center ${isKycVerified ? "bg-success/15" : "bg-primary/15"}`}>
            {isKycVerified ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <Clock className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-lg">
              {isKycVerified ? "Identidad verificada" : kycStatus === "submitted" ? "En revisión" : "Verificación pendiente"}
            </p>
            <p className="text-xs text-muted-foreground">
              Cumplimiento Ley 155-17 (UAF) y SIB en República Dominicana.
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
