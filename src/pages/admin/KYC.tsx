import { useState, useEffect } from "react";
import { FileText, Camera, Eye, Check, X, ZoomIn } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import StatusPill from "@/components/admin/StatusPill";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

type Card = {
  id: string;
  investor: string;
  initials: string;
  submittedAt: string;
  cedula: boolean;
  selfie: boolean;
  address: boolean;
  income: boolean;
  kycStatus: string;
  email: string;
  phone: string;
  userDoc: any;
};

export default function KYC() {
  const [open, setOpen] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [investors, setInvestors] = useState<Card[]>([]);

  const fetchKYCUsers = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "investor"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(d => {
        const u = d.data();
        const initials = (u.name || "Inversor").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
        return {
          id: d.id,
          investor: u.name || "Sin nombre",
          initials,
          submittedAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Recientemente",
          cedula: !!u.cedulaUploaded,
          selfie: !!u.selfieUploaded,
          address: !!u.addressUploaded,
          income: !!u.incomeUploaded,
          kycStatus: u.kycStatus || "pending",
          email: u.email || "",
          phone: u.phone || "",
          userDoc: u
        };
      });
      setInvestors(list);
    } catch (err: any) {
      console.error(err);
      toast.error("Error al cargar colas KYC");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKYCUsers();
  }, []);

  const handleStartReview = async (item: Card) => {
    setOpen(item);
    if (item.kycStatus === "submitted") {
      try {
        await updateDoc(doc(db, "users", item.id), {
          kycStatus: "inReview"
        });
        setInvestors(prev => prev.map(inv => inv.id === item.id ? { ...inv, kycStatus: "inReview" } : inv));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDecision = async (investorId: string, decision: "approved" | "rejected") => {
    try {
      const newStatus = decision === "approved" ? "verified" : "pending";
      
      const updateData: any = {
        kycStatus: newStatus
      };
      
      // Clear flags and URLs on rejection so user must upload again
      if (decision === "rejected") {
        updateData.cedulaUploaded = false;
        updateData.selfieUploaded = false;
        updateData.addressUploaded = false;
        updateData.incomeUploaded = false;
        updateData.bankUploaded = false;
        updateData.rncUploaded = false;
        updateData.pepUploaded = false;
        updateData.documentsUploaded = false;
        
        updateData.cedulaUrl = "";
        updateData.selfieUrl = "";
        updateData.addressUrl = "";
        updateData.incomeUrl = "";
        updateData.bankUrl = "";
        updateData.rncUrl = "";
        updateData.pepUrl = "";
      }

      await updateDoc(doc(db, "users", investorId), updateData);
      
      setInvestors(prev => prev.map(inv => inv.id === investorId ? { 
        ...inv, 
        kycStatus: newStatus,
        cedula: decision === "approved",
        selfie: decision === "approved",
        address: decision === "approved",
        income: decision === "approved",
        userDoc: {
          ...inv.userDoc,
          ...updateData
        }
      } : inv));
      
      toast.success(decision === "approved" ? "KYC verificado y aprobado." : "KYC rechazado, notificado al usuario.");
      setOpen(null);
    } catch (err: any) {
      toast.error("Error al registrar decisión");
      console.error(err);
    }
  };

  const pendingItems = investors.filter(i => i.kycStatus === "submitted");
  const reviewItems = investors.filter(i => i.kycStatus === "inReview");
  const doneItems = investors.filter(i => i.kycStatus === "verified");

  const columns = [
    { key: "pending", title: "Pendientes de revisión", tone: "warning" as const, items: pendingItems },
    { key: "review", title: "En revisión", tone: "info" as const, items: reviewItems },
    { key: "done", title: "Verificados", tone: "success" as const, items: doneItems },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="KYC / Verificaciones"
        subtitle={loading ? "Cargando colas..." : `${pendingItems.length + reviewItems.length} casos requieren acción · ${doneItems.length} completados`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {columns.map((col) => (
          <div key={col.key} className="rounded-lg border border-border bg-[hsl(var(--surface))] flex flex-col min-h-[60vh]">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{col.title}</span>
                <StatusPill tone={col.tone}>{col.items.length}</StatusPill>
              </div>
            </div>
            <div className="p-3 space-y-2 flex-1 overflow-y-auto">
              {loading ? (
                <div className="text-xs text-muted-foreground text-center py-4">Cargando...</div>
              ) : col.items.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-8">Sin casos en esta lista</div>
              ) : (
                col.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-md border border-border bg-background/40 p-3 hover:border-border-strong transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-gold/30 border border-primary/30 flex items-center justify-center text-xs font-medium shrink-0">
                        {item.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.investor}</div>
                        <div className="text-[11px] text-muted-foreground">{item.submittedAt}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
                      <DocChip ok={item.cedula}><FileText className="h-3 w-3" /> Cédula</DocChip>
                      <DocChip ok={item.selfie}><Camera className="h-3 w-3" /> Selfie</DocChip>
                      <DocChip ok={item.address}><FileText className="h-3 w-3" /> Dirección</DocChip>
                      <DocChip ok={item.income}><FileText className="h-3 w-3" /> Ingresos</DocChip>
                      {item.userDoc.bankUploaded && <DocChip ok={true}><FileText className="h-3 w-3" /> Banco</DocChip>}
                      {item.userDoc.rncUploaded && <DocChip ok={true}><FileText className="h-3 w-3" /> RNC</DocChip>}
                      {item.userDoc.pepUploaded && <DocChip ok={true}><FileText className="h-3 w-3" /> PEP</DocChip>}
                    </div>
                    {item.kycStatus === "verified" ? (
                      <div className="mt-3">
                        <StatusPill tone="success">Aprobado</StatusPill>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartReview(item)}
                        className="mt-3 w-full h-8 rounded-md bg-primary/10 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors inline-flex items-center justify-center gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" /> Revisar documentos
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Document viewer modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(null)}>
          <div
            className="bg-[hsl(var(--surface-elevated))] border border-border-strong rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="font-display text-xl">{open.investor}</div>
                <div className="text-xs text-muted-foreground">Verificación KYC · registro {open.submittedAt}</div>
              </div>
              <button onClick={() => setOpen(null)} className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { label: "Cédula", ok: open.cedula, url: open.userDoc.cedulaUrl },
                { label: "Selfie", ok: open.selfie, url: open.userDoc.selfieUrl },
                { label: "Dirección", ok: open.address, url: open.userDoc.addressUrl },
                { label: "Ingresos", ok: open.income, url: open.userDoc.incomeUrl },
                { label: "Banco", ok: !!open.userDoc.bankUploaded, url: open.userDoc.bankUrl },
                { label: "RNC", ok: !!open.userDoc.rncUploaded, url: open.userDoc.rncUrl },
                { label: "PEP", ok: !!open.userDoc.pepUploaded, url: open.userDoc.pepUrl }
              ].map((doc) => {
                const isPdf = doc.url && (doc.url.toLowerCase().includes(".pdf") || doc.url.toLowerCase().includes("%2fpdf"));
                return (
                  <div key={doc.label} className="space-y-2">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                      <span>{doc.label}</span>
                      <span className={doc.ok ? "text-success text-[10px]" : "text-destructive text-[10px]"}>
                        {doc.ok ? "Subido" : "Pendiente"}
                      </span>
                    </div>
                    {doc.ok && doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-[3/4] rounded-md bg-gradient-to-br from-muted to-background border border-border flex items-center justify-center relative group cursor-zoom-in overflow-hidden"
                      >
                        {isPdf ? (
                          <div className="flex flex-col items-center gap-2 p-2 text-center">
                            <FileText className="h-10 w-10 text-primary animate-pulse" />
                            <span className="text-[10px] text-muted-foreground truncate max-w-full font-semibold">Ver PDF</span>
                          </div>
                        ) : (
                          <img src={doc.url} alt={doc.label} className="h-full w-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn className="h-6 w-6 text-primary" />
                        </div>
                      </a>
                    ) : (
                      <div className="aspect-[3/4] rounded-md bg-gradient-to-br from-muted to-background border border-border flex items-center justify-center relative group overflow-hidden">
                        <FileText className="h-12 w-12 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="px-5 pb-5">
              <div className="rounded-md border border-border bg-background/40 p-4 space-y-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Datos del perfil de inversor</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Documento</span>
                    <span className="font-mono">{open.userDoc.cedula || "No provisto"} ({open.userDoc.documentType || "cédula"})</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Nacionalidad</span>
                    <span className="font-mono">{open.userDoc.nationality || "No provista"}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Profesión / Actividad</span>
                    <span className="font-mono">{open.userDoc.profession || "No provista"} - {open.userDoc.economicActivity || "No provista"}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Ingresos Mensuales</span>
                    <span className="font-mono">{open.userDoc.monthlyIncome ? `$${Number(open.userDoc.monthlyIncome).toLocaleString()}` : "No provistos"}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Origen de Fondos</span>
                    <span className="font-mono">{open.userDoc.fundsSource || "No provisto"}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">¿Persona PEP?</span>
                    <span className="font-mono">{open.userDoc.isPep === "si" ? "Sí" : "No"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-2 bg-muted/10">
              <button 
                onClick={() => handleDecision(open.id, "rejected")} 
                className="h-9 px-4 rounded-md border border-destructive/40 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors inline-flex items-center gap-2"
              >
                <X className="h-4 w-4" /> Rechazar
              </button>
              <button 
                onClick={() => handleDecision(open.id, "approved")}
                className="h-9 px-4 rounded-md bg-success text-success-foreground text-sm font-medium hover:bg-success/90 transition-colors inline-flex items-center gap-2"
              >
                <Check className="h-4 w-4" /> Aprobar verificación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocChip({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px]",
        ok ? "border-success/30 text-success bg-success/5" : "border-destructive/30 text-destructive bg-destructive/5",
      )}
    >
      {children}
      {ok ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
    </span>
  );
}
