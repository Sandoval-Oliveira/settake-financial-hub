import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function Money({
  value,
  colored = false,
  negative = false,
  className,
}: {
  value: number | string | null | undefined;
  colored?: boolean;
  negative?: boolean;
  className?: string;
}) {
  const n = Number(value ?? 0);
  const isNeg = negative || n < 0;
  return (
    <span
      className={cn(
        "tabular",
        colored && (isNeg ? "text-destructive" : "text-success"),
        className,
      )}
    >
      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n)}
    </span>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  headerClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card", className)}>
      {(title || action) && (
        <header
          className={cn(
            "flex items-center justify-between gap-3 border-b border-border px-4 py-3",
            headerClassName,
          )}
        >
          <div>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-6 flex-1 bg-secondary" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ message, icon }: { message: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <div className="text-muted-foreground">{icon ?? <Inbox className="size-8" />}</div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}