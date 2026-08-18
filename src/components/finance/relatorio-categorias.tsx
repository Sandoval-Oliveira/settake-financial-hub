import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, Money, SectionCard, TableSkeleton } from "@/components/finance/ui-bits";
import { transacoesCompletasQuery, type TransacaoCompleta } from "@/lib/finance";
import { formatMonthKey, formatMoney, formatNumber, formatPercent, isoDate } from "@/lib/format";

type Nivel = "natureza" | "grupo" | "item";

const TIPOS_FILTRO = ["Despesa", "Receita", "Transferência", "Todos"] as const;
const STATUS_FILTRO = ["Todos", "Concluído", "Em aberto"] as const;

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

function startOfYear() {
  return isoDate(new Date(new Date().getFullYear(), 0, 1));
}

interface Node {
  nome: string;
  total: number;
  qtd: number;
  filhos: Map<string, Node>;
}

function novoNode(nome: string): Node {
  return { nome, total: 0, qtd: 0, filhos: new Map() };
}

function sorted(nodes: Map<string, Node>, por: "valor" | "qtd") {
  return [...nodes.values()].sort((a, b) => (por === "valor" ? b.total - a.total : b.qtd - a.qtd));
}

export function RelatorioCategorias() {
  const { data, isLoading } = useQuery(transacoesCompletasQuery);

  const [inicio, setInicio] = useState(startOfYear());
  const [fim, setFim] = useState(isoDate(new Date()));
  const [tipo, setTipo] = useState<string>("Despesa");
  const [status, setStatus] = useState<string>("Todos");
  const [natureza, setNatureza] = useState<string>("Todas");
  const [grupo, setGrupo] = useState<string>("Todos");
  const [nivel, setNivel] = useState<Nivel>("grupo");
  const [ordem, setOrdem] = useState<"valor" | "qtd">("valor");
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});

  const linhas = data ?? [];

  const naturezas = useMemo(
    () => [...new Set(linhas.map((t) => t.natureza).filter(Boolean) as string[])].sort(),
    [linhas],
  );
  const gruposDisponiveis = useMemo(
    () =>
      [
        ...new Set(
          linhas
            .filter((t) => natureza === "Todas" || t.natureza === natureza)
            .map((t) => t.grupo)
            .filter(Boolean) as string[],
        ),
      ].sort(),
    [linhas, natureza],
  );

  const filtradas = useMemo(
    () =>
      linhas.filter((t: TransacaoCompleta) => {
        const venc = (t.vencimento ?? "").slice(0, 10);
        if (!venc || venc < inicio || venc > fim) return false;
        if (tipo !== "Todos" && t.tipo !== tipo) return false;
        if (status === "Concluído" && t.status !== "Concluído") return false;
        if (status === "Em aberto" && t.status === "Concluído") return false;
        if (natureza !== "Todas" && t.natureza !== natureza) return false;
        if (grupo !== "Todos" && t.grupo !== grupo) return false;
        return true;
      }),
    [linhas, inicio, fim, tipo, status, natureza, grupo],
  );

  const total = filtradas.reduce((s, t) => s + Number(t.valor ?? 0), 0);

  const arvore = useMemo(() => {
    const raiz = new Map<string, Node>();
    for (const t of filtradas) {
      const n = t.natureza ?? "Sem natureza";
      const g = t.grupo ?? "Sem grupo";
      const i = t.item ?? "Sem item";
      const valor = Number(t.valor ?? 0);
      const nodeN = raiz.get(n) ?? novoNode(n);
      raiz.set(n, nodeN);
      nodeN.total += valor;
      nodeN.qtd += 1;
      const nodeG = nodeN.filhos.get(g) ?? novoNode(g);
      nodeN.filhos.set(g, nodeG);
      nodeG.total += valor;
      nodeG.qtd += 1;
      const nodeI = nodeG.filhos.get(i) ?? novoNode(i);
      nodeG.filhos.set(i, nodeI);
      nodeI.total += valor;
      nodeI.qtd += 1;
    }
    return raiz;
  }, [filtradas]);

  const topN = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const t of filtradas) {
      const chave = (nivel === "natureza" ? t.natureza : nivel === "grupo" ? t.grupo : t.item) ?? "—";
      mapa.set(chave, (mapa.get(chave) ?? 0) + Number(t.valor ?? 0));
    }
    return [...mapa.entries()]
      .map(([categoria, valor]) => ({ categoria, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);
  }, [filtradas, nivel]);

  const evolucao = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const t of filtradas) {
      const mes = (t.vencimento ?? "").slice(0, 7);
      if (!mes) continue;
      mapa.set(mes, (mapa.get(mes) ?? 0) + Number(t.valor ?? 0));
    }
    return [...mapa.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, valor]) => ({ mes: formatMonthKey(mes), valor }));
  }, [filtradas]);

  function atalho(meses: number | "ano" | "anoPassado") {
    const hoje = new Date();
    if (meses === "ano") {
      setInicio(isoDate(new Date(hoje.getFullYear(), 0, 1)));
      setFim(isoDate(hoje));
    } else if (meses === "anoPassado") {
      setInicio(isoDate(new Date(hoje.getFullYear() - 1, 0, 1)));
      setFim(isoDate(new Date(hoje.getFullYear() - 1, 11, 31)));
    } else if (meses === 0) {
      setInicio(isoDate(new Date(hoje.getFullYear(), hoje.getMonth(), 1)));
      setFim(isoDate(hoje));
    } else {
      setInicio(isoDate(new Date(hoje.getFullYear(), hoje.getMonth() - meses, hoje.getDate())));
      setFim(isoDate(hoje));
    }
  }

  function exportarCsv() {
    const linhasCsv = [["Natureza", "Grupo", "Item", "Qtd", "Total"]];
    for (const n of sorted(arvore, ordem)) {
      for (const g of sorted(n.filhos, ordem)) {
        for (const i of sorted(g.filhos, ordem)) {
          linhasCsv.push([n.nome, g.nome, i.nome, String(i.qtd), i.total.toFixed(2)]);
        }
      }
    }
    const csv = linhasCsv.map((l) => l.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `categorias_${inicio}_${fim}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const toggle = (chave: string) => setAbertos((s) => ({ ...s, [chave]: !s[chave] }));

  if (isLoading) return <TableSkeleton rows={8} cols={5} />;

  return (
    <div className="space-y-4">
      <SectionCard title="Filtros">
        <div className="grid gap-3 p-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">De</label>
            <Input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Até</label>
            <Input type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Tipo</label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS_FILTRO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_FILTRO.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Natureza</label>
            <Select
              value={natureza}
              onValueChange={(v) => {
                setNatureza(v);
                setGrupo("Todos");
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas</SelectItem>
                {naturezas.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Grupo</label>
            <Select value={grupo} onValueChange={setGrupo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                {gruposDisponiveis.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
          {([["Este mês", 0], ["Últimos 3 meses", 3], ["Este ano", "ano"], ["Ano passado", "anoPassado"]] as const).map(
            ([label, v]) => (
              <button
                key={label}
                type="button"
                onClick={() => atalho(v)}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {label}
              </button>
            ),
          )}
        </div>
      </SectionCard>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total no período", node: <Money value={total} className="text-2xl font-semibold" /> },
          { label: "Lançamentos", node: <p className="text-2xl font-semibold tabular">{formatNumber(filtradas.length)}</p> },
          {
            label: "Ticket médio",
            node: <Money value={filtradas.length ? total / filtradas.length : 0} className="text-2xl font-semibold" />,
          },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <div className="mt-1">{c.node}</div>
          </div>
        ))}
      </div>

      {!filtradas.length ? (
        <SectionCard><EmptyState message="Nenhum lançamento no período e filtros selecionados." /></SectionCard>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard
              title="Top 10 categorias"
              action={
                <Select value={nivel} onValueChange={(v) => setNivel(v as Nivel)}>
                  <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="natureza">Natureza</SelectItem>
                    <SelectItem value="grupo">Grupo</SelectItem>
                    <SelectItem value="item">Item</SelectItem>
                  </SelectContent>
                </Select>
              }
            >
              <div className="h-80 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topN} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid stroke="#2A2D3E" horizontal={false} />
                    <XAxis type="number" stroke="#8B8FA8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="categoria" stroke="#8B8FA8" fontSize={11} width={130} tickLine={false} axisLine={false} />
                    <Tooltip {...tooltipProps} />
                    <Bar dataKey="valor" name="Total" fill="#E8B800" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Evolução mensal">
              <div className="h-80 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolucao}>
                    <CartesianGrid stroke="#2A2D3E" vertical={false} />
                    <XAxis dataKey="mes" stroke="#8B8FA8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#8B8FA8" fontSize={11} width={70} tickLine={false} axisLine={false} />
                    <Tooltip {...tooltipProps} />
                    <Line dataKey="valor" name="Total" stroke="#E8B800" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title="Detalhamento por categoria"
            action={
              <Button variant="outline" size="sm" onClick={exportarCsv}>
                <Download className="mr-2 h-4 w-4" /> CSV
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-medium">Categoria</th>
                    <th
                      className="cursor-pointer px-3 py-2 text-right font-medium hover:text-primary"
                      onClick={() => setOrdem("qtd")}
                    >
                      Qtd. {ordem === "qtd" && "▾"}
                    </th>
                    <th
                      className="cursor-pointer px-3 py-2 text-right font-medium hover:text-primary"
                      onClick={() => setOrdem("valor")}
                    >
                      Total {ordem === "valor" && "▾"}
                    </th>
                    <th className="px-3 py-2 text-right font-medium">% do total</th>
                    <th className="w-40 px-3 py-2 text-left font-medium">Proporção</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted(arvore, ordem).map((n) => {
                    const chaveN = `n:${n.nome}`;
                    const abertoN = abertos[chaveN];
                    return (
                      <Fragment key={chaveN}>
                        <tr className="border-b border-border/60 font-semibold">
                          <td className="px-3 py-2">
                            <button type="button" className="flex items-center gap-1" onClick={() => toggle(chaveN)}>
                              {abertoN ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              {n.nome}
                            </button>
                          </td>
                          <td className="px-3 py-2 text-right tabular">{n.qtd}</td>
                          <td className="px-3 py-2 text-right"><Money value={n.total} /></td>
                          <td className="px-3 py-2 text-right tabular">
                            {total ? formatPercent((n.total / total) * 100) : "—"}
                          </td>
                          <td className="px-3 py-2">
                            <div className="h-2 w-full rounded-full bg-secondary/60">
                              <div
                                className="h-2 rounded-full bg-primary"
                                style={{ width: `${total ? Math.max(2, (n.total / total) * 100) : 0}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                        {abertoN &&
                          sorted(n.filhos, ordem).map((g) => {
                            const chaveG = `${chaveN}|g:${g.nome}`;
                            const abertoG = abertos[chaveG];
                            return (
                              <Fragment key={chaveG}>
                                <tr className="bg-secondary/20">
                                  <td className="py-2 pl-9 pr-3">
                                    <button type="button" className="flex items-center gap-1" onClick={() => toggle(chaveG)}>
                                      {abertoG ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                      {g.nome}
                                    </button>
                                  </td>
                                  <td className="px-3 py-2 text-right tabular">{g.qtd}</td>
                                  <td className="px-3 py-2 text-right"><Money value={g.total} /></td>
                                  <td className="px-3 py-2 text-right tabular">
                                    {total ? formatPercent((g.total / total) * 100) : "—"}
                                  </td>
                                  <td className="px-3 py-2" />
                                </tr>
                                {abertoG &&
                                  sorted(g.filhos, ordem).map((i) => (
                                    <tr key={`${chaveG}|i:${i.nome}`} className="text-muted-foreground">
                                      <td className="py-1.5 pl-16 pr-3">{i.nome}</td>
                                      <td className="px-3 py-1.5 text-right tabular">{i.qtd}</td>
                                      <td className="px-3 py-1.5 text-right tabular">{formatMoney(i.total)}</td>
                                      <td className="px-3 py-1.5 text-right tabular">
                                        {total ? formatPercent((i.total / total) * 100) : "—"}
                                      </td>
                                      <td className="px-3 py-1.5" />
                                    </tr>
                                  ))}
                              </Fragment>
                            );
                          })}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}