import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GripVertical } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ltvClientesQuery,
  receitaPorServicoQuery,
  resumoMensalQuery,
  saldoContasQuery,
} from "@/lib/finance";
import type { ResumoMensal } from "@/lib/finance";
import { formatDate, formatMonthKey, formatMoney, formatPercent, MONTH_NAMES, monthKey } from "@/lib/format";
import { EmptyState, Money, PageHeader, SectionCard, TableSkeleton } from "@/components/finance/ui-bits";
import { PessoaBadge } from "@/components/finance/badges";
import { RelatorioCategorias } from "@/components/finance/relatorio-categorias";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — SetTake Finance" },
      { name: "description", content: "Análises mensais, receita por serviço, LTV de clientes e saldos por conta." },
      { property: "og:title", content: "Relatórios — SetTake Finance" },
      { property: "og:description", content: "Análise financeira detalhada da operação." },
    ],
  }),
  component: Relatorios,
});

const tooltipProps = {
  contentStyle: {
    background: "#1A1D27",
    border: "1px solid #2A2D3E",
    borderRadius: 12,
    color: "#F0F2F8",
    fontSize: 12,
  },
  formatter: (value: number | string) => formatMoney(Number(value)),
};

const MENSAL_ORDER_KEY = "settake:relatorios:mensal:order";

type MensalField =
  | "receita_bruta"
  | "despesa_total"
  | "resultado"
  | "custo_fixo"
  | "custo_variavel"
  | "capex"
  | "crescimento"
  | "total_socios"
  | "distribuicao_pablo"
  | "distribuicao_sandoval"
  | "geracao_caixa";

const MENSAL_COLUMNS: { key: MensalField; label: string; colored?: boolean }[] = [
  { key: "receita_bruta", label: "Receita Bruta" },
  { key: "despesa_total", label: "Despesa Total" },
  { key: "resultado", label: "Resultado", colored: true },
  { key: "custo_fixo", label: "Custo Fixo" },
  { key: "custo_variavel", label: "Custo Variável" },
  { key: "capex", label: "CAPEX" },
  { key: "crescimento", label: "Crescimento" },
  { key: "total_socios", label: "Sócios" },
  { key: "distribuicao_pablo", label: "Dist. Pablo" },
  { key: "distribuicao_sandoval", label: "Dist. Sandoval" },
  { key: "geracao_caixa", label: "Geração de Caixa", colored: true },
];

const MENSAL_DEFAULT_ORDER = MENSAL_COLUMNS.map((c) => c.key);
const MENSAL_MAP = Object.fromEntries(MENSAL_COLUMNS.map((c) => [c.key, c])) as Record<
  MensalField,
  (typeof MENSAL_COLUMNS)[number]
>;

