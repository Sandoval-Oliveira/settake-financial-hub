import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, CalendarClock } from "lucide-react";
import {
  calendarioQuery,
  receitaPorServicoQuery,
  resumoMensalQuery,
  saldoContasQuery,
  type CalendarioItem,
} from "@/lib/finance";
import { formatDate, formatMonthKey, formatMoney, monthKey } from "@/lib/format";
import { EmptyState, Money, PageHeader, SectionCard, TableSkeleton } from "@/components/finance/ui-bits";
import { StatusBadge, TipoBadge } from "@/components/finance/badges";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — SetTake Finance" },
      { name: "description", content: "Saldos das contas, resultado mensal e vencimentos do ERP financeiro SetTake." },
      { property: "og:title", content: "Dashboard — SetTake Finance" },
      { property: "og:description", content: "Saldos, resultado mensal e vencimentos em um só painel." },
    ],
  }),
  component: Dashboard,
});

const chartTooltip = {
  contentStyle: {
    background: "#1A1D27",
    border: "1px solid #2A2D3E",
    borderRadius: 12,
    color: "#F0F2F8",
    fontSize: 12,
  },
  formatter: (value: number | string) => formatMoney(Number(value)),
};

function VencimentosTable({
  items,
  loading,
  emptyMessage,
}: {
  items: CalendarioItem[];
  loading: boolean;
  emptyMessage: string;
}) {
  if (loading) return <TableSkeleton rows={5} cols={4} />;
  if (!items.length) return <EmptyState message={emptyMessage} icon={<CalendarClock className="size-8" />} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b border-border">
            <th className="px-4 py-2 text-left font-medium">Data</th>
            <th className="px-4 py-2 text-left font-medium">Nome</th>
            <th className="px-4 py-2 text-left font-medium">Tipo</th>
            <th className="px-4 py-2 text-right font-medium">Valor</th>
            <th className="px-4 py-2 text-left font-medium">Status</th>
            <th className="px-4 py-2 text-left font-medium">Conta</th>
            <th className="px-4 py-2 text-left font-medium">Pessoa</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row, i) => (
            <tr key={row.id} className={i % 2 ? "bg-secondary/25" : undefined}>
              <td className="px-4 py-2 whitespace-nowrap">{formatDate(row.vencimento)}</td>
              <td className="px-4 py-2">{row.nome}</td>
              <td className="px-4 py-2"><TipoBadge tipo={row.tipo} /></td>
              <td className="px-4 py-2 text-right">
                <Money value={row.valor} colored negative={row.tipo === "Despesa"} />
              </td>
              <td className="px-4 py-2"><StatusBadge status={row.status} /></td>
              <td className="px-4 py-2 text-muted-foreground">{row.conta_origem ?? "—"}</td>
              <td className="px-4 py-2 text-muted-foreground">{row.pessoa ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Dashboard() {
  const saldos = useQuery(saldoContasQuery);
  const resumo = useQuery(resumoMensalQuery);
  const servicos = useQuery(receitaPorServicoQuery);
  const calendario = useQuery(calendarioQuery);

  const mesAtual = monthKey(new Date());
  const resumoMes = (resumo.data ?? []).find((r) => r.mes === mesAtual) ?? (resumo.data ?? []).at(-1);
  const ultimos6 = (resumo.data ?? []).slice(-6).map((r) => ({
    mes: formatMonthKey(r.mes),
    receita: Number(r.receita_bruta ?? 0),
    despesa: Number(r.despesa_total ?? 0),
    resultado: Number(r.resultado ?? 0),
  }));

  const servicosMes = (servicos.data ?? [])
    .filter((s) => s.mes === mesAtual)
    .slice(0, 6)
    .map((s) => ({ servico: s.servico, receita: Number(s.receita_total ?? 0) }));

  const cal = calendario.data ?? [];
  const proximos = cal.filter((c) => !c.atrasado).slice(0, 7);
  const atrasados = cal.filter((c) => c.atrasado).slice(0, 7);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Visão geral financeira da SetTake" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {saldos.isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-card" />
            ))
          : (saldos.data ?? []).map((conta) => (
              <div key={conta.id} className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">{conta.conta}</p>
                <p className="mt-2 text-2xl font-semibold">
                  <Money value={conta.saldo_atual} colored />
                </p>
                <p className="mt-1 text-xs text-muted-foreground tabular">
                  Saldo inicial {formatMoney(conta.saldo_inicial)}
                </p>
              </div>
            ))}
        {!saldos.isLoading && !(saldos.data ?? []).length && (
          <div className="sm:col-span-2 xl:col-span-4">
            <SectionCard>
              <EmptyState message="Nenhuma conta bancária cadastrada ainda." />
            </SectionCard>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <SectionCard title="Resultado Mensal" description="Últimos 6 meses">
          <div className="h-72 p-3">
            {resumo.isLoading ? (
              <TableSkeleton rows={4} cols={3} />
            ) : ultimos6.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={ultimos6}>
                  <CartesianGrid stroke="#2A2D3E" vertical={false} />
                  <XAxis dataKey="mes" stroke="#8B8FA8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8B8FA8" fontSize={11} tickLine={false} axisLine={false} width={70} />
                  <Tooltip {...chartTooltip} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "#8B8FA8" }} />
                  <Bar dataKey="receita" name="Receita" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" name="Despesa" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  <Line dataKey="resultado" name="Resultado" stroke="#6C63FF" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="Sem dados mensais." />
            )}
          </div>
        </SectionCard>

        <SectionCard title="Receita por Serviço" description="Top 6 no mês atual">
          <div className="h-72 p-3">
            {servicos.isLoading ? (
              <TableSkeleton rows={4} cols={3} />
            ) : servicosMes.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={servicosMes} layout="vertical" margin={{ left: 20 }}>
                  <defs>
                    <linearGradient id="violet" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6C63FF" />
                      <stop offset="100%" stopColor="#A78BFA" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#2A2D3E" horizontal={false} />
                  <XAxis type="number" stroke="#8B8FA8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="servico" stroke="#8B8FA8" fontSize={11} width={120} tickLine={false} axisLine={false} />
                  <Tooltip {...chartTooltip} />
                  <Bar dataKey="receita" name="Receita" fill="url(#violet)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="Sem receita registrada neste mês." />
            )}
          </div>
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <SectionCard title="Próximos vencimentos" description="7 primeiros a vencer">
          <VencimentosTable items={proximos} loading={calendario.isLoading} emptyMessage="Nenhum vencimento futuro." />
        </SectionCard>
        <SectionCard
          title={
            <span className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-4" /> Em atraso
            </span>
          }
          headerClassName="bg-destructive/10"
        >
          <VencimentosTable items={atrasados} loading={calendario.isLoading} emptyMessage="Nada em atraso. 🎉" />
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Geração de Caixa", value: resumoMes?.geracao_caixa },
          { label: "Distribuição Pablo", value: resumoMes?.distribuicao_pablo },
          { label: "Distribuição Sandoval", value: resumoMes?.distribuicao_sandoval },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="mt-1 text-xl font-semibold">
              <Money value={m.value ?? 0} colored />
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
