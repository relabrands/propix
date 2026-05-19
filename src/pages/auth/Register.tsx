import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Upload, Check, Camera } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";

export default function Register() {
  const [step, setStep] = useState<1 | 2>(1);
  const [accepted, setAccepted] = useState(false);
  const setAuthed = useAppStore((s) => s.setAuthed);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen px-6 py-8 max-w-md mx-auto safe-top safe-bottom flex flex-col">
      <div className="flex items-center justify-between">
        <Link to="/onboarding" className="text-xs text-muted-foreground">← Volver</Link>
        <span className="text-xs text-muted-foreground">Paso {step} de 2</span>
      </div>

      {/* progress */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="h-1 rounded-full bg-primary" />
        <div className={`h-1 rounded-full ${step === 2 ? "bg-primary" : "bg-muted"}`} />
      </div>

      {step === 1 ? (
        <div className="mt-8 flex-1 flex flex-col">
          <h1 className="font-display text-4xl leading-tight">Crea tu cuenta</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Empieza a invertir en menos de 3 minutos.
          </p>

          <form
            className="mt-8 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!accepted) return toast.error("Debes aceptar los términos");
              setStep(2);
            }}
          >
            <Input placeholder="Nombre completo" defaultValue="Jorge Rodríguez" />
            <Input placeholder="Correo electrónico" type="email" defaultValue="jorge@example.do" />
            <Input placeholder="+1 (809) 000-0000" type="tel" defaultValue="+1 (809) 555-0142" />
            <Input placeholder="Contraseña" type="password" defaultValue="micontra123" />

            <button
              type="button"
              className="w-full h-12 rounded-2xl glass text-sm font-medium flex items-center justify-center gap-2"
            >
              <span className="h-5 w-5 rounded-full bg-foreground text-background grid place-items-center text-[10px] font-bold">G</span>
              Continuar con Google
            </button>

            <label className="flex items-start gap-3 pt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-primary"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                Acepto los <span className="text-primary">términos y condiciones</span> y la{" "}
                <span className="text-primary">política de privacidad</span> de Propix.
              </span>
            </label>

            <button
              type="submit"
              className="mt-4 h-14 w-full rounded-2xl bg-gradient-gold text-primary-foreground font-semibold shadow-gold transition-transform active:scale-[0.98]"
            >
              Continuar
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-8 flex-1 flex flex-col">
          <h1 className="font-display text-4xl leading-tight">Verifica tu identidad</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Requerido por regulación dominicana. Solo te tomará 1 minuto.
          </p>

          <div className="mt-6 space-y-3">
            <UploadTile icon={<Upload className="h-5 w-5" />} title="Sube tu cédula o pasaporte" desc="Frente y reverso · JPG o PDF" />
            <UploadTile icon={<Camera className="h-5 w-5" />} title="Toma una selfie" desc="Para verificación facial" />
          </div>

          <div className="mt-5 glass rounded-2xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-secondary/15 grid place-items-center">
              <ShieldCheck className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium">Tu información está protegida</p>
              <p className="text-xs text-muted-foreground">Encriptación bancaria de extremo a extremo.</p>
            </div>
          </div>

          <button
            onClick={() => {
              toast.success("¡Cuenta creada! Verificación pendiente.");
              setAuthed(true);
              navigate("/app");
            }}
            className="mt-auto h-14 w-full rounded-2xl bg-gradient-gold text-primary-foreground font-semibold shadow-gold"
          >
            Finalizar registro
          </button>
        </div>
      )}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-14 w-full px-4 rounded-2xl glass text-sm placeholder:text-muted-foreground outline-none focus:border-primary/40"
    />
  );
}

function UploadTile({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => setDone(true)}
      className="w-full glass rounded-2xl p-4 flex items-center gap-4 text-left transition-transform active:scale-[0.99]"
    >
      <div
        className={`h-12 w-12 rounded-xl border grid place-items-center transition-all ${
          done ? "bg-success/15 border-success/40 text-success" : "bg-gradient-gold-soft border-primary/30 text-primary"
        }`}
      >
        {done ? <Check className="h-5 w-5" /> : icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{done ? "Cargado correctamente" : desc}</p>
      </div>
      <span className="text-xs text-primary">{done ? "Editar" : "Subir"}</span>
    </button>
  );
}
