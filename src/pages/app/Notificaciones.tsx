import { useEffect } from "react";
import ScreenHeader from "@/components/ScreenHeader";
import { notifications } from "@/lib/mockData";
import { useAppStore } from "@/store/useAppStore";
import { CheckCircle, DollarSign, FileBarChart, Home as HomeIcon } from "lucide-react";

const groups = ["Hoy", "Esta semana", "Anterior"] as const;

const iconMap = {
  money: DollarSign,
  home: HomeIcon,
  check: CheckCircle,
  report: FileBarChart,
} as const;

export default function Notificaciones() {
  const { notificationsRead, markNotificationRead } = useAppStore();

  useEffect(() => {
    notifications.forEach((n) => n.unread && markNotificationRead(n.id));
  }, [markNotificationRead]);

  const hasNotifications = notifications.length > 0;

  return (
    <div className="pb-4">
      <ScreenHeader back showBell={false} title="Notificaciones" />
      <div className="px-5 space-y-5">
        {!hasNotifications && (
          <div className="pt-8">
            <div className="glass rounded-2xl p-8 text-center flex flex-col items-center">
              <div className="relative h-12 w-12 mb-5">
                <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                <span className="absolute inset-2 rounded-full bg-primary/40 animate-pulse" />
                <span className="absolute inset-[14px] rounded-full bg-gradient-gold shadow-gold" />
              </div>
              <p className="font-display text-xl leading-tight text-balance max-w-xs">
                No tienes notificaciones por ahora
              </p>
              <p className="text-xs text-muted-foreground mt-2 max-w-xs text-balance">
                Te avisaremos cuando haya nuevas oportunidades de inversión o pagos.
              </p>
            </div>
          </div>
        )}
        {groups.map((g) => {
          const items = notifications.filter((n) => n.group === g);
          if (!items.length) return null;
          return (
            <section key={g}>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2 px-1">{g}</p>
              <div className="glass rounded-2xl divide-y divide-border">
                {items.map((n) => {
                  const Icon = iconMap[n.icon];
                  const wasUnread = n.unread && !notificationsRead.includes(n.id);
                  return (
                    <button
                      key={n.id}
                      className="w-full flex items-start gap-3 p-4 text-left active:bg-surface/40 transition-colors"
                    >
                      <div
                        className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 ${
                          n.icon === "money"
                            ? "bg-success/15 text-success"
                            : n.icon === "home"
                            ? "bg-secondary/15 text-secondary"
                            : n.icon === "check"
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium flex items-center gap-2">
                          {n.title}
                          {wasUnread && <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow" />}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
