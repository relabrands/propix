import { Outlet, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  ArrowLeftRight,
  Wallet,
  ShieldCheck,
  Megaphone,
  Settings,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  Crown,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

const NAV = [
  { to: "/admin", end: true, icon: LayoutDashboard, label: "Dashboard General" },
  { to: "/admin/propiedades", icon: Building2, label: "Propiedades" },
  { to: "/admin/inversores", icon: Users, label: "Inversores" },
  { to: "/admin/transacciones", icon: ArrowLeftRight, label: "Transacciones" },
  { to: "/admin/distribuciones", icon: Wallet, label: "Pagos y Distribuciones" },
  { to: "/admin/contabilidad", icon: BookOpen, label: "Contabilidad" },
  { to: "/admin/kyc", icon: ShieldCheck, label: "KYC / Verificaciones" },
  { to: "/admin/marketing", icon: Megaphone, label: "Marketing" },
  { to: "/admin/configuracion", icon: Settings, label: "Configuración" },
  { to: "/admin/notificaciones", icon: Bell, label: "Notificaciones" },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  
  const currentUser = useAppStore((s) => s.user);
  const fullName = currentUser?.name || currentUser?.displayName || "Administrador";
  const initials = fullName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() || "AD";
  const roleLabel = currentUser?.role === "admin" ? "Super Admin" : "Admin";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-[hsl(var(--surface))]/80 backdrop-blur-xl transition-all duration-300",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className="h-16 flex items-center gap-2 px-4 border-b border-border shrink-0">
          <div className="h-9 w-9 rounded-lg bg-gradient-gold flex items-center justify-center shadow-glow shrink-0">
            <span className="font-display text-lg text-primary-foreground font-semibold">P</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="font-display text-base leading-tight">Propix</div>
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-primary">
                <Crown className="h-2.5 w-2.5" /> Admin
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="adminActive"
                      className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-primary rounded-r-full shadow-glow"
                    />
                  )}
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="h-10 border-t border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* Main */}
      <div className={cn("flex-1 flex flex-col min-w-0 transition-all", collapsed ? "ml-16" : "ml-64")}>
        {/* Header */}
        <header className="h-16 sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border flex items-center gap-4 px-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar inversor, propiedad, transacción…"
              className="w-full h-9 rounded-md bg-muted/40 border border-border pl-9 pr-3 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/50 focus:bg-muted/60 transition-colors"
            />
          </div>
          <button className="relative h-9 w-9 rounded-md hover:bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary shadow-glow" />
          </button>
          <div className="flex items-center gap-3 pl-3 border-l border-border">
            <div className="text-right hidden md:block">
              <div className="text-xs font-medium leading-tight">{fullName}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{roleLabel}</div>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground text-sm font-semibold ring-2 ring-primary/30">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 relative z-[2]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
