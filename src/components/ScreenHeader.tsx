import { Bell, ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { notifications } from "@/lib/mockData";

interface Props {
  title?: string;
  subtitle?: string;
  back?: boolean;
  showBell?: boolean;
  right?: React.ReactNode;
  transparent?: boolean;
}

export default function ScreenHeader({ title, subtitle, back, showBell = true, right, transparent }: Props) {
  const navigate = useNavigate();
  const read = useAppStore((s) => s.notificationsRead);
  const unread = notifications.filter((n) => n.unread && !read.includes(n.id)).length;

  return (
    <header
      className={`sticky top-0 z-30 safe-top ${
        transparent ? "bg-transparent" : "bg-background/80 backdrop-blur-xl border-b border-border"
      }`}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          {back && (
            <button
              onClick={() => navigate(-1)}
              className="h-9 w-9 -ml-2 rounded-full grid place-items-center hover:bg-surface tap-highlight-none transition-colors"
              aria-label="Volver"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0">
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {title && (
              <h1 className="font-display text-2xl leading-tight truncate">{title}</h1>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {right}
          {showBell && (
            <Link
              to="/app/notificaciones"
              className="relative h-10 w-10 rounded-full glass grid place-items-center tap-highlight-none transition-transform active:scale-95"
              aria-label="Notificaciones"
            >
              <Bell className="h-4.5 w-4.5 text-foreground" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground grid place-items-center">
                  {unread}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
