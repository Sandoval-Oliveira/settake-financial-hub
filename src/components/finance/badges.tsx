import { cn } from "@/lib/utils";
import type { StatusTransacao, TipoPessoa, TipoTransacao } from "@/lib/finance";

const base =
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap";

const statusStyles: Record<StatusTransacao, string> = {
  "A Pagar": "border-warning/40 bg-warning/10 text-warning",
  "A Receber": "border-info/40 bg-info/10 text-info",
  Atrasada: "border-destructive/50 bg-destructive/15 text-destructive animate-pulse-alert",
  "Concluído": "border-success/40 bg-success/10 text-success",
};

export function StatusBadge({ status }: { status: StatusTransacao }) {
  return <span className={cn(base, statusStyles[status])}>{status}</span>;
}

const tipoStyles: Record<TipoTransacao, string> = {
  Receita: "border-success/40 bg-success/10 text-success",
  Despesa: "border-destructive/40 bg-destructive/10 text-destructive",
  "Transferência": "border-primary/40 bg-primary/10 text-primary",
};

export function TipoBadge({ tipo }: { tipo: TipoTransacao }) {
  return <span className={cn(base, tipoStyles[tipo])}>{tipo}</span>;
}

export function PessoaBadge({ tipo }: { tipo: TipoPessoa }) {
  return (
    <span
      className={cn(
        base,
        tipo === "Cliente"
          ? "border-info/40 bg-info/10 text-info"
          : "border-warning/40 bg-warning/10 text-warning",
      )}
    >
      {tipo}
    </span>
  );
}

export function Temperatura({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="text-xs whitespace-nowrap">
      {value === "Quente" ? "🔥" : "❄️"} {value}
    </span>
  );
}