import { Home, Compass, PieChart, Wallet, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const tabs = [
  { to: "/app", label: "Inicio", icon: Home, end: true },
  { to: "/app/explorar", label: "Explorar", icon: Compass },
  { to: "/app/portafolio", label: "Portafolio", icon: PieChart },
  { to: "/app/pagos", label: "Pagos", icon: Wallet },
  { to: "/app/perfil", label: "Perfil", icon: User },
];

export default function BottomNav() {
  const location = useLocation();
  // Hide on full-bleed flows
  if (
    location.pathname.startsWith("/onboarding") ||
    location.pathname.startsWith("/auth") ||
    location.pathname === "/"
  )
    return null;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 safe-bottom"
      aria-label="Navegación principal"
    >
      <div className="mx-auto max-w-md px-4 pb-3 pt-2">
        <div className="glass-strong rounded-2xl shadow-elevated px-2 py-1.5 flex items-center justify-between">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="relative flex-1 tap-highlight-none"
            >
              {({ isActive }) => (
                <div className="flex flex-col items-center gap-0.5 py-2 px-1">
                  <Icon
                    className={`h-5 w-5 transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                    strokeWidth={isActive ? 2.2 : 1.7}
                  />
                  <span
                    className={`text-[10px] font-medium tracking-wide transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                  {isActive && (
                    <motion.span
                      layoutId="nav-dot"
                      className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-primary shadow-glow"
                    />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
