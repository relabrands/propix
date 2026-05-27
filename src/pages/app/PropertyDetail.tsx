import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { recentInvestors } from "@/lib/mockData";
import ScreenHeader from "@/components/ScreenHeader";
import ProgressBar from "@/components/ProgressBar";
import EmptyState from "@/components/EmptyState";
import { formatPct, formatUSD } from "@/lib/format";
import { Building2, Calendar, MapPin, Minus, Plus, Share2, Users, ChevronLeft, ChevronRight, TrendingUp, FileText, Download, ShieldCheck } from "lucide-react";
import InvestSheet from "@/components/InvestSheet";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";
import { doc, onSnapshot, collection, query as fsQuery, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

import type { Property } from "@/lib/mockData";

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [amount, setAmount] = useState(1);
  const [open, setOpen] = useState(false);
  const [userInvestment, setUserInvestment] = useState<{ fractions: number; amount: number } | null>(null);

  // Slider touch states
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const currentUser = useAppStore((s) => s.user);
  const kycStatus = currentUser?.kycStatus || "pending";

  useEffect(() => {
    if (!id) return;
    const docRef = doc(db, "properties", id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setProperty({ id: docSnap.id, ...docSnap.data() } as unknown as Property);
      } else {
        setProperty(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (!id || !currentUser?.uid) return;
    const qInv = fsQuery(
      collection(db, "investments"),
      where("userId", "==", currentUser.uid),
      where("propertyId", "==", id)
    );
    const unsubInv = onSnapshot(qInv, (snap) => {
      if (!snap.empty) {
        let totalFractions = 0;
        let totalInvested = 0;
        snap.forEach((d) => {
          totalFractions += d.data().fractionsCount || 0;
          totalInvested += d.data().investedAmount || 0;
        });
        setUserInvestment({ fractions: totalFractions, amount: totalInvested });
      } else {
        setUserInvestment(null);
      }
    });
    return () => unsubInv();
  }, [id, currentUser?.uid]);

  const handleInvestClick = () => {
    if (kycStatus === "verified") {
      setOpen(true);
      return;
    }

    // Check what profile/doc fields are missing to show context-sensitive error
    const missingProfile = !currentUser?.cedula || !currentUser?.nationality || !currentUser?.profession || !currentUser?.economicActivity || !currentUser?.fundsSource;
    const missingDocs = !currentUser?.cedulaUrl || !currentUser?.selfieUrl || !currentUser?.addressUrl || !currentUser?.incomeUrl;

    if (missingProfile) {
      toast.error("Falta Información Personal", {
        description: "Haz clic en Perfil -> Información Personal para completarla.",
        duration: 5000,
      });
      return;
    }

    if (missingDocs) {
      toast.error("Faltan Documentos KYC", {
        description: "Haz clic en Perfil -> Documentos KYC para subirlos.",
        duration: 5000,
      });
      return;
    }

    if (kycStatus === "submitted" || kycStatus === "inReview") {
      toast.error("Tu verificación KYC está en proceso.", {
        description: "Te notificaremos cuando tu perfil haya sido aprobado.",
      });
      return;
    }

    if (kycStatus === "pending" || kycStatus === "rejected" || kycStatus !== "verified") {
      toast.error("Aún tu cuenta no está verificada para invertir.", {
        description: "Por favor espera a que tu cuenta sea aprobada.",
        duration: 5000,
      });
      return;
    }
  };

  if (loading) {
    return (
      <div className="pb-8">
        <ScreenHeader back title="Cargando..." />
        <div className="text-center py-12 text-muted-foreground text-sm">
          Cargando detalles de la propiedad...
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="pb-8">
        <ScreenHeader back title="Propiedad" />
        <div className="px-5">
          <EmptyState
            subtitle="Esta propiedad ya no está disponible o aún no ha sido publicada."
          />
          <Link
            to="/app/explorar"
            className="mt-5 h-12 w-full rounded-2xl bg-gradient-gold text-primary-foreground font-semibold shadow-gold flex items-center justify-center"
          >
            Explorar propiedades
          </Link>
        </div>
      </div>
    );
  }

  const pct = Math.round(((property.fractionsSold || 0) / (property.totalFractions || 1)) * 100);
  const pricePerFraction = property.pricePerFraction || 0;
  const totalFractions = property.totalFractions || 1;
  const fractionsSold = property.fractionsSold || 0;
  const totalPrice = property.totalPrice || 0;
  const monthlyRent = property.monthlyIncomeEstimate || 0;

  const subtotal = amount * pricePerFraction;
  const grossRoi = property.roiAnnual || 0;
  const mgmtFeePct = property.managementFeeAnnual ?? 1.0; // default 1% anual
  const netRoi = Math.max(0, grossRoi - mgmtFeePct);

  // Gross numbers (before fee)
  const grossAnnual = subtotal * (grossRoi / 100);
  const grossMonthly = grossAnnual / 12;

  // Management fee amounts
  const feeAnnual = subtotal * (mgmtFeePct / 100);
  const feeMonthly = feeAnnual / 12;

  // Net numbers (after fee)
  const annualEst = subtotal * (netRoi / 100);
  const monthlyEst = annualEst / 12;

  const galleryList = property.gallery && property.gallery.length > 0 ? property.gallery : [property.image];

  return (
    <div className="pb-32">
      <ScreenHeader
        back
        showBell={false}
        transparent
        right={
          <button className="h-10 w-10 glass rounded-full grid place-items-center" aria-label="Compartir">
            <Share2 className="h-4 w-4" />
          </button>
        }
      />

      {/* Hero gallery */}
      <div 
        className="relative -mt-[68px]"
        onTouchStart={(e) => {
          setTouchEnd(null);
          setTouchStart(e.targetTouches[0].clientX);
        }}
        onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
        onTouchEnd={() => {
          if (!touchStart || !touchEnd) return;
          const distance = touchStart - touchEnd;
          const isLeftSwipe = distance > 50;
          const isRightSwipe = distance < -50;
          
          if (isLeftSwipe) {
            setImgIdx(prev => (prev === galleryList.length - 1 ? 0 : prev + 1));
          }
          if (isRightSwipe) {
            setImgIdx(prev => (prev === 0 ? galleryList.length - 1 : prev - 1));
          }
        }}
      >
        <div className="aspect-[4/3] overflow-hidden relative">
          <img
            src={galleryList[imgIdx] || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"}
            alt={property.name}
            className="h-full w-full object-cover transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          
          {/* Slider Navigation Buttons */}
          {galleryList.length > 1 && (
            <>
              <button 
                onClick={() => setImgIdx(prev => (prev === 0 ? galleryList.length - 1 : prev - 1))}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors"
                aria-label="Anterior foto"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button 
                onClick={() => setImgIdx(prev => (prev === galleryList.length - 1 ? 0 : prev + 1))}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors"
                aria-label="Siguiente foto"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
        
        {/* Indicators - moved up slightly to avoid text overlap */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {galleryList.length > 1 && galleryList.map((_, i) => (
            <button
              key={i}
              onClick={() => setImgIdx(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === imgIdx ? "w-6 bg-primary" : "w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
        <span className="absolute top-20 right-5 z-10 text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-full bg-success/20 text-success border border-success/30 backdrop-blur-md">
          {property.status === "rentando" ? "RENTANDO" : "DISPONIBLE"}
        </span>
      </div>

      <div className="px-5 -mt-4 relative z-20 space-y-6">
        <div>
          <h1 className="font-display text-4xl leading-tight">{property.name}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" /> {property.location} · {property.type}
          </p>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{property.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Metric label="ROI Anual" value={`${grossRoi}%`} accent="gold" />
          <Metric label="Precio total" value={formatUSD(totalPrice, { decimals: 0 })} />
          <Metric
            label="Fracciones disponibles"
            value={`${totalFractions - fractionsSold}/${totalFractions}`}
          />
          {property.returnsStart && (
            <Metric label="Inicio de retornos" value={property.returnsStart} accent="gold" />
          )}
          <Metric label="Vigencia (Exit)" value={`${property.investmentTerm || 36} meses`} accent="gold" />
          <div className="col-span-2 mt-2">
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Rentabilidad + Plusvalía</p>
                <p className="text-xs text-muted-foreground mt-1">Además de la renta mensual, al cumplir {property.investmentTerm || 36} meses el inmueble se vende (Exit) y las ganancias de capital se reparten entre los inversores.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Funding */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-mono">{pct}% financiado</span>
            <span className="text-muted-foreground text-xs">
              {formatUSD(fractionsSold * pricePerFraction, { decimals: 0 })} / {formatUSD(totalPrice, { decimals: 0 })}
            </span>
          </div>
          <ProgressBar value={pct} />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" /> {property.investorsCount || 0} inversores
            </span>
            {property.daysLeft > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" /> {property.daysLeft} días restantes
              </span>
            )}
          </div>
        </div>

        {/* Calculator */}
        <div className="glass rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl">Calculadora de retorno</h3>
            <span className="text-[10px] tracking-widest text-muted-foreground">SIMULA</span>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">¿Cuántas fracciones quieres?</p>
            <div className="flex items-center justify-between glass rounded-2xl p-2">
              <button
                onClick={() => setAmount(Math.max(1, amount - 1))}
                className="h-11 w-11 rounded-xl bg-surface grid place-items-center active:scale-95 transition"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="text-center">
                <p className="font-mono text-2xl">{amount}</p>
                <p className="text-[10px] text-muted-foreground">{formatUSD(amount * pricePerFraction, { decimals: 0 })} USD</p>
              </div>
              <button
                onClick={() => setAmount(Math.min(totalFractions - fractionsSold, amount + 1))}
                className="h-11 w-11 rounded-xl bg-gradient-gold text-primary-foreground grid place-items-center active:scale-95 transition shadow-gold"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <input
              type="range"
              min={1}
              max={Math.max(1, totalFractions - fractionsSold)}
              step={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full mt-4 accent-primary"
            />
          </div>

          {/* Return breakdown */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Retorno mensual estimado</span>
              <span className="font-mono text-lg font-bold text-success">+{formatUSD(grossMonthly)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Proyección anual</span>
              <span className="font-mono">+{formatUSD(grossAnnual, { decimals: 0 })}</span>
            </div>
          </div>

          {fractionsSold < totalFractions && (
            <div className="pt-2 hidden md:block">
              <button
                onClick={handleInvestClick}
                className="h-12 w-full rounded-2xl bg-gradient-gold text-primary-foreground font-semibold shadow-gold flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              >
                Invertir {formatUSD(amount * pricePerFraction, { decimals: 0 })}
              </button>
            </div>
          )}
        </div>

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <div>
            <h3 className="font-display text-2xl mb-3">Amenidades</h3>
            <div className="flex flex-wrap gap-2">
              {property.amenities.map((a: string) => (
                <span
                  key={a}
                  className="text-xs px-3 py-1.5 rounded-full glass"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Map placeholder -> Google Maps Iframe */}
        <div className="aspect-[16/9] rounded-2xl glass overflow-hidden relative">
          <iframe 
            src={`https://maps.google.com/maps?q=${encodeURIComponent(property.location + (property.address ? ", " + property.address : ""))}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
            className="absolute inset-0 w-full h-full border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* Developer — informational trust badge */}
        {property.developer && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <span>Desarrollado por</span>
            <span className="text-foreground font-medium">{property.developer.name}</span>
          </div>
        )}

        {/* Legal & Financial Documents */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="font-display text-xl">Documentos de Respaldo</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Revisa la documentación legal y financiera que valida esta oportunidad de inversión en República Dominicana.
          </p>
          
          <div className="space-y-3">
            <div className="glass-strong rounded-2xl p-4 border-l-2 border-l-primary/50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">1. Legal del Inmueble</h4>
              <div className="space-y-2">
                <DocLink 
                  title="Certificación de Estado Jurídico" 
                  desc="Prueba de propiedad sin cargas ni gravámenes" 
                  url={property.documents?.legalCertificacion} 
                  color="primary" 
                />
                <DocLink 
                  title="Contrato de Promesa de Venta" 
                  desc="Asegura la adquisición del inmueble" 
                  url={property.documents?.legalContrato} 
                  color="primary" 
                />
              </div>
            </div>

            <div className="glass-strong rounded-2xl p-4 border-l-2 border-l-secondary/50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">2. Financiera</h4>
              <div className="space-y-2">
                <DocLink 
                  title="Proforma Financiera" 
                  desc="Desglose de rentabilidad (Business Case)" 
                  url={property.documents?.finProforma} 
                  color="secondary" 
                />
                <DocLink 
                  title="Estudio de Mercado (Comps)" 
                  desc="Justificación de ingresos y ocupación" 
                  url={property.documents?.finEstudio} 
                  color="secondary" 
                />
              </div>
            </div>

            <div className="glass-strong rounded-2xl p-4 border-l-2 border-l-emerald-500/50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">3. La Inversión</h4>
              <div className="space-y-2">
                <DocLink 
                  title="Resumen de Condiciones (Term Sheet)" 
                  desc="Vigencia, pagos y estrategia de salida" 
                  url={property.documents?.invTermSheet} 
                  color="emerald-500" 
                />
                <DocLink 
                  title="Borrador del Contrato" 
                  desc="Modelo de Asociación en Participación" 
                  url={property.documents?.invBorrador} 
                  color="emerald-500" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent investors */}
        {recentInvestors.length > 0 && (
          <div>
            <h3 className="font-display text-2xl mb-3">Inversores recientes</h3>
            <div className="space-y-2">
              {recentInvestors.map((i, k) => (
                <div key={k} className="glass rounded-xl p-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-surface border border-border grid place-items-center text-[10px] font-bold">
                    {i.initials}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{i.initials}</span> invirtió{" "}
                      <span className="font-mono text-primary">{formatUSD(i.amount, { decimals: 0 })}</span>
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{i.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      {fractionsSold < totalFractions ? (
        <div className="fixed bottom-0 inset-x-0 z-30 safe-bottom pointer-events-none">
          <div className="mx-auto max-w-md px-5 pb-3 pt-6 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-auto">
            {userInvestment && (
              <div className="mb-3 px-4 py-3 rounded-2xl glass-strong border-primary/20 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Tu inversión actual</p>
                  <p className="text-sm font-semibold text-primary">
                    {userInvestment.fractions} fracc. ({formatUSD(userInvestment.amount, { decimals: 0 })})
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary text-xs font-bold">✓</span>
                </div>
              </div>
            )}
            <button
              onClick={handleInvestClick}
              className="h-14 w-full rounded-2xl bg-gradient-gold text-primary-foreground font-semibold shadow-gold flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
            >
              Invertir {formatUSD(amount * pricePerFraction, { decimals: 0 })}
            </button>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-0 inset-x-0 z-30 safe-bottom">
          <div className="mx-auto max-w-md px-5 pb-3 pt-3 bg-gradient-to-t from-background via-background/95 to-transparent">
            <button
              disabled
              className="h-14 w-full rounded-2xl bg-muted text-muted-foreground font-semibold flex items-center justify-center gap-2"
            >
              Fondeo Completado
            </button>
          </div>
        </div>
      )}

      <InvestSheet
        open={open}
        onClose={() => setOpen(false)}
        property={property}
        initialAmount={amount}
      />
    </div>
  );
}

interface MetricProps { label: string; value: string; accent?: "teal" | "gold" }
function Metric(props: MetricProps) {
  const { label, value, accent } = props;
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`font-mono text-lg mt-1 ${accent === "teal" ? "text-teal-400" : accent === "gold" ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

interface DocLinkProps {
  title: string;
  desc: string;
  url?: string;
  color: string;
}

function DocLink({ title, desc, url, color }: DocLinkProps) {
  const isAvailable = !!url;
  
  const colorMap = {
    primary: {
      bg: "bg-primary/10",
      text: "text-primary",
      hover: "group-hover:text-primary"
    },
    secondary: {
      bg: "bg-secondary/10",
      text: "text-secondary",
      hover: "group-hover:text-secondary"
    },
    "emerald-500": {
      bg: "bg-emerald-500/10",
      text: "text-emerald-500",
      hover: "group-hover:text-emerald-500"
    }
  };

  const theme = colorMap[color as keyof typeof colorMap];

  const content = (
    <>
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 rounded-lg ${theme.bg} grid place-items-center shrink-0`}>
          <FileText className={`h-4 w-4 ${theme.text}`} />
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-[10px] text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Download className={`h-4 w-4 ${isAvailable ? `text-muted-foreground ${theme.hover} transition-colors` : 'text-muted-foreground/30'}`} />
    </>
  );

  if (isAvailable) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left group">
        {content}
      </a>
    );
  }

  return (
    <div className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 opacity-50 cursor-not-allowed text-left">
      {content}
    </div>
  );
}

function CalcCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`font-mono text-sm mt-1 ${highlight ? "text-success" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
