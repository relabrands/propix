// Admin back-office mock data — Dominican Republic context.
// NOTE: All data arrays are intentionally empty. Data is created dynamically
// via admin actions and surfaced in real-time. The UI renders empty states
// until data exists.

export const adminKpis = {
  totalCapital: 0,
  capitalChange: 0,
  activeInvestors: 0,
  investorsChange: 0,
  activeProperties: 0,
  propertiesChange: 0,
  monthlyTransactions: 0,
  transactionsChange: 0,
  monthlyRevenue: 0,
  revenueChange: 0,
  conversionRate: 0,
  conversionChange: 0,
};

export const capitalByMonth: { month: string; value: number }[] = [];

export const distributionByProperty: { name: string; value: number; color: string }[] = [];

export const newInvestorsWeekly: { week: string; value: number }[] = [];

export const platformRevenueByMonth: { month: string; listing: number; fondeo: number; admin: number }[] = [];

export type AdminPropertyStatus = "Activa" | "En fondeo" | "Cerrada" | "Archivada";

export interface AdminProperty {
  id: string;
  name: string;
  image: string;
  developer: string;
  totalPrice: number;
  totalFractions: number;
  fractionsSold: number;
  fractionPrice: number;
  raised: number;
  roi: number;
  monthlyRent: number;
  status: AdminPropertyStatus;
  location: string;
  startDate: string;
}

export const adminProperties: AdminProperty[] = [];

export type KycStatus = "Verificado" | "Pendiente" | "Rechazado" | "En revisión";

export interface AdminInvestor {
  id: string;
  name: string;
  email: string;
  phone: string;
  cedula: string;
  totalInvested: number;
  propertiesCount: number;
  monthlyIncome: number;
  registeredAt: string;
  kycStatus: KycStatus;
  suspended?: boolean;
}

export const adminInvestors: AdminInvestor[] = [];

export type TxType = "Inversión" | "Distribución" | "Retiro" | "Fee";
export type TxStatus = "Completada" | "Pendiente" | "Fallida" | "Reembolsada";

export interface AdminTransaction {
  id: string;
  date: string;
  investor: string;
  property: string;
  type: TxType;
  amount: number;
  fee: number;
  method: string;
  status: TxStatus;
}

export const adminTransactions: AdminTransaction[] = [];


export const kycQueue = {
  pending: [] as { id: string; investor: string; initials: string; submittedAt: string; cedula: boolean; selfie: boolean }[],
  inReview: [] as { id: string; investor: string; initials: string; submittedAt: string; cedula: boolean; selfie: boolean }[],
  done: [] as { id: string; investor: string; initials: string; submittedAt: string; cedula: boolean; selfie: boolean; decision: "approved" | "rejected" }[],
};




export const emailCampaigns: { id: string; subject: string; sent: number; opened: number; clicked: number; date: string }[] = [];

export const auditLog: { id: string; time: string; user: string; action: string; target: string }[] = [];

export const teamMembers: { id: string; name: string; email: string; role: string; lastActive: string }[] = [];

export const platformBankAccounts: { id: string; bank: string; account: string; type: string; verified: boolean }[] = [];
