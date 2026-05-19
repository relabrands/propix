import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Upload, Check, Camera, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";
import { auth, db, storage } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
  const [cedulaUrl, setCedulaUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [uploadingId, setUploadingId] = useState<"cedula" | "selfie" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, id: "cedula" | "selfie") => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setUploadingId(id);
    const toastId = toast.loading(`Subiendo ${file.name}...`);
    try {
      const storageRef = ref(storage, `kyc/${auth.currentUser.uid}/${id}_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      if (id === "cedula") {
        setCedulaUrl(downloadUrl);
        setCedulaUploaded(true);
      } else {
        setSelfieUrl(downloadUrl);
        setSelfieUploaded(true);
      }

      toast.success("Documento subido con éxito.", { id: toastId });
    } catch (err: any) {
      toast.error("Error al subir archivo: " + err.message, { id: toastId });
      console.error(err);
    } finally {
      setUploadingId(null);
      e.target.value = "";
    }
  };

  const handleFinish = async () => {
    if (!cedulaUploaded || !selfieUploaded || !cedulaUrl || !selfieUrl) {
      return toast.error("Por favor, sube ambos documentos para verificar tu identidad.");
    }
    if (auth.currentUser) {
      setLoading(true);
      try {
        await setDoc(doc(db, "users", auth.currentUser.uid), {
          kycStatus: "submitted",
          documentsUploaded: true,
          cedulaUploaded: true,
          selfieUploaded: true,
          cedulaUrl,
          selfieUrl
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

            <p className="text-center text-sm text-muted-foreground mt-4">
              ¿Ya tienes cuenta?{" "}
              <Link to="/auth/login" className="text-primary font-semibold hover:underline">
                Inicia sesión
              </Link>
            </p>
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
              id="cedula"
              icon={<Upload className="h-5 w-5" />}
              title="Sube tu cédula o pasaporte"
              desc="Frente y reverso · JPG o PDF"
              done={cedulaUploaded}
              isUploading={uploadingId === "cedula"}
              onChange={(e) => handleFileChange(e, "cedula")}
            />
            <UploadTile
              id="selfie"
              icon={<Camera className="h-5 w-5" />}
              title="Toma una selfie"
              desc="Para verificación facial"
              done={selfieUploaded}
              isUploading={uploadingId === "selfie"}
              onChange={(e) => handleFileChange(e, "selfie")}
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
  id,
  icon,
  title,
  desc,
  done,
  isUploading,
  onChange,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  done: boolean;
  isUploading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const inputId = `upload-tile-${id}`;

  return (
    <label
      htmlFor={inputId}
      className={`w-full glass rounded-2xl p-4 flex items-center gap-4 text-left transition-transform active:scale-[0.99] cursor-pointer ${
        isUploading ? "opacity-70 pointer-events-none" : ""
      }`}
    >
      <input
        type="file"
        id={inputId}
        className="hidden"
        accept="image/*,application/pdf"
        onChange={onChange}
      />
      <div
        className={`h-12 w-12 rounded-xl border grid place-items-center transition-all ${
          done 
            ? "bg-success/15 border-success/40 text-success" 
            : isUploading 
            ? "bg-muted border-muted text-muted-foreground" 
            : "bg-gradient-gold-soft border-primary/30 text-primary"
        }`}
      >
        {isUploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : done ? (
          <Check className="h-5 w-5" />
        ) : (
          icon
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">
          {isUploading ? "Subiendo..." : done ? "Cargado correctamente" : desc}
        </p>
      </div>
      <span className="text-xs text-primary">
        {isUploading ? "Cargando" : done ? "Editar" : "Subir"}
      </span>
    </label>
  );
}
