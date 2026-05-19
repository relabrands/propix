import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AppLayout from "./components/AppLayout";
import Home from "./pages/app/Home";
import Explorar from "./pages/app/Explorar";
import PropertyDetail from "./pages/app/PropertyDetail";
import Portafolio from "./pages/app/Portafolio";
import Pagos from "./pages/app/Pagos";
import Perfil from "./pages/app/Perfil";
import Notificaciones from "./pages/app/Notificaciones";
import PerfilInformacion from "./pages/app/perfil/InformacionPersonal";
import PerfilKYC from "./pages/app/perfil/DocumentosKYC";
import PerfilSeguridad from "./pages/app/perfil/Seguridad";
import PerfilNotifPrefs from "./pages/app/perfil/PreferenciasNotificaciones";
import PerfilReportes from "./pages/app/perfil/Reportes";
import PerfilFiscal from "./pages/app/perfil/HistorialFiscal";
import PerfilAyuda from "./pages/app/perfil/CentroAyuda";
import PerfilTerminos from "./pages/app/perfil/Terminos";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminPropiedades from "./pages/admin/Propiedades";
import AdminNuevaPropiedad from "./pages/admin/NuevaPropiedad";
import AdminInversores from "./pages/admin/Inversores";
import AdminTransacciones from "./pages/admin/Transacciones";
import AdminDistribuciones from "./pages/admin/Distribuciones";
import AdminKYC from "./pages/admin/KYC";
import AdminMarketing from "./pages/admin/Marketing";
import AdminConfiguracion from "./pages/admin/Configuracion";
import AdminNotificaciones from "./pages/admin/Notificaciones";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAppStore } from "@/store/useAppStore";

const queryClient = new QueryClient();

const App = () => {
  const setAuthed = useAppStore((s) => s.setAuthed);
  const setUser = useAppStore((s) => s.setUser);

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthed(true);
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        });

        // Listen to real-time changes in the Firestore user profile
        unsubscribeFirestore = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUser({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              ...docSnap.data()
            });
          }
        }, (error) => {
          console.error("Error fetching user profile:", error);
        });
      } else {
        setAuthed(false);
        setUser(null);
        if (unsubscribeFirestore) {
          unsubscribeFirestore();
          unsubscribeFirestore = null;
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, [setAuthed, setUser]);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" theme="dark" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="explorar" element={<Explorar />} />
            <Route path="propiedad/:id" element={<PropertyDetail />} />
            <Route path="portafolio" element={<Portafolio />} />
            <Route path="pagos" element={<Pagos />} />
            <Route path="perfil" element={<Perfil />} />
            <Route path="perfil/informacion" element={<PerfilInformacion />} />
            <Route path="perfil/kyc" element={<PerfilKYC />} />
            <Route path="perfil/seguridad" element={<PerfilSeguridad />} />
            <Route path="perfil/notificaciones" element={<PerfilNotifPrefs />} />
            <Route path="perfil/reportes" element={<PerfilReportes />} />
            <Route path="perfil/fiscal" element={<PerfilFiscal />} />
            <Route path="perfil/ayuda" element={<PerfilAyuda />} />
            <Route path="perfil/terminos" element={<PerfilTerminos />} />
            <Route path="notificaciones" element={<Notificaciones />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="propiedades" element={<AdminPropiedades />} />
            <Route path="propiedades/nueva" element={<AdminNuevaPropiedad />} />
            <Route path="inversores" element={<AdminInversores />} />
            <Route path="transacciones" element={<AdminTransacciones />} />
            <Route path="distribuciones" element={<AdminDistribuciones />} />
            <Route path="kyc" element={<AdminKYC />} />
            <Route path="marketing" element={<AdminMarketing />} />
            <Route path="configuracion" element={<AdminConfiguracion />} />
            <Route path="notificaciones" element={<AdminNotificaciones />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
