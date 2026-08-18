import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowLeftRight, ArrowUp, CalendarDays, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { calendarioQuery, writeRow, FINANCE_KEYS, type CalendarioItem, type StatusTransacao } from "@/lib/finance";
import { formatWeekday, monthKey } from "@/lib/format";
import { EmptyState, Money, PageHeader, SectionCard, TableSkeleton } from "@/components/finance/ui-bits";
import { StatusBadge } from "@/components/finance/badges";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Calendário de Pagamentos — SetTake Finance" },
      { name: "description", content: "Vencimentos, atrasos e baixas rápidas das contas a pagar e receber." },
      { property: "og:title", content: "Calendário de Pagamentos — SetTake Finance" },
      { property: "og:description", content: "Acompanhe vencimentos e quite pendências em um clique." },
    ],
  }),
  component: Calendario,
});

const FILTER_STATUS: StatusTransacao[] = ["A Pagar", "A Receber", "Atrasada"];

function TipoIcon({ tipo }: { tipo: CalendarioItem["tipo"] }) {
  if (tipo === "Receita") return <ArrowUp className="size-4 text-success" />;
  if (tipo === "Despesa") return <ArrowDown className="size-4 text-destructive" />;
  return <ArrowLeftRight className="size-4 text-primary" />;
}

function borderColor(tipo: CalendarioItem["tipo"]) {
  if (tipo === "Receita") return "border-l-success";
  if (tipo === "Despesa") return "border-l-destructive";
  return "border-l-primary";
}

function Calendario() {
  const queryClient = useQueryClient();
  const calendario = useQuery(calendarioQuery);
  const [offset, setOffset] = useState(0);
  const [statuses, setStatuses] = useState<StatusTransacao[]>(FILTER_STATUS);

  const mes = useMemo(() => {
    const d = new Date();
    return monthKey(new Date(d.getFullYear(), d.getMonth() + offset, 1));
  }, [offset]);

  const concluir = useMutation({
    mutationFn: (id: number) => writeRow("transacoes", "update", { status: "Concluído" }, id),
    onSuccess: () => {
      toast.success("Lançamento marcado como concluído.");
      FINANCE_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const data = (calendario.data ?? []).filter((c) => statuses.includes(c.status));
  const atrasados = data.filter((c) => c.atrasado);
  const doMes = data.filter((c) => !c.atrasado && c.vencimento.slice(0, 7) === mes);

  const grupos = useMemo(() => {
    const map = new Map<string, CalendarioItem[]>();
    doMes.forEach((c) => {
      const key = c.vencimento.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), c]);
    });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [doMes]);

  return (
    <div>
      <PageHeader
        title="Calendário de Pagamentos"
        subtitle="Vencimentos agrupados por data"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setOffset((o) => o - 1)}>
              <ChevronLeft className="size-4" /> Mês anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => setOffset(0)}>Mês atual</Button>
            <Button variant="outline" size="sm" onClick={() => setOffset((o) => o + 1)}>
              Próximo mês <ChevronRight className="size-4" />
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card px-4 py-3">
        {FILTER_STATUS.map((s) => (
          <label key={s} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={statuses.includes(s)}
              onCheckedChange={(checked) =>
                setStatuses((prev) => (checked ? [...prev, s] : prev.filter((x) => x !== s)))
              }
            />
            {s}
          </label>
        ))}
      </div>

      <section className="mb-6 rounded-xl border border-destructive/40 bg-[#2D0F0F] p-4">
        <h2 className="mb-3 text-sm font-semibold text-destructive">Em Atraso</h2>
        {calendario.isLoading ? (
          <TableSkeleton rows={2} cols={3} />
        ) : !atrasados.length ? (
          <p className="text-sm text-muted-foreground">Nenhum lançamento em atraso.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {atrasados.map((c) => (
              <div key={c.id} className="rounded-lg border border-destructive/40 bg-card/70 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{c.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.conta_origem ?? "—"}{c.pessoa ? ` · ${c.pessoa}` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-destructive tabular">{c.dias_para_vencer} dias</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <Money value={c.valor} colored negative={c.tipo === "Despesa"} className="text-base font-semibold" />
                  <Button size="sm" variant="outline" disabled={concluir.isPending} onClick={() => concluir.mutate(c.id)}>
                    <Check className="mr-1 size-3" /> Concluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <SectionCard title={`Vencimentos de ${mes.split("-").reverse().join("/")}`}>
        {calendario.isLoading ? (
          <TableSkeleton rows={5} cols={3} />
        ) : !grupos.length ? (
          <EmptyState message="Nenhum vencimento neste mês." icon={<CalendarDays className="size-8" />} />
        ) : (
          <div className="space-y-6 p-4">
            {grupos.map(([data_, itens]) => (
              <div key={data_}>
                <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {formatWeekday(data_)}
                </h3>
                <div className="space-y-2">
                  {itens.map((c) => (
                    <div
                      key={c.id}
                      className={`flex flex-wrap items-center gap-3 rounded-lg border border-border border-l-4 bg-background px-3 py-2 hover:bg-surface-hover ${borderColor(c.tipo)}`}
                    >
                      <TipoIcon tipo={c.tipo} />
                      <div className="min-w-40 flex-1">
                        <p className="text-sm font-medium">{c.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {[c.natureza, c.grupo, c.item].filter(Boolean).join(" → ")}
                        </p>
                      </div>
                      <Money value={c.valor} colored negative={c.tipo === "Despesa"} className="text-base font-semibold" />
                      <StatusBadge status={c.status} />
                      <span className="text-xs text-muted-foreground">
                        {c.conta_origem ?? "—"}{c.pessoa ? ` · ${c.pessoa}` : ""}
                      </span>
                      <Button size="sm" variant="outline" disabled={concluir.isPending} onClick={() => concluir.mutate(c.id)}>
                        <Check className="mr-1 size-3" /> Concluir
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}