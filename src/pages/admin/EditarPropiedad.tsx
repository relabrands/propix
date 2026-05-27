import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Check, Upload, ImagePlus, FileText, ArrowRight, ArrowLeft, Send, AlertCircle, Loader2 } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import StatusPill from "@/components/admin/StatusPill";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";

const STEPS = [
  { id: 1, label: "Información básica" },
  { id: 2, label: "Fotos y medios" },
  { id: 3, label: "Documentos legales" },
  { id: 4, label: "Revisar y publicar" },
];

const REQUIRED_DOCS = [
  "Título de propiedad",
  "Certificado de no deuda",
  "Planos del proyecto",
  "Contrato de administración",
  "Registro mercantil de la desarrolladora",
];

const AMENITIES_LIST = [
  "Piscina",
  "Gimnasio",
  "Seguridad 24/7",
  "Vista al mar",
  "Ascensor",
  "Parqueo",
  "Área social",
  "Balcón",
  "Línea blanca",
  "Amueblado"
];

const PROVINCIAS_RD = [
  "La Altagracia",
  "La Romana",
  "Samaná",
  "Puerto Plata",
  "Distrito Nacional",
  "Santo Domingo",
  "Santiago",
  "María Trinidad Sánchez",
];

export default function EditarPropiedad() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Step 1
  const [name, setName] = useState("");
  const [developer, setDeveloper] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Apartamento");
  const [province, setProvince] = useState("La Altagracia");
  const [sector, setSector] = useState("");
  const [address, setAddress] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [totalPrice, setTotalPrice] = useState(80000);
  const [fractions, setFractions] = useState(80);
  const [roi, setRoi] = useState(20);
  const [monthlyRent, setMonthlyRent] = useState(1500);
  const [returnsStart, setReturnsStart] = useState("Inmediatamente");
  const fractionPrice = useMemo(() => (fractions > 0 ? totalPrice / fractions : 0), [totalPrice, fractions]);

  useEffect(() => {
    if (!id) return;
    
    getDoc(doc(db, "properties", id)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setName(data.name || "");
        setDeveloper(data.developer?.name || "");
        setDescription(data.description || "");
        setType(data.type || "Apartamento");
        setTotalPrice(data.totalPrice || 0);
        setFractions(data.totalFractions || 0);
        setRoi(data.roiAnnual || 0);
        setMonthlyRent(data.monthlyIncomeEstimate || 0);
        setReturnsStart(data.returnsStart || "Inmediatamente");
        setPhotos(data.gallery || []);
        setDocs(data.documents || {});
        setTour(data.tourUrl || "");
        setSelectedAmenities(data.amenities || []);
        
        // Extract province and sector from location
        if (data.location) {
          const parts = data.location.split(", ");
          if (parts.length === 2) {
            setSector(parts[0] === "Sin sector" ? "" : parts[0]);
            setProvince(parts[1]);
          } else {
            setSector(data.location);
          }
        }
        setAddress(data.address || "");
      } else {
        toast.error("Propiedad no encontrada");
        navigate("/admin/propiedades");
      }
    }).catch((err) => {
      console.error(err);
      toast.error("Error al cargar la propiedad");
    }).finally(() => {
      setLoading(false);
    });
  }, [id, navigate]);

  // Step 2
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [tour, setTour] = useState("");

  // Step 3
  const [docs, setDocs] = useState<Record<string, string>>({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const docTypeRef = useRef<string>("");

  const step2Valid = photos.length >= 1;
  const step3Valid = Object.keys(docs).length > 0;

  const next = () => {
    if (step === 1) {
      if (name.length <= 3) {
        toast.error("Nombre muy corto", { description: "El nombre del proyecto debe tener más de 3 caracteres." });
        return;
      }
      if (developer.length <= 2) {
        toast.error("Desarrolladora inválida", { description: "El nombre de la desarrolladora es muy corto." });
        return;
      }
      if (description.length <= 10) {
        toast.error("Descripción muy corta", { description: "La descripción debe tener al menos 10 caracteres." });
        return;
      }
      if (!sector) {
        toast.error("Sector requerido", { description: "Debes especificar el sector de la propiedad." });
        return;
      }
      if (totalPrice <= 0 || fractions <= 0) {
        toast.error("Datos financieros inválidos", { description: "El precio total y el número de fracciones deben ser mayores a 0." });
        return;
      }
    }
    if (step === 2 && !step2Valid) {
      toast.error("Falta foto", { description: "Sube al menos 1 foto para continuar." });
      return;
    }
    if (step === 3 && !step3Valid) {
      toast.error("Faltan documentos", { description: "Sube al menos 1 documento legal para continuar." });
      return;
    }
    setStep((s) => Math.min(4, s + 1));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingPhotos(true);
    try {
      const newPhotos = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`El archivo ${file.name} supera los 10MB`);
          continue;
        }
        const fileRef = ref(storage, `properties_temp/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        newPhotos.push(url);
      }
      setPhotos((p) => [...p, ...newPhotos].slice(0, 20));
      toast.success("Fotos subidas exitosamente");
    } catch (err) {
      console.error(err);
      toast.error("Error al subir fotos");
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const docType = docTypeRef.current;
    if (!docType) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error(`El archivo supera los 10MB`);
      return;
    }

    setUploadingDoc(docType);
    try {
      const fileRef = ref(storage, `properties_temp/docs/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setDocs((prev) => ({ ...prev, [docType]: url }));
      toast.success("Documento subido exitosamente");
    } catch (err) {
      console.error(err);
      toast.error("Error al subir documento");
    } finally {
      setUploadingDoc(null);
    }
  };

  const triggerDocUpload = (docType: string) => {
    docTypeRef.current = docType;
    docInputRef.current?.click();
  };

  const submit = async () => {
    try {
      if (!id) return;
      const updatedProperty = {
        name,
        "developer.name": developer,
        description,
        type,
        location: `${sector || "Sin sector"}, ${province}`,
        address,
        totalPrice,
        totalFractions: fractions,
        pricePerFraction: fractionPrice,
        roiAnnual: roi,
        monthlyIncomeEstimate: monthlyRent,
        managementFeeAnnual: 5, // platform-level management fee (5% of monthly rent)
        image: photos.length > 0 ? photos[0] : "",
        gallery: photos,
        documents: docs,
        tourUrl: tour,
        amenities: selectedAmenities,
        returnsStart,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, "properties", id), updatedProperty);
      setSubmitted(true);
      toast.success("Propiedad actualizada", { description: `Los cambios en ${name} se guardaron.` });
    } catch (err: unknown) {
      console.error("Error updating property:", err);
      toast.error("Error al actualizar la propiedad");
    }
  };

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-lg border border-border bg-[hsl(var(--surface))] p-8 text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-success/10 border border-success/30 flex items-center justify-center">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h2 className="font-display text-3xl">¡Cambios guardados!</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            "{name}" ha sido actualizada exitosamente en la plataforma.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => navigate("/admin/propiedades")}
              className="h-10 px-4 rounded-md border border-border text-sm hover:border-border-strong transition-colors"
            >
              Ver listado
            </button>
            <button
              onClick={() => navigate(`/admin/propiedades/${id}`)}
              className="h-10 px-4 rounded-md bg-gradient-gold text-primary-foreground text-sm font-medium hover:shadow-glow transition-shadow"
            >
              Volver a la propiedad
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando datos...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Editar propiedad"
        subtitle="Actualiza los detalles e información de esta propiedad."
      />

      {/* Stepper */}
      <div className="rounded-lg border border-border bg-[hsl(var(--surface))] p-5">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const done = step > s.id;
            const current = step === s.id;
            return (
              <div key={s.id} className="flex-1 flex items-center">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-mono shrink-0 transition-all",
                    current && "bg-primary border-primary text-primary-foreground shadow-glow",
                    done && "bg-success border-success text-success-foreground",
                    !current && !done && "border-border text-muted-foreground",
                  )}>
                    {done ? <Check className="h-3.5 w-3.5" /> : s.id}
                  </div>
                  <div className={cn("text-xs hidden md:block", current ? "text-primary font-medium" : done ? "text-foreground" : "text-muted-foreground")}>
                    {s.label}
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-3 bg-border relative overflow-hidden">
                    <div className={cn("h-full bg-gradient-gold transition-all duration-500", done ? "w-full" : "w-0")} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-lg border border-border bg-[hsl(var(--surface))] p-6">
        {step === 1 && (
          <div className="space-y-5">
            <h3 className="font-display text-xl">Información básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nombre del proyecto" required>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Residencial Marina Bayahibe" className="np-input" />
              </Field>
              <Field label="Tipo de propiedad" required>
                <select value={type} onChange={(e) => setType(e.target.value)} className="np-input">
                  <option>Apartamento</option>
                  <option>Villa</option>
                  <option>Penthouse</option>
                  <option>Estudio</option>
                  <option>Hotel</option>
                  <option>Local comercial</option>
                </select>
              </Field>
              <Field label="Nombre de la desarrolladora" required full hint="Solo informativo — se muestra como sello de confianza en la app">
                <input value={developer} onChange={(e) => setDeveloper(e.target.value)} placeholder="Ej: Constructora Caribe S.R.L." className="np-input" />
              </Field>
              <Field label="Descripción" required full>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe la propiedad, ubicación y atractivo turístico…" className="np-input resize-none" />
                <div className="text-[10px] text-muted-foreground text-right mt-1">{description.length}/500</div>
              </Field>
              <Field label="Provincia" required>
                <select value={province} onChange={(e) => setProvince(e.target.value)} className="np-input">
                  {PROVINCIAS_RD.map((p) => <option key={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Sector" required>
                <input value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Ej: Bávaro, Cap Cana" className="np-input" />
              </Field>
              <Field label="Dirección" full>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Av. Estados Unidos, frente a…" className="np-input" />
              </Field>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-medium mb-3">Estructura financiera</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Precio total de venta (USD)" required>
                  <input type="number" value={totalPrice} onChange={(e) => setTotalPrice(Number(e.target.value))} className="np-input font-mono" />
                </Field>
                <Field label="Número de fracciones" required>
                  <input type="number" value={fractions} onChange={(e) => setFractions(Number(e.target.value))} className="np-input font-mono" />
                </Field>
                <Field label="Precio por fracción (auto)">
                  <div className="np-input font-mono text-primary bg-primary/5 border-primary/20 flex items-center">${fractionPrice.toFixed(2)}</div>
                </Field>
                <Field label="ROI anual proyectado (%)" required>
                  <input type="number" step="0.1" value={roi} onChange={(e) => setRoi(Number(e.target.value))} className="np-input font-mono" />
                </Field>
                <Field label="Renta mensual estimada (USD)" required full>
                  <input type="number" value={monthlyRent} onChange={(e) => setMonthlyRent(Number(e.target.value))} className="np-input font-mono" />
                </Field>
                <Field label="Inicio de retornos" required>
                  <select value={returnsStart} onChange={e => setReturnsStart(e.target.value)} className="np-input font-medium">
                    <option value="Inmediatamente">Inmediatamente</option>
                    <option value="Al completar fondeo">Al completar fondeo</option>
                  </select>
                </Field>
                {/* Commission Info Box */}
                <div className="md:col-span-2 rounded-lg border border-border bg-muted/10 p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comisiones de plataforma aplicadas automáticamente</p>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
                      <p className="font-bold text-primary">2% Upfront Fee</p>
                      <p className="text-muted-foreground mt-1">Cobrado al inversor en el momento de invertir, sobre el monto de inversión.</p>
                    </div>
                    <div className="rounded-md border border-secondary/20 bg-secondary/5 p-3">
                      <p className="font-bold text-secondary">5% Management Fee</p>
                      <p className="text-muted-foreground mt-1">Cobrado mensualmente sobre la renta bruta. El inversor recibe el 95% restante.</p>
                    </div>
                    <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3">
                      <p className="font-bold text-amber-400">15% Success Fee</p>
                      <p className="text-muted-foreground mt-1">Única vez al Exit (~3 años), sobre la plusvalía neta generada al vender el inmueble.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-medium mb-3">Amenidades</h4>
              <div className="flex flex-wrap gap-2">
                {AMENITIES_LIST.map((am) => {
                  const isSelected = selectedAmenities.includes(am);
                  return (
                    <button
                      key={am}
                      onClick={() =>
                        setSelectedAmenities((prev) =>
                          isSelected ? prev.filter((a) => a !== am) : [...prev, am]
                        )
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface border border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {am}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="font-display text-xl">Fotos y medios</h3>
              <p className="text-xs text-muted-foreground mt-1">Mínimo 1 foto · máximo 20 · la primera será la portada</p>
            </div>

            <input
              type="file"
              ref={photoInputRef}
              onChange={handlePhotoUpload}
              multiple
              accept="image/jpeg, image/png, image/webp"
              className="hidden"
            />
            <div
              className="border-2 border-dashed border-border rounded-lg p-10 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
              onClick={() => photoInputRef.current?.click()}
            >
              {uploadingPhotos ? (
                <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin mb-3" />
              ) : (
                <ImagePlus className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              )}
              <div className="text-sm font-medium">
                {uploadingPhotos ? "Subiendo fotos..." : "Arrastra fotos aquí o haz clic para subir"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">JPG, PNG hasta 10MB · Recomendado 1920×1080</div>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {photos.map((p, i) => (
                  <div key={p} className="aspect-square rounded-md bg-gradient-to-br from-muted to-background border border-border relative group overflow-hidden">
                    {i === 0 && (
                      <div className="absolute top-2 left-2 z-10">
                        <StatusPill tone="gold">Portada</StatusPill>
                      </div>
                    )}
                    <img src={p} alt={`Foto ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                    <button
                      onClick={() => setPhotos((arr) => arr.filter((_, idx) => idx !== i))}
                      className="absolute inset-0 bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-medium z-20"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Field label="Tour virtual (opcional)" full>
              <input value={tour} onChange={(e) => setTour(e.target.value)} placeholder="https://my.matterport.com/show/?m=…" className="np-input" />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h3 className="font-display text-xl">Documentos legales</h3>
              <p className="text-xs text-muted-foreground mt-1">Sube al menos 1 documento en PDF · máx 10MB cada uno</p>
            </div>

            <input
              type="file"
              ref={docInputRef}
              onChange={handleDocUpload}
              accept="application/pdf"
              className="hidden"
            />
            <div className="space-y-2">
              {REQUIRED_DOCS.map((d) => {
                const uploaded = !!docs[d];
                const isUploading = uploadingDoc === d;
                return (
                  <div key={d} className={cn("flex items-center gap-3 p-3 rounded-md border transition-colors", uploaded ? "border-success/40 bg-success/5" : "border-border hover:border-border-strong")}>
                    <div className={cn("h-8 w-8 rounded-md flex items-center justify-center shrink-0", uploaded ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : uploaded ? <Check className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{d}</div>
                      <div className="text-[11px] text-muted-foreground">{uploaded ? "Documento subido" : "Pendiente · PDF requerido"}</div>
                    </div>
                    <button
                      disabled={isUploading}
                      onClick={() => triggerDocUpload(d)}
                      className={cn(
                        "h-8 px-3 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors",
                        uploaded ? "bg-muted hover:bg-muted/70 text-muted-foreground" : "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20",
                        isUploading && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isUploading ? "Subiendo..." : uploaded ? "Reemplazar" : <><Upload className="h-3.5 w-3.5" /> Subir</>}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h3 className="font-display text-xl">Revisar y publicar</h3>
              <p className="text-xs text-muted-foreground mt-1">Verifica los datos antes de publicar la propiedad en la app</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Summary label="Nombre" value={name || "—"} />
              <Summary label="Desarrolladora" value={developer || "—"} />
              <Summary label="Tipo" value={type} />
              <Summary label="Ubicación" value={`${sector || "—"}, ${province}`} />
              <Summary label="Precio total" value={`$${totalPrice.toLocaleString()}`} mono />
              <Summary label="Fracciones" value={`${fractions} × $${fractionPrice.toFixed(2)}`} mono />
              <Summary label="ROI / Renta" value={`${roi}% · $${monthlyRent}/mes`} mono />
              <Summary label="Fotos" value={`${photos.length} subidas`} />
              <Summary label="Documentos" value={`${Object.values(docs).filter(Boolean).length}/${REQUIRED_DOCS.length} completos`} />
            </div>

            <div className="rounded-md border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="text-xs">
                Al publicar, esta propiedad será visible inmediatamente para todos los inversores en la app.
                Asegúrate de que el due diligence está completo y los documentos verificados.
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="h-10 px-4 rounded-md border border-border text-sm hover:border-border-strong inline-flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4" /> Anterior
          </button>
          {step < 4 ? (
            <button onClick={next} className="h-10 px-5 rounded-md bg-gradient-gold text-primary-foreground text-sm font-medium hover:shadow-glow transition-shadow inline-flex items-center gap-2">
              Continuar <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={submit} className="h-10 px-5 rounded-md bg-gradient-gold text-primary-foreground text-sm font-semibold hover:shadow-glow transition-shadow inline-flex items-center gap-2">
              <Send className="h-4 w-4" /> Guardar cambios
            </button>
          )}
        </div>
      </div>

      <style>{`
        .np-input {
          width: 100%;
          height: 2.5rem;
          border-radius: 0.375rem;
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          padding: 0 0.75rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s;
          color: hsl(var(--foreground));
        }
        textarea.np-input { height: auto; padding: 0.5rem 0.75rem; }
        .np-input:focus { border-color: hsl(var(--primary) / 0.5); }
      `}</style>
    </div>
  );
}

function Field({ label, required, full, hint, children }: { label: string; required?: boolean; full?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1.5">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {hint && <div className="text-[11px] text-muted-foreground/80 mt-1">{hint}</div>}
    </div>
  );
}

function Summary({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`text-sm mt-1 ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
