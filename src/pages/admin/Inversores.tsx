import { useState, useEffect } from "react";
import { Search, Eye, MessageSquare, Ban, Download, X } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import StatusPill from "@/components/admin/StatusPill";
import StatCard from "@/components/admin/StatCard";
import { Users, ShieldCheck, Clock, AlertOctagon } from "lucide-react";
import { formatUSD } from "@/lib/format";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

export default function Inversores() {
  const [queryText, setQueryText] = useState("");
  const [tab, setTab] = useState<"todos" | "verificados" | "pendientes" | "suspendidos">("todos");
  const [investors, setInvestors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvestor, setSelectedInvestor] = useState<any | null>(null);

  const fetchInvestors = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "investor"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => {
        const user = doc.data();
        return {
          id: doc.id,
          ...user,
          name: user.name || "Sin nombre",
          cedula: user.cedula || "N/A",
          email: user.email || "N/A",
          phone: user.phone || "N/A",
          totalInvested: user.totalInvested || 0,
          propertiesCount: user.propertiesCount || 0,
          monthlyIncome: user.monthlyIncome || 0,
          registeredAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Desconocido",
          kycStatus: user.kycStatus === "verified" ? "Verificado" 
                   : user.kycStatus === "submitted" ? "En revisión" 
                   : "Pendiente",
          suspended: user.suspended || false,
        };
      });
      setInvestors(data);
    } catch (error) {
      console.error("Error fetching investors:", error);
      toast.error("Error al cargar los inversores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestors();
  }, []);

  const handleToggleSuspend = async (investorId: string, currentSuspended: boolean) => {
    try {
      await updateDoc(doc(db, "users", investorId), {
        suspended: !currentSuspended,
      });
      setInvestors(prev => prev.map(inv => inv.id === investorId ? { ...inv, suspended: !currentSuspended } : inv));
      if (selectedInvestor?.id === investorId) {
        setSelectedInvestor((prev: any) => ({ ...prev, suspended: !currentSuspended }));
      }
      toast.success(currentSuspended ? "Cuenta reactivada con éxito" : "Cuenta suspendida con éxito");
    } catch (err: any) {
      toast.error("Error al actualizar la cuenta");
    }
  };

  const handleApproveKyc = async (investorId: string) => {
    try {
      await updateDoc(doc(db, "users", investorId), {
        kycStatus: "verified",
      });
      setInvestors(prev => prev.map(inv => inv.id === investorId ? { ...inv, kycStatus: "Verificado" } : inv));
      if (selectedInvestor?.id === investorId) {
        setSelectedInvestor((prev: any) => ({ ...prev, kycStatus: "Verificado" }));
      }
      toast.success("KYC aprobado con éxito");
    } catch (err: any) {
      toast.error("Error al aprobar KYC");
    }
  };

  const handleRejectKyc = async (investorId: string) => {
    try {
      await updateDoc(doc(db, "users", investorId), {
        kycStatus: "pending",
      });
      setInvestors(prev => prev.map(inv => inv.id === investorId ? { ...inv, kycStatus: "Pendiente" } : inv));
      if (selectedInvestor?.id === investorId) {
        setSelectedInvestor((prev: any) => ({ ...prev, kycStatus: "Pendiente" }));
      }
      toast.success("KYC rechazado con éxito");
    } catch (err: any) {
      toast.error("Error al rechazar KYC");
    }
  };

  const filtered = investors.filter((i) => {
    if (tab === "verificados" && i.kycStatus !== "Verificado") return false;
    if (tab === "pendientes" && i.kycStatus !== "Pendiente" && i.kycStatus !== "En revisión") return false;
    if (tab === "suspendidos" && !i.suspended) return false;
    if (queryText && !i.name.toLowerCase().includes(queryText.toLowerCase()) && !i.email.toLowerCase().includes(queryText.toLowerCase())) return false;
    return true;
  });

  const verified = investors.filter((i) => i.kycStatus === "Verificado").length;
  const pending = investors.filter((i) => i.kycStatus === "Pendiente" || i.kycStatus === "En revisión").length;
  const suspended = investors.filter((i) => i.suspended).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inversores"
        subtitle={loading ? "Cargando inversores..." : `${investors.length} cuentas registradas`}
        actions={
          <button className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border text-sm hover:border-border-strong transition-colors">
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total inversores" value={investors.length.toString()} icon={Users} hint="Acumulado" />
        <StatCard label="Verificados" value={verified.toString()} icon={ShieldCheck} accent="teal" hint="KYC OK" />
        <StatCard label="Pendientes KYC" value={pending.toString()} icon={Clock} accent="gold" hint="Por revisar" />
        <StatCard label="Suspendidos" value={suspended.toString()} icon={AlertOctagon} hint="Cuentas bloqueadas" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-1 p-1 rounded-md bg-[hsl(var(--surface))] border border-border">
          {(["todos", "verificados", "pendientes", "suspendidos"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 h-7 rounded text-xs font-medium capitalize transition-colors",
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Buscar por nombre o email…"
            className="w-full h-9 rounded-md bg-[hsl(var(--surface))] border border-border pl-9 pr-3 text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-[hsl(var(--surface))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/20">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Inversor</th>
                <th className="text-left px-4 py-3 font-medium">Contacto</th>
                <th className="text-right px-4 py-3 font-medium">Invertido</th>
                <th className="text-right px-4 py-3 font-medium">Props</th>
                <th className="text-right px-4 py-3 font-medium">Renta/mes</th>
                <th className="text-right px-4 py-3 font-medium">Registro</th>
                <th className="text-left px-4 py-3 font-medium">KYC</th>
                <th className="text-right px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    {loading ? "Cargando..." : "No se encontraron inversores"}
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className={cn("border-t border-border hover:bg-muted/20 transition-colors", inv.suspended && "opacity-60")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-gold/30 border border-primary/30 flex items-center justify-center text-xs font-medium shrink-0">
                          {inv.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{inv.name}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">{inv.cedula}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="text-xs truncate max-w-[180px]">{inv.email}</div>
                      <div className="text-[11px] font-mono">{inv.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{formatUSD(inv.totalInvested, { decimals: 0 })}</td>
                    <td className="px-4 py-3 text-right font-mono">{inv.propertiesCount}</td>
                    <td className="px-4 py-3 text-right font-mono text-secondary">{formatUSD(inv.monthlyIncome)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">{inv.registeredAt}</td>
                    <td className="px-4 py-3">
                      <StatusPill
                        tone={
                          inv.kycStatus === "Verificado"
                            ? "success"
                            : inv.kycStatus === "Pendiente"
                            ? "warning"
                            : inv.kycStatus === "En revisión"
                            ? "info"
                            : "danger"
                        }
                      >
                        {inv.kycStatus}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedInvestor(inv)}
                          title="Ver perfil"
                          className="h-7 w-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <a
                          href={`mailto:${inv.email}`}
                          title="Contactar"
                          className="h-7 w-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </a>
                        <button
                          onClick={() => handleToggleSuspend(inv.id, inv.suspended)}
                          title={inv.suspended ? "Reactivar" : "Suspender"}
                          className={cn(
                            "h-7 w-7 rounded flex items-center justify-center transition-colors",
                            inv.suspended
                              ? "hover:bg-success/10 text-success"
                              : "hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          )}
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details modal */}
      {selectedInvestor && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedInvestor(null)}>
          <div
            className="bg-[hsl(var(--surface-elevated))] border border-border-strong rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-elevated flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="font-display text-xl">{selectedInvestor.name}</div>
                <div className="text-xs text-muted-foreground">ID: {selectedInvestor.id} · Registro: {selectedInvestor.registeredAt}</div>
              </div>
              <button onClick={() => setSelectedInvestor(null)} className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* Status Section */}
              <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg border border-border">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Estado KYC</span>
                  <StatusPill tone={selectedInvestor.kycStatus === "Verificado" ? "success" : selectedInvestor.kycStatus === "En revisión" ? "info" : "warning"}>
                    {selectedInvestor.kycStatus}
                  </StatusPill>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Estado Cuenta</span>
                  <StatusPill tone={selectedInvestor.suspended ? "danger" : "success"}>
                    {selectedInvestor.suspended ? "Suspendida" : "Activa"}
                  </StatusPill>
                </div>
              </div>

              {/* Grid sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Identidad */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-1">Identidad</h4>
                  <div className="space-y-2 text-sm">
                    <DetailRow label="Nombres" value={selectedInvestor.firstName} />
                    <DetailRow label="Apellidos" value={selectedInvestor.lastName} />
                    <DetailRow label="Tipo de documento" value={selectedInvestor.documentType === "pasaporte" ? "Pasaporte" : "Cédula"} />
                    <DetailRow label="Documento" value={selectedInvestor.cedula} />
                    <DetailRow label="Nacionalidad" value={selectedInvestor.nationality} />
                    <DetailRow label="Fecha Nacimiento" value={selectedInvestor.birthdate} />
                    <DetailRow label="Lugar Nacimiento" value={selectedInvestor.birthPlace} />
                    <DetailRow label="Sexo" value={selectedInvestor.gender === "F" ? "Femenino" : "Masculino"} />
                    <DetailRow label="Estado Civil" value={selectedInvestor.civilStatus} />
                  </div>
                </div>

                {/* Contacto & Domicilio */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-1">Contacto y Domicilio</h4>
                  <div className="space-y-2 text-sm">
                    <DetailRow label="Email" value={selectedInvestor.email} />
                    <DetailRow label="Teléfono" value={selectedInvestor.phone} />
                    <DetailRow label="Calle y No." value={`${selectedInvestor.street || ""} No. ${selectedInvestor.houseNumber || ""}`} />
                    <DetailRow label="Sector" value={selectedInvestor.sector} />
                    <DetailRow label="Provincia" value={selectedInvestor.province} />
                    <DetailRow label="Municipio" value={selectedInvestor.municipality} />
                    <DetailRow label="Cód. Postal" value={selectedInvestor.postalCode} />
                  </div>
                </div>

                {/* Perfil Económico */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-1">Perfil Económico</h4>
                  <div className="space-y-2 text-sm">
                    <DetailRow label="Profesión / Ocupación" value={selectedInvestor.profession} />
                    <DetailRow label="Empresa / Empleador" value={selectedInvestor.employer} />
                    <DetailRow label="Actividad Económica" value={selectedInvestor.economicActivity} />
                    <DetailRow label="Ingresos Mensuales" value={formatUSD(Number(selectedInvestor.monthlyIncome || 0))} />
                    <DetailRow label="Origen de Fondos" value={selectedInvestor.fundsSource} />
                    <DetailRow label="Experiencia Inv." value={selectedInvestor.investmentExperience} />
                    <DetailRow label="Propósito Inv." value={selectedInvestor.investmentPurpose} />
                    <DetailRow label="RNC" value={selectedInvestor.rnc} />
                  </div>
                </div>

                {/* PEP / Cumplimiento */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border pb-1">Cumplimiento (PEP / US Person)</h4>
                  <div className="space-y-2 text-sm">
                    <DetailRow label="¿Es PEP?" value={selectedInvestor.isPep === "si" ? "Sí" : "No"} />
                    <DetailRow label="Vínculo PEP" value={selectedInvestor.pepRelation === "si" ? "Sí" : "No"} />
                    <DetailRow label="US Person" value={selectedInvestor.usPerson === "si" ? "Sí" : "No"} />
                    <DetailRow label="TIN / SSN" value={selectedInvestor.tin} />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="px-6 py-4 border-t border-border flex flex-wrap items-center justify-between gap-2 bg-muted/10">
              <button
                onClick={() => handleToggleSuspend(selectedInvestor.id, selectedInvestor.suspended)}
                className={cn(
                  "h-9 px-4 rounded-md border text-sm font-medium transition-colors",
                  selectedInvestor.suspended
                    ? "border-success/40 text-success hover:bg-success/10"
                    : "border-destructive/40 text-destructive hover:bg-destructive/10"
                )}
              >
                {selectedInvestor.suspended ? "Reactivar Cuenta" : "Suspender Cuenta"}
              </button>

              <div className="flex items-center gap-2">
                {selectedInvestor.kycStatus !== "Pendiente" && (
                  <button
                    onClick={() => handleRejectKyc(selectedInvestor.id)}
                    className="h-9 px-4 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Rechazar KYC
                  </button>
                )}
                {selectedInvestor.kycStatus !== "Verificado" && (
                  <button
                    onClick={() => handleApproveKyc(selectedInvestor.id)}
                    className="h-9 px-4 rounded-md bg-success text-success-foreground text-sm font-medium hover:bg-success/90 transition-colors"
                  >
                    Aprobar KYC
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between items-start gap-2 border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-medium text-right break-words max-w-[65%]">{value || "—"}</span>
    </div>
  );
}
