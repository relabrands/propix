import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Upload, Check, Camera } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function Register() {
  const [step, setStep] = useState<1 | 2>(1);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [cedulaUploaded, setCedulaUploaded] = useState(false);
  const [selfieUploaded, setSelfieUploaded] = useState(false);
  const navigate = useNavigate();
  const setAuthed = useAppStore((s) => s.setAuthed);
  const setUser = useAppStore((s) => s.setUser);

  const saveUserToFirestore = async (uid: string, userData: any) => {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        ...userData,
        createdAt: new Date().toISOString(),
        role: "investor",
        kycStatus: "pending"
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) return toast.error("Debes aceptar los términos");
    if (!name || !email || !password || !phone) return toast.error("Todos los campos son obligatorios");

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      
      await saveUserToFirestore(user.uid, {
        name,
        email,
        phone,
      });

      setStep(2);
    } catch (error: any) {
      toast.error(error.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (!accepted) return toast.error("Debes aceptar los términos");
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      await saveUserToFirestore(user.uid, {
        name: user.displayName,
        email: user.email,
        phone: user.phoneNumber || "",
      });

      setStep(2);
    } catch (error: any) {
      toast.error(error.message || "Error con Google");
    }
  };

  const handleFinish = async () => {
    if (!cedulaUploaded || !selfieUploaded) {
      return toast.error("Por favor, sube ambos documentos para verificar tu identidad.");
    }
    if (auth.currentUser) {
      setLoading(true);
      try {
        await setDoc(doc(db, "users", auth.currentUser.uid), {
          kycStatus: "submitted",
          documentsUploaded: true
        }, { merge: true });
        
        toast.success("¡Documentos recibidos! Verificación en proceso.");
        setAuthed(true);
        navigate("/app");
      } catch (err: any) {
        toast.error("Error al guardar información");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSkip = () => {
    if (auth.currentUser) {
      toast.info("Registro completado. Recuerda verificar tu identidad más tarde.");
      setAuthed(true);
      navigate("/app");
    }
  };

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

          <form className="mt-8 space-y-3" onSubmit={handleRegister}>
            <Input placeholder="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input placeholder="Correo electrónico" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input placeholder="+1 (809) 000-0000" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <Input placeholder="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

            <button
              type="button"
              onClick={handleGoogle}
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
              disabled={loading}
              className="mt-4 h-14 w-full rounded-2xl bg-gradient-gold text-primary-foreground font-semibold shadow-gold transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Cargando..." : "Continuar"}
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
            <UploadTile
              icon={<Upload className="h-5 w-5" />}
              title="Sube tu cédula o pasaporte"
              desc="Frente y reverso · JPG o PDF"
              done={cedulaUploaded}
              onChange={setCedulaUploaded}
            />
            <UploadTile
              icon={<Camera className="h-5 w-5" />}
              title="Toma una selfie"
              desc="Para verificación facial"
              done={selfieUploaded}
              onChange={setSelfieUploaded}
            />
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

          <div className="mt-auto pt-6 space-y-3">
            <button
              onClick={handleFinish}
              disabled={loading || !cedulaUploaded || !selfieUploaded}
              className="h-14 w-full rounded-2xl bg-gradient-gold text-primary-foreground font-semibold shadow-gold transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Cargando..." : "Finalizar y verificar"}
            </button>
            
            <button
              onClick={handleSkip}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2 font-medium"
            >
              Omitir verificación por ahora
            </button>
          </div>
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

function UploadTile({
  icon,
  title,
  desc,
  done,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  done: boolean;
  onChange: (done: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!done)}
      type="button"
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
