import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { recentInvestors } from "@/lib/mockData";
import ScreenHeader from "@/components/ScreenHeader";
import ProgressBar from "@/components/ProgressBar";
import EmptyState from "@/components/EmptyState";
import { formatPct, formatUSD } from "@/lib/format";
import { Building2, Calendar, MapPin, Minus, Plus, Share2, Users } from "lucide-react";
import InvestSheet from "@/components/InvestSheet";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "sonner";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function PropertyDetail() {
  const { id } = useParams();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [amount, setAmount] = useState(1);
  const [open, setOpen] = useState(false);

  const currentUser = useAppStore((s) => s.user);
  const kycStatus = currentUser?.kycStatus || "pending";

  useEffect(() => {
    if (!id) return;
    const docRef = doc(db, "properties", id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setProperty({ id: docSnap.id, ...docSnap.data() });
      } else {
        setProperty(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  const handleInvestClick = () => {
    if (kycStatus === "verified") {
      setOpen(true);
      return;
    }

    if (kycStatus === "submitted" || kycStatus === "inReview") {
      toast.error("Tu verificación KYC está en proceso. Te notificaremos cuando tu perfil haya sido aprobado.");
      return;
    }

    // Check what profile/doc fields are missing to show context-sensitive error
    const missingDocs = !currentUser?.cedulaUploaded && !currentUser?.selfieUploaded && !currentUser?.addressUploaded && !currentUser?.incomeUploaded;
    const missingProfile = !currentUser?.cedula || !currentUser?.nationality || !currentUser?.profession || !currentUser?.economicActivity || !currentUser?.fundsSource;

    if (missingProfile) {
      toast.error("Por favor completa tu Información Personal en tu Perfil para poder invertir.", {
        description: "Haz clic en Perfil -> Información Personal.",
        duration: 5000,
      });
      return;
    }

    if (missingDocs) {
      toast.error("Por favor completa la subida de tus Documentos KYC en tu Perfil para poder invertir.", {
        description: "Haz clic en Perfil -> Documentos KYC.",
        duration: 5000,
      });
      return;
    }

    toast.error("Debes completar tu perfil y subir tus documentos de identidad antes de poder invertir.");
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

  const monthlyEst = (monthlyRent / totalFractions) * amount;
  const annualEst = monthlyEst * 12;

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
      <div className="relative -mt-[68px]">
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={galleryList[imgIdx] || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"}
            alt={property.name}
            className="h-full w-full object-cover transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {galleryList.map((_, i) => (
            <button
              key={i}
              onClick={() => setImgIdx(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === imgIdx ? "w-6 bg-primary" : "w-2 bg-foreground/30"
              }`}
            />
          ))}
        </div>
        <span className="absolute top-20 right-5 text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-full bg-success/20 text-success border border-success/30 backdrop-blur-md">
          {property.status === "rentando" ? "RENTANDO" : "DISPONIBLE"}
        </span>
      </div>

      <div className="px-5 -mt-8 relative space-y-6">
        <div>
          <h1 className="font-display text-4xl leading-tight">{property.name}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" /> {property.location} · {property.type}
          </p>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{property.description}</p>
        </div>

        {/* Metrics 2x2 */}
        <div className="grid grid-cols-2 gap-3">
          <Metric label="ROI Anual" value={formatPct(property.roiAnnual || 0)} accent="teal" />
          <Metric label="Renta mensual est." value={formatUSD(monthlyRent, { decimals: 0 })} />
          <Metric label="Precio total" value={formatUSD(totalPrice, { decimals: 0 })} />
          <Metric
            label="Fracciones disponibles"
            value={`${totalFractions - fractionsSold}/${totalFractions}`}
          />
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

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
            <CalcCell label="Fracciones" value={amount.toString()} />
            <CalcCell label="Mes" value={`+${formatUSD(monthlyEst)}`} highlight />
            <CalcCell label="Año" value={`+${formatUSD(annualEst, { decimals: 0 })}`} highlight />
          </div>
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

        {/* Map placeholder */}
        <div className="aspect-[16/9] rounded-2xl glass overflow-hidden relative grid place-items-center">
          <div className="absolute inset-0 bg-gradient-ocean opacity-60" />
          <div className="relative text-center">
            <MapPin className="h-8 w-8 text-primary mx-auto" />
            <p className="text-xs text-muted-foreground mt-2">{property.location}</p>
          </div>
        </div>

        {/* Developer — informational trust badge */}
        {property.developer && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <span>Desarrollado por</span>
            <span className="text-foreground font-medium">{property.developer.name}</span>
          </div>
        )}

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
        <div className="fixed bottom-0 inset-x-0 z-30 safe-bottom">
          <div className="mx-auto max-w-md px-5 pb-3 pt-3 bg-gradient-to-t from-background via-background/95 to-transparent">
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

function Metric({ label, value, accent }: { label: string; value: string; accent?: "teal" }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`font-mono text-xl mt-1 ${accent === "teal" ? "text-secondary" : "text-foreground"}`}>{value}</p>
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
