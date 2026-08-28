import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronLeft, ChevronRight, Target } from "lucide-react";
import { toast } from "sonner";
import {
  dashboardMesQuery,
  dashboardSerieQuery,
  metaQuery,
  upsertMeta,
  type DashboardFinanceiro,
} from "@/lib/finance";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, SectionCard } from "@/components/finance/ui-bits";
import {
  BotaoEditarMetas,
  CardCascata,
  CascataDetalhada,
  Gauge,
  MetasDialog,
  TooltipCustom,
  formatK,
} from "@/components/finance/dashboard-parts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard Financeiro — SetTake Finance" },
      {
        name: "description",
        content: "Cascata financeira mensal, metas, margens e evolução de resultados da SetTake.",
      },
      { property: "og:title", content: "Dashboard Financeiro — SetTake Finance" },
      { property: "og:description", content: "Cascata financeira, metas e margens em um só painel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function periodoAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shiftPeriodo(periodo: string, delta: number) {
  const [y, m] = periodo.split("-").map(Number);
  const d = new Date(y, (m ?? 1) - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function labelPeriodo(periodo: string) {
  const [y, m] = periodo.split("-").map(Number);
  return `${MESES[(m ?? 1) - 1]} ${y}`;
}

function CardsSkeleton({ n = 8, h = "h-28" }: { n?: number; h?: string }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className={`${h} animate-pulse rounded-xl border border-border bg-card`} />
      ))}
    </>
  );
}

