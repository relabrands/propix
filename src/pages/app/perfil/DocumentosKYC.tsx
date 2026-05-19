import { useState, useEffect, useRef } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import {
  CheckCircle2, FileCheck2, IdCard, ScanFace, Upload, Receipt, FileSignature,
  Landmark, ShieldAlert, Clock, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { doc, setDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

type Status = "verified" | "pending" | "review";

interface Doc {
  id: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  status: Status;
  date: string;
  required?: boolean;
  url?: string;
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

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      required: true,
      url: currentUser?.cedulaUrl
    },
    {
      id: "selfie",
      label: "Selfie con cédula",
      hint: "Validación biométrica con Veriff",
      icon: ScanFace,
      status: getRequiredDocStatus(selfieUploaded),
      date: getRequiredDocDate(selfieUploaded),
      required: true,
      url: currentUser?.selfieUrl
    },
    {
      id: "address",
      label: "Comprobante de dirección",
      hint: "Factura EDE/CAASD/telefonía no mayor a 3 meses",
      icon: FileCheck2,
      status: kycStatus === "verified" ? "verified" : addressUploaded ? "review" : "pending",
      date: addressUploaded ? "Subido hoy" : "—",
      required: true,
      url: currentUser?.addressUrl
    },
    {
      id: "income",
      label: "Comprobante de ingresos",
      hint: "Carta de trabajo, últimos 3 estados de cuenta o IR-1/IR-2",
      icon: Receipt,
      status: kycStatus === "verified" ? "verified" : incomeUploaded ? "review" : "pending",
      date: incomeUploaded ? "Subido hoy" : "—",
      required: true,
      url: currentUser?.incomeUrl
    },
    { 
      id: "bank", 
      label: "Certificación bancaria", 
      hint: "Requerido para inversiones > US$10,000", 
      icon: Landmark, 
      status: kycStatus === "verified" ? "verified" : bankUploaded ? "review" : "pending", 
      date: bankUploaded ? "Subido hoy" : "—",
      url: currentUser?.bankUrl
    },
    { 
      id: "rnc", 
      label: "Constancia de RNC", 
      hint: "Solo si invertirás como persona jurídica", 
      icon: FileSignature, 
      status: kycStatus === "verified" ? "verified" : rncUploaded ? "review" : "pending", 
      date: rncUploaded ? "Subido hoy" : "—",
      url: currentUser?.rncUrl
    },
    { 
      id: "pep", 
      label: "Declaración PEP / fuente de fondos", 
      hint: "Origen lícito de los recursos (Ley 155-17)", 
      icon: ShieldAlert, 
      status: kycStatus === "verified" ? "verified" : pepUploaded ? "review" : "pending", 
      date: pepUploaded ? "Subido hoy" : "—",
      url: currentUser?.pepUrl
    },
  ];

  const triggerFileInput = (id: string) => {
    if (!currentUser?.uid) {
      toast.error("Sesión inválida");
      return;
    }
    setUploadingId(id);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingId || !currentUser?.uid) return;

    const toastId = toast.loading(`Subiendo ${file.name}...`);
    try {
      const storageRef = ref(storage, `kyc/${currentUser.uid}/${uploadingId}_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      const updates: any = {};
      updates[`${uploadingId}Uploaded`] = true;
      updates[`${uploadingId}Url`] = downloadUrl;

      if (uploadingId === "cedula") {
        setCedulaUploaded(true);
      } else if (uploadingId === "selfie") {
        setSelfieUploaded(true);
      } else if (uploadingId === "address") {
        setAddressUploaded(true);
      } else if (uploadingId === "income") {
        setIncomeUploaded(true);
      } else if (uploadingId === "bank") {
        setBankUploaded(true);
      } else if (uploadingId === "rnc") {
        setRncUploaded(true);
      } else if (uploadingId === "pep") {
        setPepUploaded(true);
      }

      const isCed = uploadingId === "cedula" ? true : cedulaUploaded;
      const isSel = uploadingId === "selfie" ? true : selfieUploaded;
      const isAddress = uploadingId === "address" ? true : addressUploaded;
      const isIncome = uploadingId === "income" ? true : incomeUploaded;

      // If all required items are uploaded, transition the status
      if (isCed && isSel && isAddress && isIncome && kycStatus === "pending") {
        updates.kycStatus = "submitted";
        updates.documentsUploaded = true;
        toast.success("¡Documentos requeridos enviados! Verificación en proceso.", { id: toastId });
      } else {
        toast.success("Documento subido con éxito.", { id: toastId });
      }

      await setDoc(doc(db, "users", currentUser.uid), updates, { merge: true });
    } catch (err: any) {
      toast.error("Error al subir archivo: " + err.message, { id: toastId });
      console.error(err);
    } finally {
      setUploadingId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const verifiedCount = docs.filter((d) => d.status === "verified").length;
  const isKycVerified = kycStatus === "verified";

  return (
    <div className="pb-10">
      <ScreenHeader title="Documentos KYC" back showBell={false} />
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
      />

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
            <DocRow 
              key={d.id} 
              doc={d} 
              onUpload={() => triggerFileInput(d.id)} 
              isUploading={uploadingId === d.id} 
            />
          ))}
        </div>

        {/* Optional docs */}
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground px-1 pt-2">
          Documentos adicionales
        </p>
        <div className="glass rounded-2xl divide-y divide-border">
          {docs.filter((d) => !d.required).map((d) => (
            <DocRow 
              key={d.id} 
              doc={d} 
              onUpload={() => triggerFileInput(d.id)} 
              isUploading={uploadingId === d.id} 
            />
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

function DocRow({ doc, onUpload, isUploading }: { doc: Doc; onUpload: () => void; isUploading: boolean }) {
  return (
    <div className="p-4 flex items-start gap-3">
      <doc.icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm">{doc.label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{doc.hint}</p>
        <p className="text-[10px] text-muted-foreground mt-1 font-mono">{doc.date}</p>
      </div>
      <div className="flex-shrink-0 flex items-center gap-2">
        {doc.url && (
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary hover:underline px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 font-semibold"
          >
            Ver
          </a>
        )}
        {doc.status === "verified" && (
          <span className="text-[10px] text-secondary bg-secondary/15 px-2 py-1 rounded-full">Verificado</span>
        )}
        {doc.status === "review" && (
          <span className="text-[10px] text-primary bg-primary/15 px-2 py-1 rounded-full">En revisión</span>
        )}
        {doc.status === "pending" && (
          isUploading ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Subiendo...
            </span>
          ) : (
            <button
              onClick={onUpload}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:opacity-80"
            >
              <Upload className="h-3.5 w-3.5" /> Subir
            </button>
          )
        )}
      </div>
    </div>
  );
}
