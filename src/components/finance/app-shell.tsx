import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Menu,
  Users,
  Wallet,
} from "lucide-react";
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
                ? "bg-brand-gradient text-primary-foreground"
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
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-gradient text-sm font-bold text-primary-foreground">
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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("settake:sidebar-collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((v) => {
      localStorage.setItem("settake:sidebar-collapsed", v ? "0" : "1");
      return !v;
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop / tablet sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-in-out md:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <Logo collapsed={collapsed} />
        <NavList collapsed={collapsed} />
        {!collapsed && (
          <div className="border-t border-sidebar-border px-4 py-3">
            <p className="text-xs text-muted-foreground">SetTake Finance</p>
          </div>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className="absolute top-1/2 -right-3 flex size-6 -translate-y-1/2 items-center justify-center rounded-full border border-sidebar-border bg-[#2A2D3E] text-muted-foreground hover:text-primary"
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
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

      <main
        className={cn(
          "px-4 py-6 transition-[padding] duration-300 ease-in-out md:pr-6",
          collapsed ? "md:pl-20" : "md:pl-64",
        )}
      >
        {children}
      </main>
    </div>
  );
}