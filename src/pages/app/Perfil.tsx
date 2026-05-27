import ScreenHeader from "@/components/ScreenHeader";
import { portfolioStats } from "@/lib/mockData";
import { useAppStore } from "@/store/useAppStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Bell, ChevronRight, FileText, HelpCircle, KeyRound,
  LogOut, ScrollText, ShieldCheck, User as UserIcon, Wallet
} from "lucide-react";
import { formatUSD } from "@/lib/format";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function Perfil() {
  const navigate = useNavigate();
  const { user: currentUser, reset } = useAppStore();
  const [totalInvested, setTotalInvested] = useState(0);
  const [propertiesCount, setPropertiesCount] = useState(0);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(collection(db, "investments"), where("userId", "==", currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let invested = 0;
      const properties = new Set();
      snapshot.forEach(doc => {
        const data = doc.data();
        invested += data.amount || 0;
        if (data.propertyId) properties.add(data.propertyId);
      });
      setTotalInvested(invested);
      setPropertiesCount(properties.size);
    });
    return () => unsubscribe();
  }, [currentUser?.uid]);

  const logout = async () => {
    try {
      await signOut(auth);
      reset();
      toast.success("Sesión cerrada");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error("Error al cerrar sesión");
    }
  };

  const initials = currentUser?.name
    ? currentUser.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : currentUser?.displayName
    ? currentUser.displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "IN";

  const name = currentUser?.name || currentUser?.displayName || "Inversor";
  const isKycVerified = currentUser?.kycStatus === "verified";
  
  const createdAt = currentUser?.createdAt ? new Date(currentUser.createdAt) : new Date();
  const memberSince = createdAt.toLocaleDateString("es-DO", { month: "short", year: "numeric" });
  const level = currentUser?.level || "Bronce";

  const monthsActive = Math.max(1, Math.round((new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)));

  const kycStatus = currentUser?.kycStatus || "pending";
  const kycBadgeMap = {
    pending: "Pendiente",
    submitted: "En revisión",
    verified: "Verificado",
  };
  const kycBadge = kycBadgeMap[kycStatus as keyof typeof kycBadgeMap] || "Pendiente";
  const kycBadgeTone = kycStatus === "verified" ? "secondary" : kycStatus === "submitted" ? "primary" : "warning";

  return (
    <div className="pb-6">
      <ScreenHeader title="Mi perfil" />

      <div className="px-5 space-y-5">
        {/* Profile header */}
        <div className="glass-strong rounded-3xl p-6 text-center grain-overlay relative overflow-hidden">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <div className="relative inline-block">
              <div className="absolute inset-0 rounded-full bg-gradient-gold blur-md opacity-40" />
              <div className="relative h-20 w-20 rounded-full bg-surface border-2 border-primary grid place-items-center font-display text-2xl">
                {initials}
              </div>
            </div>
            <p className="font-display text-2xl mt-3 flex items-center justify-center gap-2">
              {name}
              {isKycVerified && <ShieldCheck className="h-4 w-4 text-secondary" />}
            </p>
            <p className="text-xs text-muted-foreground">Miembro desde {memberSince}</p>
            <span className="inline-flex items-center gap-1 mt-3 text-[11px] font-bold tracking-wider text-primary-foreground bg-gradient-gold px-3 py-1 rounded-full shadow-gold">
              ⭐ INVERSOR {level.toUpperCase()}
            </span>

            <div className="grid grid-cols-3 gap-2 mt-5 pt-5 border-t border-border">
              <Stat label="Invertido" value={formatUSD(totalInvested, { decimals: 0 })} />
              <Stat label="Propiedades" value={propertiesCount.toString()} />
              <Stat label="Meses" value={monthsActive.toString()} />
            </div>
          </div>
        </div>

        {/* Menu sections */}
        <Section title="Mi cuenta">
          <Item icon={UserIcon} label="Información personal" to="/app/perfil/informacion" />
          <Item icon={ShieldCheck} label="Documentos KYC" badge={kycBadge} badgeTone={kycBadgeTone} to="/app/perfil/kyc" />
          <Item icon={KeyRound} label="Seguridad y biometría" to="/app/perfil/seguridad" />
          <Item icon={Bell} label="Notificaciones" to="/app/perfil/notificaciones" />
        </Section>

        <Section title="Inversiones">
          <Item icon={FileText} label="Reportes y estados de cuenta" to="/app/perfil/reportes" />
          <Item icon={Wallet} label="Historial fiscal" to="/app/perfil/fiscal" />
        </Section>

        <Section title="Soporte">
          <Item icon={HelpCircle} label="Centro de ayuda" to="/app/perfil/ayuda" />
          <Item icon={ScrollText} label="Términos y privacidad" to="/app/perfil/terminos" />
        </Section>

        <button
          onClick={logout}
          className="w-full h-12 rounded-2xl text-sm text-destructive font-medium flex items-center justify-center gap-2 hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>

        <p className="text-center text-[10px] text-muted-foreground">
          Propix · v1.0.0 · Regulado en RD
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-sm">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2 px-1">{title}</p>
      <div className="glass rounded-2xl divide-y divide-border">{children}</div>
    </div>
  );
}

function Item({
  icon: Icon,
  label,
  badge,
  badgeTone = "secondary",
  to,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  badgeTone?: "secondary" | "primary" | "warning";
  to?: string;
}) {
  const navigate = useNavigate();

  const toneClasses = {
    secondary: "text-secondary bg-secondary/15",
    primary: "text-primary bg-primary/15",
    warning: "text-amber-500 bg-amber-500/15",
  };

  const badgeClass = toneClasses[badgeTone] || toneClasses.secondary;

  return (
    <button
      onClick={() => to && navigate(to)}
      className="w-full p-4 flex items-center gap-3 text-left active:bg-surface/40 transition-colors"
    >
      <Icon className="h-4.5 w-4.5 text-primary" />
      <span className="flex-1 text-sm">{label}</span>
      {badge && (
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${badgeClass}`}>{badge}</span>
      )}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
