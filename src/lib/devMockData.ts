// Distribución mensual de rentas — gestionada internamente por el admin de Propix.
// La data está intencionalmente vacía. Se llena cuando el admin reporta rentas
// y ejecuta distribuciones a inversores.

export type RentReportStatus = "Pagada" | "En revisión" | "Pendiente";

export interface RentReport {
  id: string;
  month: string;
  projectName: string;
  developer: string;
  gross: number;
  expenses: number;
  net: number;
  status: RentReportStatus;
  date: string;
}

export const rentReports: RentReport[] = [];

// Proyectos activos disponibles para reportar renta.
// Mock interno para el selector — admin puede elegir cualquier propiedad activa.
export const activeProjectsForReport: { id: string; name: string; developer: string }[] = [];