function Dashboard() {
  const [periodo, setPeriodo] = useState(periodoAtual);
  const [metasOpen, setMetasOpen] = useState(false);
  const qc = useQueryClient();

  const [ano, mesNum] = periodo.split("-").map(Number);
  const mes = useQuery(dashboardMesQuery(periodo));
  const serie = useQuery(dashboardSerieQuery);
  const meta = useQuery(metaQuery(ano, mesNum));

  const salvarMeta = useMutation({
    mutationFn: (v: { meta_faturamento: number; meta_despesas: number; meta_lucro: number }) =>
      upsertMeta({ ano, mes: mesNum, ...v }),
    onSuccess: () => {
      toast.success("Metas salvas");
      setMetasOpen(false);
      qc.invalidateQueries({ queryKey: ["metas_financeiras"] });
      qc.invalidateQueries({ queryKey: ["dashboard_financeiro_graficos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const d = mes.data as DashboardFinanceiro | null | undefined;
  const dados = serie.data ?? [];
  const temMeta = !!meta.data;

  return (
    <div>
      <PageHeader
        title="Dashboard Financeiro"
        subtitle="Cascata de resultados, metas e margens"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-1 py-1">
              <Button variant="ghost" size="icon" onClick={() => setPeriodo((p) => shiftPeriodo(p, -1))} aria-label="Mês anterior">
                <ChevronLeft className="size-4" />
              </Button>
              <span className="min-w-24 text-center text-sm font-medium tabular">{labelPeriodo(periodo)}</span>
              <Button variant="ghost" size="icon" onClick={() => setPeriodo((p) => shiftPeriodo(p, 1))} aria-label="Próximo mês">
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setPeriodo(periodoAtual())}>
              Este mês
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPeriodo(shiftPeriodo(periodoAtual(), -1))}>
              Mês anterior
            </Button>
            <input
              type="month"
              value={periodo}
              onChange={(e) => e.target.value && setPeriodo(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground"
              aria-label="Período personalizado"
            />
          </div>
        }
      />

      {/* Bloco 1 — cards da cascata */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {mes.isLoading ? (
          <CardsSkeleton />
        ) : d ? (
          <>
            <CardCascata titulo="Faturamento Bruto" valor={d.faturamento_bruto} varPct={d.fat_bruto_var_pct} participacaoPct={100} />
            <CardCascata titulo="Lucro Bruto" valor={d.lucro_bruto} varPct={d.lucro_bruto_var_pct} participacaoPct={d.lucro_bruto_pct} />
            <CardCascata titulo="Margem Contribuição" valor={d.margem_contribuicao} varPct={d.margem_var_pct} participacaoPct={d.margem_contribuicao_pct} />
            <CardCascata titulo="EBITDA" valor={d.ebitda} varPct={d.ebitda_var_pct} participacaoPct={d.ebitda_pct} />
            <CardCascata titulo="Geração de Caixa" valor={d.resultado_antes_socios} varPct={d.geracao_caixa_var_pct} participacaoPct={d.geracao_caixa_pct} />
            <CardCascata titulo="Lucro Líquido" valor={d.lucro_liquido} varPct={d.lucro_liquido_var_pct} participacaoPct={d.lucro_liquido_pct} />
            <CardCascata titulo="Total Despesas" valor={d.total_despesas} varPct={null} participacaoPct={d.total_despesas_pct} despesa />
            <CardCascata titulo="Despesas Fixas" valor={d.despesas_fixas} varPct={null} participacaoPct={d.despesas_fixas_pct} despesa />
          </>
        ) : (
          <div className="sm:col-span-2 xl:col-span-4">
            <SectionCard>
              <EmptyState message={`Sem dados financeiros para ${labelPeriodo(periodo)}.`} />
            </SectionCard>
          </div>
        )}
      </div>

      {/* Bloco 2 — gauges de meta */}
      <div className="mt-4">
        {meta.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <CardsSkeleton n={3} h="h-52" />
          </div>
        ) : temMeta && d ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Metas de {labelPeriodo(periodo)}</h2>
              <BotaoEditarMetas onClick={() => setMetasOpen(true)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Gauge titulo="Meta Faturamento" atual={d.faturamento_bruto} meta={meta.data!.meta_faturamento} onClick={() => setMetasOpen(true)} />
              <Gauge titulo="Meta Despesas" atual={d.total_despesas} meta={meta.data!.meta_despesas} teto onClick={() => setMetasOpen(true)} />
              <Gauge titulo="Meta Lucro" atual={d.lucro_liquido} meta={meta.data!.meta_lucro} onClick={() => setMetasOpen(true)} />
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-card px-5 py-6">
            <div className="flex items-center gap-3">
              <Target className="size-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                Nenhuma meta cadastrada para {labelPeriodo(periodo)}.
              </p>
            </div>
            <Button size="sm" onClick={() => setMetasOpen(true)}>
              Definir metas do mês
            </Button>
          </div>
        )}
      </div>

      {/* Bloco 3 — gráficos */}
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <SectionCard title="Evolução de resultados" description="Últimos 13 meses">
          <div className="h-80 p-3">
            {serie.isLoading ? (
              <div className="h-full animate-pulse rounded-lg bg-secondary/40" />
            ) : dados.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dados}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3E" vertical={false} />
                  <XAxis dataKey="periodo_curto" stroke="#8B8FA8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#8B8FA8" tick={{ fontSize: 11 }} width={70} tickFormatter={(v: number) => formatK(Number(v))} />
                  <Tooltip content={<TooltipCustom />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="faturamento_bruto" stroke="#2A2D3E" fill="#1A1D27" strokeWidth={1} name="Faturamento Bruto" />
                  <Area type="monotone" dataKey="ebitda" stroke="#E8B800" fill="rgba(232,184,0,0.12)" strokeWidth={2} name="EBITDA" />
                  <Line type="monotone" dataKey="lucro_liquido" stroke="#F5820A" strokeWidth={2.5} dot={{ fill: "#F5820A", r: 3 }} activeDot={{ r: 5 }} name="Lucro Líquido" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="Sem série histórica." />
            )}
          </div>
        </SectionCard>

        <SectionCard title="Composição das despesas" description="Últimos 13 meses">
          <div className="h-80 p-3">
            {serie.isLoading ? (
              <div className="h-full animate-pulse rounded-lg bg-secondary/40" />
            ) : dados.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dados}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3E" vertical={false} />
                  <XAxis dataKey="periodo_curto" stroke="#8B8FA8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#8B8FA8" tick={{ fontSize: 11 }} width={70} tickFormatter={(v: number) => formatK(Number(v))} />
                  <Tooltip content={<TooltipCustom />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="custos_deducoes" stackId="desp" fill="#DC2626" name="Fiscal" />
                  <Bar dataKey="despesas_variaveis" stackId="desp" fill="#F5820A" name="Variáveis" />
                  <Bar dataKey="despesas_fixas" stackId="desp" fill="#8B8FA8" name="Fixas" />
                  <Bar dataKey="despesas_nao_operacionais" stackId="desp" fill="#6366F1" name="Não Operac." />
                  <Bar dataKey="socios" stackId="desp" fill="#E8B800" name="Sócios" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="Sem série histórica." />
            )}
          </div>
        </SectionCard>
      </div>

      {/* Bloco 4 — cascata detalhada */}
      <div className="mt-4">
        {mes.isLoading ? (
          <div className="h-40 animate-pulse rounded-xl border border-border bg-card" />
        ) : d ? (
          <CascataDetalhada d={d} />
        ) : null}
      </div>

      {/* Bloco 5 — margens ao longo do tempo */}
      <div className="mt-4">
        <SectionCard title="Evolução das margens" description="% sobre o faturamento bruto">
          <div className="h-80 p-3">
            {serie.isLoading ? (
              <div className="h-full animate-pulse rounded-lg bg-secondary/40" />
            ) : dados.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dados}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3E" vertical={false} />
                  <XAxis dataKey="periodo_curto" stroke="#8B8FA8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#8B8FA8" tick={{ fontSize: 11 }} width={50} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
                  <Tooltip content={<TooltipCustom percent />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line dataKey="lucro_bruto_pct" stroke="#6B7280" name="Lucro Bruto %" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                  <Line dataKey="margem_contribuicao_pct" stroke="#8B8FA8" name="Margem Contrib. %" strokeWidth={1.5} dot={false} />
                  <Line dataKey="ebitda_pct" stroke="#E8B800" name="EBITDA %" strokeWidth={2} dot={false} />
                  <Line dataKey="lucro_liquido_pct" stroke="#F5820A" name="Lucro Líquido %" strokeWidth={2.5} dot={{ fill: "#F5820A", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="Sem série histórica." />
            )}
          </div>
        </SectionCard>
      </div>

      <MetasDialog
        open={metasOpen}
        onOpenChange={setMetasOpen}
        meta={meta.data ?? null}
        saving={salvarMeta.isPending}
        onSave={(v) => salvarMeta.mutate(v)}
      />
    </div>
  );
}
