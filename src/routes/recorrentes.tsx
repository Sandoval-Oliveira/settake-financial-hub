import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Copy, Loader2, MoreHorizontal, Pause, Play, Plus, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  custoFixoQuery,
  forecastQuery,
  gerarTransacoesRecorrentes,
  mrrAtivoQuery,
  pessoasQuery,
  recorrentesQuery,
  writeRow,
  FINANCE_KEYS,
  RECORRENTE_KEYS,
  type LancamentoRecorrente,
} from "@/lib/finance";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmptyState, Money, PageHeader, SectionCard, TableSkeleton } from "@/components/finance/ui-bits";
import { RecorrenteDrawer } from "@/components/finance/recorrente-drawer";

export const Route = createFileRoute("/recorrentes")({
  head: () => ({
    meta: [
      { title: "Recorrentes — SetTake Finance" },
      { name: "description", content: "Assinaturas, custos fixos recorrentes e forecast dos próximos meses." },
      { property: "og:title", content: "Recorrentes — SetTake Finance" },
      { property: "og:description", content: "Gestão de assinaturas e custos que se repetem automaticamente." },
    ],
  }),
  component: Recorrentes,
});

type Aba = "receitas" | "despesas" | "forecast";

const ABAS: { key: Aba; label: string }[] = [
  { key: "receitas", label: "Receitas" },
  { key: "despesas", label: "Despesas" },
  { key: "forecast", label: "Forecast" },
];

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string | undefined }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular text-foreground">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Ativo: "border-success/40 bg-success/10 text-success",
    Pausado: "border-primary/40 bg-primary/10 text-primary",
    Cancelado: "border-destructive/40 bg-destructive/10 text-destructive",
  };
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-xs", map[status] ?? "border-border text-muted-foreground")}>
      {status}
    </span>
  );
}

