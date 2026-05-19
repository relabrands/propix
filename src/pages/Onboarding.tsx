import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Home, DollarSign, TrendingUp, Star, ShieldCheck, Search, Award } from "lucide-react";
import heroImg from "@/assets/punta-cana-hero.jpg";
import { useAppStore } from "@/store/useAppStore";

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const setOnboarded = useAppStore((s) => s.setOnboarded);

  const next = () => {
    if (step < 2) setStep(step + 1);
    else {
      setOnboarded(true);
      navigate("/auth/register");
    }
  };

  const skip = () => {
    setOnboarded(true);
    navigate("/auth/login");
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background image only on step 0 */}
      <AnimatePresence>
        {step === 0 && (
          <motion.div
            key="bg"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0"
          >
            <img src={heroImg} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-hero-overlay" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative min-h-screen flex flex-col safe-top safe-bottom px-6 py-6 max-w-md mx-auto">
        <div className="flex items-center justify-between">
          <span className="font-display text-xl gradient-text-gold">Propix</span>
          {step < 2 && (
            <button onClick={skip} className="text-xs text-muted-foreground tap-highlight-none">
              Saltar
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-end pb-8">
          <AnimatePresence mode="wait">
            {step === 0 && <HeroStep key="0" />}
            {step === 1 && <HowStep key="1" />}
            {step === 2 && <SocialStep key="2" />}
          </AnimatePresence>

          {/* progress dots */}
          <div className="flex justify-center gap-1.5 mt-8 mb-6">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === step ? "w-8 bg-primary" : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="h-14 w-full rounded-2xl bg-gradient-gold text-primary-foreground font-semibold shadow-gold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] animate-gold-pulse"
          >
            {step === 2 ? "Crear mi cuenta gratis" : step === 0 ? "Comenzar" : "Siguiente"}
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={skip}
            className="h-12 mt-3 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Ya tengo cuenta
          </button>
        </div>
      </div>
    </div>
  );
}

function HeroStep() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <span className="inline-block text-[10px] tracking-[0.3em] text-primary glass px-3 py-1.5 rounded-full">
        PROPIX · DR
      </span>
      <h1 className="font-display text-5xl leading-[1.05] mt-5 text-balance">
        Invierte en el <em className="not-italic gradient-text-gold">Caribe</em>.
        <br /> Desde <span className="gradient-text-gold">$2,000</span>.
      </h1>
      <p className="text-muted-foreground text-base mt-4 max-w-sm text-balance">
        Propiedades reales en Punta Cana, curadas por el equipo Propix.
        Recibe ingresos mensuales en dólares directo a tu cuenta dominicana.
      </p>
    </motion.div>
  );
}

function HowStep() {
  const steps = [
    { icon: Home, title: "Escoge una propiedad", body: "Vacacionales en Punta Cana ya operando." },
    { icon: DollarSign, title: "Invierte desde $2,000", body: "Compra fracciones desde tu celular." },
    { icon: TrendingUp, title: "Recibe tu renta mensual", body: "Pagos en USD a tu cuenta dominicana." },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="font-display text-4xl leading-tight">¿Cómo funciona?</h2>
      <p className="text-muted-foreground mt-2">3 pasos simples para empezar a invertir.</p>
      <div className="mt-6 space-y-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.12 }}
            className="glass rounded-2xl p-4 flex items-center gap-4"
          >
            <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-gold-soft border border-primary/30 grid place-items-center">
              <s.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{s.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.body}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-5 leading-relaxed text-balance">
        Cada propiedad es evaluada y seleccionada por el equipo Propix antes de ser publicada.
      </p>

      <div className="mt-4 space-y-2">
        {[
          { icon: ShieldCheck, label: "Propiedades verificadas por Propix" },
          { icon: Search, label: "Due diligence completo antes de publicar" },
          { icon: Award, label: "Solo los mejores proyectos del Caribe" },
        ].map((b, i) => (
          <motion.div
            key={b.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 + i * 0.08 }}
            className="flex items-center gap-2.5 text-xs"
          >
            <span className="h-7 w-7 shrink-0 rounded-full bg-success/15 border border-success/30 grid place-items-center">
              <b.icon className="h-3.5 w-3.5 text-success" />
            </span>
            <span className="text-foreground/90">{b.label}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function SocialStep() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="flex -space-x-2">
          {["JR", "MP", "CS"].map((i) => (
            <div
              key={i}
              className="h-9 w-9 rounded-full bg-gradient-gold border-2 border-background grid place-items-center text-[10px] font-bold text-primary-foreground"
            >
              {i}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
          ))}
          <span className="text-xs text-muted-foreground ml-1">4.9 · 312 reseñas</span>
        </div>
      </div>
      <h2 className="font-display text-4xl leading-tight">
        Únete a <span className="gradient-text-gold">2,847</span> inversores dominicanos
      </h2>
      <div className="mt-7 grid grid-cols-3 gap-2">
        {[
          { v: "$4.2M", l: "Total invertido" },
          { v: "12", l: "Propiedades" },
          { v: "21.4%", l: "ROI promedio" },
        ].map((s) => (
          <div key={s.l} className="glass rounded-xl p-3 text-center">
            <p className="font-mono text-sm gradient-text-gold">{s.v}</p>
            <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{s.l}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
