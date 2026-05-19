import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  onboarded: boolean;
  authed: boolean;
  notificationsRead: string[];
  setOnboarded: (v: boolean) => void;
  setAuthed: (v: boolean) => void;
  markNotificationRead: (id: string) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      onboarded: false,
      authed: false,
      notificationsRead: [],
      setOnboarded: (v) => set({ onboarded: v }),
      setAuthed: (v) => set({ authed: v }),
      markNotificationRead: (id) =>
        set((s) => ({ notificationsRead: [...new Set([...s.notificationsRead, id])] })),
      reset: () => set({ onboarded: false, authed: false, notificationsRead: [] }),
    }),
    { name: "propix-app" }
  )
);
