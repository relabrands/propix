import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  onboarded: boolean;
  authed: boolean;
  user: any | null;
  notificationsRead: string[];
  setOnboarded: (v: boolean) => void;
  setAuthed: (v: boolean) => void;
  setUser: (user: any | null) => void;
  markNotificationRead: (id: string) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      onboarded: false,
      authed: false,
      user: null,
      notificationsRead: [],
      setOnboarded: (v) => set({ onboarded: v }),
      setAuthed: (v) => set({ authed: v }),
      setUser: (user) => set({ user }),
      markNotificationRead: (id) =>
        set((s) => ({ notificationsRead: [...new Set([...s.notificationsRead, id])] })),
      reset: () => set({ onboarded: false, authed: false, user: null, notificationsRead: [] }),
    }),
    { name: "propix-app" }
  )
);