function Relatorios() {
  const resumo = useQuery(resumoMensalQuery);
  const servicos = useQuery(receitaPorServicoQuery);
  const ltv = useQuery(ltvClientesQuery);
  const saldos = useQuery(saldoContasQuery);

  const anoAtual = String(new Date().getFullYear());
  const [ano, setAno] = useState(anoAtual);
  const [mesServico, setMesServico] = useState(monthKey(new Date()));
  const [mensalOrder, setMensalOrder] = useState<MensalField[]>(MENSAL_DEFAULT_ORDER);
  const [dragCol, setDragCol] = useState<MensalField | null>(null);
  const [dropCol, setDropCol] = useState<MensalField | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MENSAL_ORDER_KEY);
      if (!raw) return;
      const parsed = (JSON.parse(raw) as MensalField[]).filter((k) => MENSAL_DEFAULT_ORDER.includes(k));
      setMensalOrder([...parsed, ...MENSAL_DEFAULT_ORDER.filter((k) => !parsed.includes(k))]);
    } catch {
      /* ignore */
    }
  }, []);

  function reorderMensal(target: MensalField) {
    if (!dragCol || dragCol === target) {
      setDragCol(null);
      setDropCol(null);
      return;
    }
    const next = mensalOrder.filter((k) => k !== dragCol);
    next.splice(next.indexOf(target), 0, dragCol);
    setMensalOrder(next);
    try {
      localStorage.setItem(MENSAL_ORDER_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setDragCol(null);
    setDropCol(null);
  }

  const anos = useMemo(() => {
    const set = new Set((resumo.data ?? []).map((r) => r.mes.slice(0, 4)));
    set.add(anoAtual);
    return [...set].sort().reverse();
  }, [resumo.data, anoAtual]);

  const mesesDisponiveis = useMemo(() => {
    const set = new Set((servicos.data ?? []).map((s) => s.mes));
    set.add(monthKey(new Date()));
    return [...set].sort().reverse();
  }, [servicos.data]);

  const linhas = (resumo.data ?? []).filter((r) => r.mes.startsWith(ano));
  const totais = linhas.reduce(
    (acc, r) => ({
      receita_bruta: acc.receita_bruta + Number(r.receita_bruta ?? 0),
      despesa_total: acc.despesa_total + Number(r.despesa_total ?? 0),
      resultado: acc.resultado + Number(r.resultado ?? 0),
      custo_fixo: acc.custo_fixo + Number(r.custo_fixo ?? 0),
      custo_variavel: acc.custo_variavel + Number(r.custo_variavel ?? 0),
      capex: acc.capex + Number(r.capex ?? 0),
      crescimento: acc.crescimento + Number(r.crescimento ?? 0),
      total_socios: acc.total_socios + Number(r.total_socios ?? 0),
      distribuicao_pablo: acc.distribuicao_pablo + Number(r.distribuicao_pablo ?? 0),
      distribuicao_sandoval: acc.distribuicao_sandoval + Number(r.distribuicao_sandoval ?? 0),
      geracao_caixa: acc.geracao_caixa + Number(r.geracao_caixa ?? 0),
    }),
    {
      receita_bruta: 0, despesa_total: 0, resultado: 0, custo_fixo: 0,
      custo_variavel: 0, capex: 0, crescimento: 0, total_socios: 0,
      distribuicao_pablo: 0, distribuicao_sandoval: 0, geracao_caixa: 0,
    },
  );

  const servicosDoMes = (servicos.data ?? []).filter((s) => s.mes === mesServico);
  const totalServicos = servicosDoMes.reduce((sum, s) => sum + Number(s.receita_total ?? 0), 0);

  return (
    <div>
      <PageHeader title="Relatórios" subtitle="Análise financeira" />

      <Tabs defaultValue="mensal">
        <TabsList className="bg-transparent p-0 gap-2">
          {([
            ["mensal", "Mensal"],
            ["categorias", "Categorias"],
            ["servicos", "Serviços"],
            ["clientes", "Clientes"],
            ["contas", "Contas"],
          ] as const).map(([v, label]) => (
            <TabsTrigger
              key={v}
              value={v}
              className="rounded-none border-b-2 border-transparent bg-transparent px-3 pb-2 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="mensal" className="mt-4 space-y-4">
          <Select value={ano} onValueChange={setAno}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {anos.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>

          <SectionCard title={`Resumo mensal ${ano}`}>
            {resumo.isLoading ? (
              <TableSkeleton rows={6} cols={6} />
            ) : !linhas.length ? (
              <EmptyState message="Sem dados para o ano selecionado." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr className="border-b border-border">
                      {["Mês", "Receita Bruta", "Despesa Total", "Resultado", "Custo Fixo", "Custo Variável", "CAPEX", "Crescimento", "Dist. Pablo", "Dist. Sandoval", "Geração de Caixa"].map((h, i) => (
                        <th key={h} className={`px-3 py-2 font-medium ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((r, i) => (
                      <tr key={r.mes} className={i % 2 ? "bg-secondary/25" : undefined}>
                        <td className="px-3 py-2">{formatMonthKey(r.mes)}</td>
                        <td className="px-3 py-2 text-right tabular">{formatMoney(r.receita_bruta)}</td>
                        <td className="px-3 py-2 text-right tabular">{formatMoney(r.despesa_total)}</td>
                        <td className="px-3 py-2 text-right"><Money value={r.resultado} colored /></td>
                        <td className="px-3 py-2 text-right tabular">{formatMoney(r.custo_fixo)}</td>
                        <td className="px-3 py-2 text-right tabular">{formatMoney(r.custo_variavel)}</td>
                        <td className="px-3 py-2 text-right tabular">{formatMoney(r.capex)}</td>
                        <td className="px-3 py-2 text-right tabular">{formatPercent(r.crescimento)}</td>
                        <td className="px-3 py-2 text-right tabular">{formatMoney(r.distribuicao_pablo)}</td>
                        <td className="px-3 py-2 text-right tabular">{formatMoney(r.distribuicao_sandoval)}</td>
                        <td className="px-3 py-2 text-right"><Money value={r.geracao_caixa} colored /></td>
                      </tr>
                    ))}
                    <tr className="border-t border-border font-semibold">
                      <td className="px-3 py-2">Total</td>
                      <td className="px-3 py-2 text-right tabular">{formatMoney(totais.receita_bruta)}</td>
                      <td className="px-3 py-2 text-right tabular">{formatMoney(totais.despesa_total)}</td>
                      <td className="px-3 py-2 text-right"><Money value={totais.resultado} colored /></td>
                      <td className="px-3 py-2 text-right tabular">{formatMoney(totais.custo_fixo)}</td>
                      <td className="px-3 py-2 text-right tabular">{formatMoney(totais.custo_variavel)}</td>
                      <td className="px-3 py-2 text-right tabular">{formatMoney(totais.capex)}</td>
                      <td className="px-3 py-2 text-right">—</td>
                      <td className="px-3 py-2 text-right tabular">{formatMoney(totais.distribuicao_pablo)}</td>
                      <td className="px-3 py-2 text-right tabular">{formatMoney(totais.distribuicao_sandoval)}</td>
                      <td className="px-3 py-2 text-right"><Money value={totais.geracao_caixa} colored /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Evolução no ano">
            <div className="h-80 p-3">
              {linhas.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={linhas.map((r) => ({
                    mes: formatMonthKey(r.mes),
                    Receita: Number(r.receita_bruta ?? 0),
                    Despesa: Number(r.despesa_total ?? 0),
                    Resultado: Number(r.resultado ?? 0),
                  }))}>
                    <CartesianGrid stroke="#2A2D3E" vertical={false} />
                    <XAxis dataKey="mes" stroke="#8B8FA8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#8B8FA8" fontSize={11} width={70} tickLine={false} axisLine={false} />
                    <Tooltip {...tooltipProps} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area dataKey="Receita" stroke="#22C55E" fill="#22C55E" fillOpacity={0.15} />
                    <Area dataKey="Despesa" stroke="#EF4444" fill="#EF4444" fillOpacity={0.15} />
                    <Area dataKey="Resultado" stroke="#E8B800" fill="#E8B800" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="Sem dados para exibir." />
              )}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="categorias" className="mt-4">
          <RelatorioCategorias />
        </TabsContent>

        <TabsContent value="servicos" className="mt-4 space-y-4">
          <Select value={mesServico} onValueChange={setMesServico}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              {mesesDisponiveis.map((m) => (
                <SelectItem key={m} value={m}>
                  {MONTH_NAMES[Number(m.slice(5, 7)) - 1]} / {m.slice(0, 4)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <SectionCard title="Ranking de serviços">
            <div className="h-80 p-3">
              {servicos.isLoading ? (
                <TableSkeleton rows={4} cols={3} />
              ) : servicosDoMes.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={servicosDoMes.map((s) => ({ servico: s.servico, receita: Number(s.receita_total ?? 0) }))} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid stroke="#2A2D3E" horizontal={false} />
                    <XAxis type="number" stroke="#8B8FA8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="servico" stroke="#8B8FA8" fontSize={11} width={140} tickLine={false} axisLine={false} />
                    <Tooltip {...tooltipProps} />
                    <Bar dataKey="receita" name="Receita" fill="#E8B800" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="Sem receita no mês selecionado." />
              )}
            </div>
          </SectionCard>

          <SectionCard title="Detalhamento">
            {servicosDoMes.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left font-medium">Serviço</th>
                      <th className="px-3 py-2 text-left font-medium">Grupo</th>
                      <th className="px-3 py-2 text-right font-medium">Qtd.</th>
                      <th className="px-3 py-2 text-right font-medium">Receita</th>
                      <th className="px-3 py-2 text-right font-medium">% do total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicosDoMes.map((s, i) => (
                      <tr key={`${s.servico}-${i}`} className={i % 2 ? "bg-secondary/25" : undefined}>
                        <td className="px-3 py-2">{s.servico}</td>
                        <td className="px-3 py-2 text-muted-foreground">{s.grupo}</td>
                        <td className="px-3 py-2 text-right tabular">{s.qtd_transacoes}</td>
                        <td className="px-3 py-2 text-right"><Money value={s.receita_total} colored /></td>
                        <td className="px-3 py-2 text-right tabular">
                          {totalServicos ? formatPercent((Number(s.receita_total ?? 0) / totalServicos) * 100) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState message="Nenhum serviço faturado neste mês." />
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="clientes" className="mt-4">
          <SectionCard title="LTV por cliente">
            {ltv.isLoading ? (
              <TableSkeleton rows={6} cols={5} />
            ) : !(ltv.data ?? []).length ? (
              <EmptyState message="Nenhum cliente com transações." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left font-medium">#</th>
                      <th className="px-3 py-2 text-left font-medium">Cliente</th>
                      <th className="px-3 py-2 text-left font-medium">Tipo</th>
                      <th className="px-3 py-2 text-right font-medium">Transações</th>
                      <th className="px-3 py-2 text-left font-medium">Primeira</th>
                      <th className="px-3 py-2 text-left font-medium">Última</th>
                      <th className="px-3 py-2 text-right font-medium">LTV Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ltv.data ?? []).map((c, i) => (
                      <tr key={c.pessoa_id} className={i % 2 ? "bg-secondary/25" : undefined}>
                        <td className="px-3 py-2 text-muted-foreground tabular">{i + 1}</td>
                        <td className="px-3 py-2">{c.cliente}</td>
                        <td className="px-3 py-2"><PessoaBadge tipo={c.tipo} /></td>
                        <td className="px-3 py-2 text-right tabular">{c.total_transacoes}</td>
                        <td className="px-3 py-2">{formatDate(c.primeira_transacao)}</td>
                        <td className="px-3 py-2">{formatDate(c.ultima_transacao)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-success tabular">
                          {formatMoney(c.ltv_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="contas" className="mt-4">
          {saldos.isLoading ? (
            <TableSkeleton rows={3} cols={4} />
          ) : !(saldos.data ?? []).length ? (
            <SectionCard><EmptyState message="Nenhuma conta cadastrada." /></SectionCard>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {(saldos.data ?? []).map((c) => (
                <div key={c.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold">{c.conta}</p>
                      <p className="text-xs text-muted-foreground tabular">
                        Inicial: {formatMoney(c.saldo_inicial)}
                      </p>
                    </div>
                    <Money value={c.saldo_atual} colored className="text-2xl font-semibold" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <p className="text-success tabular">+ {formatMoney(c.total_entradas)}</p>
                    <p className="text-right text-destructive tabular">- {formatMoney(c.total_saidas)}</p>
                  </div>
                  <div className="mt-3 h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { nome: "Entradas", valor: Number(c.total_entradas ?? 0) },
                        { nome: "Saídas", valor: Number(c.total_saidas ?? 0) },
                      ]}>
                        <XAxis dataKey="nome" stroke="#8B8FA8" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip {...tooltipProps} />
                        <Bar dataKey="valor" radius={[6, 6, 0, 0]} fill="#E8B800" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}