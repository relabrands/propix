import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav from "./BottomNav";
import { useAppStore } from "@/store/useAppStore";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
export default function AppLayout() {
  const location = useLocation();
  const currentUser = useAppStore((s) => s.user);
  const kycStatus = currentUser?.kycStatus || "pending";
  const needsProfile = !currentUser?.profileCompleted;

  return (
    <div className="relative min-h-screen">
      {/* Global KYC Warning Banner */}
      {kycStatus !== "verified" && (
        <div className="bg-amber-500/90 text-white px-4 py-2 flex items-center justify-between text-xs sticky top-0 z-50 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="font-medium">
              {kycStatus === "pending" 
                ? "Cuenta pendiente de aprobación. Completa tus datos." 
                : "Tus datos están en revisión por nuestro equipo."}
            </span>
          </div>
          {kycStatus === "pending" && (
            <Link to={needsProfile ? "/app/perfil/informacion" : "/app/perfil/kyc"} className="shrink-0 flex items-center gap-1 bg-white/20 hover:bg-white/30 transition-colors px-2.5 py-1 rounded-full font-semibold">
              Completar <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}

      <main className="mx-auto max-w-md min-h-screen pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
}
