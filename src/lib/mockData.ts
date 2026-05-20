// Centralized mock data for Propix.
// NOTE: Property data is intentionally empty. Properties are created by admins
// and surfaced dynamically. The frontend renders empty states until data exists.

export type PropertyStatus = "disponible" | "casi_lleno" | "rentando" | "nuevo";

export interface Property {
  id: string;
  name: string;
  location: string;
  type: string;
  description: string;
  image: string;
  gallery: string[];
  pricePerFraction: number;
  totalFractions: number;
  fractionsSold: number;
  roiAnnual: number; // percent
  monthlyIncomeEstimate: number; // total monthly for whole property
  totalPrice: number;
  daysLeft: number;
  investorsCount: number;
  status: PropertyStatus;
  amenities: string[];
  developer: { name: string; verified: boolean; projects: number };
  badge?: "NUEVO" | "ÚLTIMAS FRACCIONES";
  address?: string;
  documents?: { [key: string]: string };
  tourUrl?: string;
  createdAt?: string;
  returnsStart?: string;
}

/**
 * Global minimum investment amount (per fraction) in USD.
 * Used across calculator, invest flow, onboarding, filters, etc.
 */
export const MIN_FRACTION_PRICE_USD = 2000;

export const properties: Property[] = [];

export const myInvestments: {
  propertyId: string;
  fractions: number;
  invested: number;
  monthlyIncome: number;
  status: "Rentando";
}[] = [];

export const earningsHistory: { month: string; value: number }[] = [];

export const transactions: {
  id: string;
  type: "received" | "withdrawn";
  description: string;
  amount: number;
  date: string;
  status: string;
}[] = [];

export const recentInvestors: { initials: string; amount: number; time: string }[] = [];

export const activityFeed: {
  id: string;
  type: "payment" | "new_property" | "investment";
  title: string;
  subtitle: string;
  amount: number;
  date: string;
}[] = [];

export const notifications: {
  id: string;
  icon: "money" | "home" | "check" | "report";
  title: string;
  body: string;
  time: string;
  group: "Hoy" | "Esta semana" | "Anterior";
  unread: boolean;
}[] = [];

export const bankAccounts = [
  { id: "b1", bank: "Banreservas", last4: "4521", verified: true },
  { id: "b2", bank: "Banco Popular", last4: "8892", verified: false },
];

export const portfolioStats = {
  totalInvested: 0,
  monthlyIncome: 0,
  roiAnnual: 0,
  totalEarned: 0,
  propertiesCount: 0,
  nextPaymentDays: 0,
};

export const user = {
  name: "Jorge Rodríguez",
  email: "jorge@example.do",
  initials: "JR",
  level: "Plata" as const,
  memberSince: "Enero 2026",
  verified: true,
  monthsActive: 4,
};
