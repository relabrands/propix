import { useState } from "react";
import { toast } from "sonner";
import ScreenHeader from "@/components/ScreenHeader";
import { user } from "@/lib/mockData";
import { Save, Info } from "lucide-react";

const PROVINCIAS_RD = [
  "Distrito Nacional", "Santo Domingo", "Santiago", "La Vega", "San Cristóbal",
  "Puerto Plata", "San Pedro de Macorís", "La Romana", "Duarte", "La Altagracia",
  "Espaillat", "Azua", "Barahona", "Monseñor Nouel", "Peravia", "Monte Plata",
  "Valverde", "Sánchez Ramírez", "María Trinidad Sánchez", "Hermanas Mirabal",
  "Samaná", "Bahoruco", "Independencia", "Elías Piña", "El Seibo", "Hato Mayor",
  "Monte Cristi", "Dajabón", "Santiago Rodríguez", "San Juan", "San José de Ocoa", "Pedernales",
];

export default function InformacionPersonal() {
  const [form, setForm] = useState({
    // Identidad
    firstName: user.name.split(" ")[0] ?? "",
    lastName: user.name.split(" ").slice(1).join(" ") ?? "",
    cedula: "001-1234567-8",
    documentType: "cedula", // cedula | pasaporte
    nationality: "Dominicana",
    birthdate: "1990-05-12",
    birthPlace: "Santo Domingo, RD",
    gender: "M",
    civilStatus: "soltero",
    // Contacto
    email: user.email,
    phone: "+1 809 555 0142",
    // Domicilio (RD)
    street: "Av. Anacaona",
    houseNumber: "27",
    sector: "Bella Vista",
    province: "Distrito Nacional",
    municipality: "Santo Domingo de Guzmán",
    postalCode: "10101",
    // Económico / KYC
    profession: "Ingeniero de software",
    employer: "Independiente",
    economicActivity: "servicios_profesionales",
    monthlyIncome: "150000",
    fundsSource: "salario",
    investmentExperience: "intermedio",
    investmentPurpose: "ingresos_pasivos",
    rnc: "",
    // PEP / Compliance
    isPep: "no",
    pepRelation: "no",
    usPerson: "no",
    tin: "",
  });
  const [saving, setSaving] = useState(false);

  const update = (k: keyof typeof form, v: string) => setForm({ ...form, [k]: v });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("Nombre y apellidos son requeridos");
      return;
    }
    if (!form.email.includes("@")) {
      toast.error("Correo inválido");
      return;
    }
    if (form.documentType === "cedula" && !/^\d{3}-?\d{7}-?\d$/.test(form.cedula.replace(/\s/g, ""))) {
      toast.error("Cédula RD inválida (formato 000-0000000-0)");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Información actualizada");
    }, 700);
  };

  return (
    <div className="pb-10">
      <ScreenHeader title="Información personal" back showBell={false} />

      <form onSubmit={handleSubmit} className="px-5 mt-2 space-y-6">
        <Notice>
          Estos datos son requeridos por la <span className="text-foreground font-medium">Superintendencia de Bancos</span> y la
          UAF para cumplimiento KYC/AML en República Dominicana. Deben coincidir con tus documentos oficiales.
        </Notice>

        <Section title="Identidad">
          <Grid2>
            <Field label="Nombres" value={form.firstName} onChange={(v) => update("firstName", v)} />
            <Field label="Apellidos" value={form.lastName} onChange={(v) => update("lastName", v)} />
          </Grid2>
          <Grid2>
            <Select
              label="Tipo de documento"
              value={form.documentType}
              onChange={(v) => update("documentType", v)}
              options={[
                { v: "cedula", l: "Cédula de identidad (RD)" },
                { v: "pasaporte", l: "Pasaporte" },
              ]}
            />
            <Field
              label={form.documentType === "cedula" ? "Cédula" : "Pasaporte"}
              value={form.cedula}
              onChange={(v) => update("cedula", v)}
              placeholder={form.documentType === "cedula" ? "000-0000000-0" : "AA1234567"}
            />
          </Grid2>
          <Grid2>
            <Select
              label="Nacionalidad"
              value={form.nationality}
              onChange={(v) => update("nationality", v)}
              options={[
                { v: "Dominicana", l: "Dominicana" },
                { v: "Extranjera", l: "Extranjera" },
              ]}
            />
            <Field label="Fecha de nacimiento" type="date" value={form.birthdate} onChange={(v) => update("birthdate", v)} />
          </Grid2>
          <Grid2>
            <Field label="Lugar de nacimiento" value={form.birthPlace} onChange={(v) => update("birthPlace", v)} />
            <Select
              label="Sexo"
              value={form.gender}
              onChange={(v) => update("gender", v)}
              options={[
                { v: "M", l: "Masculino" },
                { v: "F", l: "Femenino" },
              ]}
            />
          </Grid2>
          <Select
            label="Estado civil"
            value={form.civilStatus}
            onChange={(v) => update("civilStatus", v)}
            options={[
              { v: "soltero", l: "Soltero/a" },
              { v: "casado", l: "Casado/a" },
              { v: "union_libre", l: "Unión libre" },
              { v: "divorciado", l: "Divorciado/a" },
              { v: "viudo", l: "Viudo/a" },
            ]}
          />
        </Section>

        <Section title="Contacto">
          <Field label="Correo electrónico" type="email" value={form.email} onChange={(v) => update("email", v)} />
          <Field label="Teléfono móvil" value={form.phone} onChange={(v) => update("phone", v)} placeholder="+1 809 000 0000" />
        </Section>

        <Section title="Domicilio">
          <Grid2>
            <Field label="Calle" value={form.street} onChange={(v) => update("street", v)} />
            <Field label="No." value={form.houseNumber} onChange={(v) => update("houseNumber", v)} />
          </Grid2>
          <Grid2>
            <Field label="Sector" value={form.sector} onChange={(v) => update("sector", v)} />
            <Field label="Código postal" value={form.postalCode} onChange={(v) => update("postalCode", v)} />
          </Grid2>
          <Grid2>
            <Select
              label="Provincia"
              value={form.province}
              onChange={(v) => update("province", v)}
              options={PROVINCIAS_RD.map((p) => ({ v: p, l: p }))}
            />
            <Field label="Municipio" value={form.municipality} onChange={(v) => update("municipality", v)} />
          </Grid2>
        </Section>

        <Section title="Perfil económico">
          <Grid2>
            <Field label="Profesión / ocupación" value={form.profession} onChange={(v) => update("profession", v)} />
            <Field label="Empresa o empleador" value={form.employer} onChange={(v) => update("employer", v)} />
          </Grid2>
          <Select
            label="Actividad económica principal"
            value={form.economicActivity}
            onChange={(v) => update("economicActivity", v)}
            options={[
              { v: "empleado_privado", l: "Empleado sector privado" },
              { v: "empleado_publico", l: "Empleado sector público" },
              { v: "independiente", l: "Trabajador independiente" },
              { v: "empresario", l: "Empresario / dueño de negocio" },
              { v: "servicios_profesionales", l: "Servicios profesionales" },
              { v: "comercio", l: "Comercio" },
              { v: "agricultura", l: "Agricultura / ganadería" },
              { v: "construccion", l: "Construcción / inmobiliaria" },
              { v: "turismo", l: "Turismo / hotelería" },
              { v: "remesas", l: "Recibe remesas del exterior" },
              { v: "jubilado", l: "Jubilado / pensionado" },
              { v: "estudiante", l: "Estudiante" },
              { v: "otro", l: "Otro" },
            ]}
          />
          <Grid2>
            <Select
              label="Ingresos mensuales (DOP)"
              value={form.monthlyIncome}
              onChange={(v) => update("monthlyIncome", v)}
              options={[
                { v: "30000", l: "Hasta RD$30,000" },
                { v: "75000", l: "RD$30,001 – 75,000" },
                { v: "150000", l: "RD$75,001 – 150,000" },
                { v: "300000", l: "RD$150,001 – 300,000" },
                { v: "600000", l: "RD$300,001 – 600,000" },
                { v: "1000000", l: "Más de RD$600,000" },
              ]}
            />
            <Field label="RNC (si aplica)" value={form.rnc} onChange={(v) => update("rnc", v)} placeholder="Opcional" />
          </Grid2>
          <Select
            label="Fuente principal de los fondos"
            value={form.fundsSource}
            onChange={(v) => update("fundsSource", v)}
            options={[
              { v: "salario", l: "Salario / sueldo" },
              { v: "negocio", l: "Utilidades de negocio propio" },
              { v: "honorarios", l: "Honorarios profesionales" },
              { v: "ahorros", l: "Ahorros acumulados" },
              { v: "herencia", l: "Herencia / donación" },
              { v: "venta_activos", l: "Venta de bienes o activos" },
              { v: "remesas", l: "Remesas del exterior" },
              { v: "inversiones", l: "Rendimiento de otras inversiones" },
              { v: "otro", l: "Otro" },
            ]}
          />
          <Grid2>
            <Select
              label="Experiencia invirtiendo"
              value={form.investmentExperience}
              onChange={(v) => update("investmentExperience", v)}
              options={[
                { v: "ninguna", l: "Ninguna" },
                { v: "principiante", l: "Principiante (< 1 año)" },
                { v: "intermedio", l: "Intermedio (1–5 años)" },
                { v: "avanzado", l: "Avanzado (> 5 años)" },
              ]}
            />
            <Select
              label="Propósito de la inversión"
              value={form.investmentPurpose}
              onChange={(v) => update("investmentPurpose", v)}
              options={[
                { v: "ingresos_pasivos", l: "Ingresos pasivos" },
                { v: "ahorro_largo_plazo", l: "Ahorro a largo plazo" },
                { v: "diversificacion", l: "Diversificar patrimonio" },
                { v: "retiro", l: "Plan de retiro" },
                { v: "otro", l: "Otro" },
              ]}
            />
          </Grid2>
        </Section>

        <Section title="Cumplimiento (PEP / FATCA)">
          <Select
            label="¿Eres una Persona Expuesta Políticamente (PEP)?"
            value={form.isPep}
            onChange={(v) => update("isPep", v)}
            options={[
              { v: "no", l: "No" },
              { v: "si", l: "Sí" },
            ]}
          />
          <Select
            label="¿Tienes parentesco con un PEP?"
            value={form.pepRelation}
            onChange={(v) => update("pepRelation", v)}
            options={[
              { v: "no", l: "No" },
              { v: "si", l: "Sí" },
            ]}
          />
          <Select
            label="¿Eres ciudadano o residente fiscal de EE.UU. (FATCA)?"
            value={form.usPerson}
            onChange={(v) => update("usPerson", v)}
            options={[
              { v: "no", l: "No" },
              { v: "si", l: "Sí" },
            ]}
          />
          {form.usPerson === "si" && (
            <Field label="TIN / SSN" value={form.tin} onChange={(v) => update("tin", v)} />
          )}
        </Section>

        <button
          type="submit"
          disabled={saving}
          className="w-full h-12 rounded-2xl bg-gradient-gold text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-gold disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-4 flex gap-3">
      <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
      <p className="text-xs text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground px-1">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function Field({
  label, value, onChange, type = "text", placeholder,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full h-11 rounded-xl bg-surface border border-border px-3 text-sm focus:outline-none focus:border-primary/60 transition-colors"
      />
    </label>
  );
}

function Select({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full h-11 rounded-xl bg-surface border border-border px-3 text-sm focus:outline-none focus:border-primary/60 transition-colors appearance-none"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
    </label>
  );
}
