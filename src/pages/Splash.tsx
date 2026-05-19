import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo-f.png";
import { useAppStore } from "@/store/useAppStore";

export default function Splash() {
  const navigate = useNavigate();
  const { onboarded, authed, user } = useAppStore();

  useEffect(() => {
    const t = setTimeout(() => {
      if (!onboarded) navigate("/onboarding", { replace: true });
      else if (!authed) navigate("/auth/login", { replace: true });
      else if (user?.role === "admin") navigate("/admin", { replace: true });
      else navigate("/app", { replace: true });
    }, 1400);
    return () => clearTimeout(t);
  }, [navigate, onboarded, authed, user]);

  return (
    <div className="min-h-screen grid place-items-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-night" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-pulse" />
      <div className="relative flex flex-col items-center gap-5 animate-fade-in">
        <div className="relative h-24 w-24">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
          <img src={logo} alt="Propix" className="relative h-24 w-24 object-contain animate-float" />
        </div>
        <div className="text-center">
          <h1 className="font-display text-3xl gradient-text-gold">Propix</h1>
          <p className="text-xs text-muted-foreground tracking-[0.3em] mt-1">PUNTA CANA · DR</p>
        </div>
        <div className="flex gap-1 mt-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary"
              style={{ animation: `gold-pulse 1.4s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