function Recorrentes() {
  const queryClient = useQueryClient();
  const [aba, setAba] = useState<Aba>("receitas");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<LancamentoRecorrente | null>(null);
  const [mode, setMode] = useState<"edit" | "duplicate">("edit");
  const [confirmGerar, setConfirmGerar] = useState(false);

  const recorrentes = useQuery(recorrentesQuery);
  const mrr = useQuery(mrrAtivoQuery);
  const custos = useQuery(custoFixoQuery);
  const forecast = useQuery(forecastQuery);
  const pessoas = useQuery(pessoasQuery);

  const pessoaNome = useMemo(
    () => Object.fromEntries((pessoas.data ?? []).map((p) => [p.id, p.nome])),
    [pessoas.data],
  );

  const receitas = (recorrentes.data ?? []).filter((r) => r.tipo === "Receita");
  const despesas = (recorrentes.data ?? []).filter((r) => r.tipo === "Despesa");

  const mrrTotal = (mrr.data ?? []).reduce((s, r) => s + Number(r.valor_mensal ?? 0), 0);
  const custoTotal = (custos.data ?? []).reduce((s, r) => s + Number(r.custo_mensal ?? 0), 0);
  const maiorCusto = (custos.data ?? [])[0];
  const proximoDia = (mrr.data ?? [])
    .map((r) => r.dia_vencimento)
    .sort((a, b) => a - b)[0];

  const alterarStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      writeRow("lancamentos_recorrentes", "update", { status }, id),
    onSuccess: () => {
      toast.success("Status atualizado.");
      RECORRENTE_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const gerar = useMutation({
    mutationFn: gerarTransacoesRecorrentes,
    onSuccess: () => {
      toast.success("Lançamentos gerados com sucesso!");
      [...FINANCE_KEYS, ...RECORRENTE_KEYS].forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key }),
      );
      setConfirmGerar(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function novo() {
    setEditing(null);
    setMode("edit");
    setDrawerOpen(true);
  }

  function Lista({ registros, tipo }: { registros: LancamentoRecorrente[]; tipo: "Receita" | "Despesa" }) {
    if (recorrentes.isLoading) return <TableSkeleton rows={6} cols={6} />;
    if (!registros.length)
      return <EmptyState message={tipo === "Receita" ? "Nenhuma assinatura cadastrada." : "Nenhuma despesa recorrente cadastrada."} />;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-4 py-2 text-left font-medium">Nome</th>
              <th className="px-4 py-2 text-left font-medium">Status</th>
              <th className="px-4 py-2 text-left font-medium">{tipo === "Receita" ? "Cliente" : "Fornecedor"}</th>
              <th className="px-4 py-2 text-right font-medium">Valor/Mês</th>
              <th className="px-4 py-2 text-left font-medium">Frequência</th>
              <th className="px-4 py-2 text-center font-medium">Dia</th>
              <th className="px-4 py-2 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((r, i) => (
              <tr key={r.id} className={cn("hover:bg-surface-hover", i % 2 && "bg-secondary/25")}>
                <td className="px-4 py-2">
                  <button className="text-left hover:text-primary" onClick={() => { setEditing(r); setMode("edit"); setDrawerOpen(true); }}>
                    {r.nome}
                  </button>
                </td>
                <td className="px-4 py-2"><StatusPill status={r.status} /></td>
                <td className="px-4 py-2 text-muted-foreground">{r.pessoa_id ? pessoaNome[r.pessoa_id] ?? "—" : "—"}</td>
                <td className="px-4 py-2 text-right">
                  {Number(r.valor) === 0 ? (
                    <span className="text-xs text-[#F5820A]">Valor pendente</span>
                  ) : (
                    <Money value={r.valor} />
                  )}
                </td>
                <td className="px-4 py-2 text-muted-foreground">{r.frequencia}</td>
                <td className="px-4 py-2 text-center text-muted-foreground">{r.dia_vencimento}</td>
                <td className="px-4 py-2 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Ações">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {r.status === "Pausado" ? (
                        <DropdownMenuItem onClick={() => alterarStatus.mutate({ id: r.id, status: "Ativo" })}>
                          <Play className="mr-2 size-4" /> Reativar
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => alterarStatus.mutate({ id: r.id, status: "Pausado" })}>
                          <Pause className="mr-2 size-4" /> Pausar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => alterarStatus.mutate({ id: r.id, status: "Cancelado" })}>
                        <XCircle className="mr-2 size-4" /> Cancelar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setEditing(r); setMode("duplicate"); setDrawerOpen(true); }}>
                        <Copy className="mr-2 size-4" /> Duplicar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Lançamentos Recorrentes"
        subtitle="Assinaturas e custos que se repetem automaticamente"
        actions={
          <div className="flex gap-2">
            {aba !== "forecast" && (
              <Button variant="outline" onClick={novo}>
                <Plus className="mr-1 size-4" />
                {aba === "receitas" ? "Nova Assinatura" : "Nova Despesa"}
              </Button>
            )}
            <Button onClick={() => setConfirmGerar(true)}>
              <RefreshCw className="mr-1 size-4" /> Gerar Lançamentos
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-4 md:flex-row">
        <nav className="w-full shrink-0 rounded-xl border border-border bg-card p-2 md:w-[200px] md:rounded-none md:border-0 md:border-r md:bg-[#1A1D27] md:p-0">
          {ABAS.map((a) => (
            <button
              key={a.key}
              onClick={() => setAba(a.key)}
              className={cn(
                "flex w-full items-center px-4 py-2 text-sm transition-all duration-300",
                aba === a.key
                  ? "border-l-[3px] border-primary text-primary"
                  : "border-l-[3px] border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {a.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1 space-y-4">
          {aba === "receitas" && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Kpi label="MRR Total" value={formatMoney(mrrTotal)} />
                <Kpi label="Assinaturas ativas" value={String((mrr.data ?? []).length)} />
                <Kpi label="Próx. vencimento" value={proximoDia ? `Dia ${proximoDia}` : "—"} />
              </div>
              <SectionCard title="Assinaturas">
                <Lista registros={receitas} tipo="Receita" />
              </SectionCard>
            </>
          )}

          {aba === "despesas" && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Kpi label="Custo mensal total" value={formatMoney(custoTotal)} />
                <Kpi label="Despesas ativas" value={String((custos.data ?? []).length)} />
                <Kpi
                  label="Maior custo"
                  value={maiorCusto ? formatMoney(maiorCusto.custo_mensal) : "—"}
                  hint={maiorCusto?.nome}
                />
              </div>
              <SectionCard title="Custos fixos recorrentes">
                <Lista registros={despesas} tipo="Despesa" />
              </SectionCard>
            </>
          )}

          {aba === "forecast" && (
            <>
              <SectionCard title="Projeção — próximos 6 meses">
                <div className="h-[320px] p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forecast.data ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3E" vertical={false} />
                      <XAxis dataKey="periodo_curto" stroke="#8B8FA8" fontSize={12} />
                      <YAxis stroke="#8B8FA8" fontSize={12} tickFormatter={(v) => formatMoney(Number(v))} width={90} />
                      <RTooltip
                        contentStyle={{ background: "#1A1D27", border: "1px solid #2A2D3E", borderRadius: 8 }}
                        formatter={(v: number | string) => formatMoney(Number(v))}
                      />
                      <Legend />
                      <Bar dataKey="receita_prevista" name="Receita prevista" fill="#E8B800" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="despesa_prevista" name="Despesa prevista" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <SectionCard title="Resumo mensal">
                {forecast.isLoading ? (
                  <TableSkeleton rows={6} cols={4} />
                ) : !(forecast.data ?? []).length ? (
                  <EmptyState message="Sem projeções disponíveis." />
                ) : (
                  <table className="w-full text-sm">
                    <thead className="text-xs text-muted-foreground">
                      <tr className="border-b border-border">
                        <th className="px-4 py-2 text-left font-medium">Mês</th>
                        <th className="px-4 py-2 text-right font-medium">Receita prevista</th>
                        <th className="px-4 py-2 text-right font-medium">Despesa prevista</th>
                        <th className="px-4 py-2 text-right font-medium">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(forecast.data ?? []).map((f, i) => {
                        const saldo = Number(f.saldo ?? 0);
                        return (
                          <tr key={f.periodo} className={cn(i % 2 && "bg-secondary/25")}>
                            <td className="px-4 py-2">{f.periodo_curto}</td>
                            <td className="px-4 py-2 text-right"><Money value={f.receita_prevista} /></td>
                            <td className="px-4 py-2 text-right"><Money value={f.despesa_prevista} /></td>
                            <td
                              className={cn(
                                "px-4 py-2 text-right tabular",
                                saldo > 0 ? "text-success" : saldo < 0 ? "text-destructive" : "text-muted-foreground",
                              )}
                            >
                              {formatMoney(saldo)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </SectionCard>
            </>
          )}
        </div>
      </div>

      <RecorrenteDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        registro={editing}
        mode={mode}
        tipo={aba === "despesas" ? "Despesa" : "Receita"}
      />

      <AlertDialog open={confirmGerar} onOpenChange={setConfirmGerar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gerar lançamentos recorrentes?</AlertDialogTitle>
            <AlertDialogDescription>
              Serão criadas as transações previstas das recorrências ativas que ainda não foram geradas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); gerar.mutate(); }}
              disabled={gerar.isPending}
            >
              {gerar.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Gerar agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
