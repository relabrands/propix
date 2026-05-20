import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Transaction {
  id: string;
  userId: string;
  investor?: string;
  property?: string;
  type: string; // "Inversión" | "Distribución" | "Retiro" | "Depósito"
  amount: number;
  fee?: number;
  method?: string;
  status: string; // "Completada" | "Pendiente" | "Fallida" | "Reembolsada"
  date: string;
  receiptUrl?: string;
}

export function useWalletBalance(userId?: string) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setBalance(0);
      setTransactions([]);
      setLoading(false);
      return;
    }

    const qTx = query(collection(db, "transactions"), where("userId", "==", userId));
    const unsubscribe = onSnapshot(qTx, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Transaction[];
      
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const totalEarned = data
        .filter((t) => (t.type === "Distribución" || t.type === "Depósito") && t.status === "Completada")
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const totalSpent = data
        .filter((t) => 
          (t.type === "Retiro" && (t.status === "Completada" || t.status === "Pendiente")) ||
          (t.type === "Inversión" && (t.status === "Completada" || t.status === "Pendiente"))
        )
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      setTransactions(data);
      setBalance(Math.max(0, totalEarned - totalSpent));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { balance, transactions, loading };
}
