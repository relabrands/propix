import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function Login() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuthed = useAppStore((s) => s.setAuthed);
  const setUser = useAppStore((s) => s.setUser);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Ingresa correo y contraseña");

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setAuthed(true);
      setUser(userCredential.user);
      toast.success(`Bienvenido de vuelta${userCredential.user.displayName ? `, ${userCredential.user.displayName}` : ""} 👋`);
      
      if (userCredential.user.email === "robinsonantsanchez@gmail.com") {
        navigate("/admin");
      } else {
        navigate("/app");
      }
    } catch (error: any) {
      toast.error(error.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-10 max-w-md mx-auto safe-top safe-bottom flex flex-col">
      <Link to="/onboarding" className="text-xs text-muted-foreground">← Volver</Link>
      <div className="mt-12">
        <span className="font-display text-2xl gradient-text-gold">Propix</span>
        <h1 className="font-display text-4xl mt-6 leading-tight">Bienvenido<br />de vuelta</h1>
        <p className="text-muted-foreground text-sm mt-2">Inicia sesión para revisar tu portafolio.</p>
      </div>

      <form onSubmit={handleLogin} className="mt-10 space-y-4">
        <Field
          icon={<Mail className="h-4 w-4" />}
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(v) => setEmail(v)}
        />
        <Field
          icon={<Lock className="h-4 w-4" />}
          type={show ? "text" : "password"}
          placeholder="Contraseña"
          value={password}
          onChange={(v) => setPassword(v)}
          right={
            <button type="button" onClick={() => setShow(!show)} className="text-muted-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        <div className="flex justify-end">
          <button type="button" className="text-xs text-primary">¿Olvidaste tu contraseña?</button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-14 w-full rounded-2xl bg-gradient-gold text-primary-foreground font-semibold shadow-gold transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Cargando..." : "Iniciar sesión"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-auto pt-10">
        ¿Aún no tienes cuenta?{" "}
        <Link to="/auth/register" className="text-primary font-semibold">Regístrate</Link>
      </p>
    </div>
  );
}

function Field({
  icon,
  type,
  placeholder,
  value,
  onChange,
  right,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  right?: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-center gap-3 h-14 px-4 rounded-2xl glass focus-within:border-primary/40 transition-colors">
        <span className="text-muted-foreground">{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
        {right}
      </div>
    </label>
  );
}
