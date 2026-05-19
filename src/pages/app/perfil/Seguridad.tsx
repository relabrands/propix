import { useState } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import { Fingerprint, KeyRound, Shield, Smartphone } from "lucide-react";
import { toast } from "sonner";

export default function Seguridad() {
  const [biometric, setBiometric] = useState(true);
  const [twoFA, setTwoFA] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);

  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });

  const changePwd = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.next.length < 8) return toast.error("Mínimo 8 caracteres");
    if (pwd.next !== pwd.confirm) return toast.error("Las contraseñas no coinciden");
    setPwd({ current: "", next: "", confirm: "" });
    toast.success("Contraseña actualizada");
  };

  return (
    <div className="pb-10">
      <ScreenHeader title="Seguridad y biometría" back showBell={false} />
      <div className="px-5 mt-2 space-y-5">
        <div className="glass rounded-2xl divide-y divide-border">
          <Toggle icon={Fingerprint} label="Acceso biométrico" desc="Face ID / huella" value={biometric} onChange={setBiometric} />
          <Toggle icon={Shield} label="Autenticación 2FA" desc="Código por SMS al iniciar sesión" value={twoFA} onChange={setTwoFA} />
          <Toggle icon={Smartphone} label="Alertas de inicio de sesión" desc="Notificación al detectar nuevo dispositivo" value={loginAlerts} onChange={setLoginAlerts} />
        </div>

        <form onSubmit={changePwd} className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="h-4 w-4 text-primary" />
            <p className="font-display text-lg">Cambiar contraseña</p>
          </div>
          <Input type="password" placeholder="Contraseña actual" value={pwd.current} onChange={(v) => setPwd({ ...pwd, current: v })} />
          <Input type="password" placeholder="Nueva contraseña" value={pwd.next} onChange={(v) => setPwd({ ...pwd, next: v })} />
          <Input type="password" placeholder="Confirmar nueva contraseña" value={pwd.confirm} onChange={(v) => setPwd({ ...pwd, confirm: v })} />
          <button className="w-full h-11 rounded-xl bg-gradient-gold text-primary-foreground text-sm font-semibold shadow-gold">
            Actualizar contraseña
          </button>
        </form>
      </div>
    </div>
  );
}

function Toggle({
  icon: Icon, label, desc, value, onChange,
}: { icon: React.ComponentType<{ className?: string }>; label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="p-4 flex items-center gap-3">
      <Icon className="h-5 w-5 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="text-sm">{label}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition-colors ${value ? "bg-secondary" : "bg-muted"}`}
        aria-pressed={value}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${value ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function Input(props: { type?: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <input
      type={props.type}
      placeholder={props.placeholder}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      className="w-full h-11 rounded-xl bg-surface border border-border px-3 text-sm focus:outline-none focus:border-primary/60"
    />
  );
}
