import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, CalendarDays, LayoutDashboard, Menu, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/lancamentos", label: "Lançamentos", icon: Wallet },
  { to: "/calendario", label: "Calendário", icon: CalendarDays },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/cadastros", label: "Cadastros", icon: Users },
] as const;

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-1 flex-col gap-1 px-2 py-4">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            title={label}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              collapsed && "justify-center px-2",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 border-b border-sidebar-border px-4 py-4", collapsed && "justify-center px-2")}>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#6C63FF] to-[#A78BFA] text-sm font-bold text-primary-foreground">
        SF
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <p className="text-sm font-semibold text-foreground">SetTake</p>
          <p className="text-xs text-muted-foreground">Finance</p>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop / tablet sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col border-r border-sidebar-border bg-sidebar md:flex xl:w-60">
        <div className="xl:hidden">
          <Logo collapsed />
          <NavList collapsed />
        </div>
        <div className="hidden xl:flex xl:h-full xl:flex-col">
          <Logo collapsed={false} />
          <NavList collapsed={false} />
          <div className="border-t border-sidebar-border px-4 py-3">
            <p className="text-xs text-muted-foreground">SetTake Finance</p>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-sidebar px-4 py-3 md:hidden">
        <button
          type="button"
          aria-label="Abrir menu"
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-md border border-border p-2 text-foreground"
        >
          <Menu className="size-4" />
        </button>
        <span className="text-sm font-semibold">SetTake Finance</span>
      </header>
      {mobileOpen && (
        <div className="fixed inset-x-0 top-[57px] z-30 border-b border-border bg-sidebar md:hidden">
          <NavList collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </div>
      )}

      <main className="px-4 py-6 md:pl-[88px] md:pr-6 xl:pl-[264px]">{children}</main>
    </div>
  );
}