import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TipoTransacao = "Receita" | "Despesa" | "Transferência";
export type StatusTransacao = "A Pagar" | "A Receber" | "Atrasada" | "Concluído";
export type Temperatura = "Quente" | "Frio";
export type TipoPessoa = "Cliente" | "Fornecedor";

export const TIPOS: TipoTransacao[] = ["Receita", "Despesa", "Transferência"];
export const STATUSES: StatusTransacao[] = ["A Pagar", "A Receber", "Atrasada", "Concluído"];

export interface ContaBancaria {
  id: number;
  nome: string;
  saldo_inicial: number;
  criado_em?: string;
}

export interface Pessoa {
  id: number;
  nome: string;
  tipo: TipoPessoa;
  criado_em?: string;
}

export interface Natureza {
  id: number;
  nome: string;
  descricao: string | null;
}
export interface Grupo {
  id: number;
  natureza_id: number;
  nome: string;
}
export interface Item {
  id: number;
  grupo_id: number;
  nome: string;
}

export interface Transacao {
  id: number;
  nome: string;
  valor: number;
  tipo: TipoTransacao;
  status: StatusTransacao;
  temperatura: Temperatura | null;
  natureza_id: number;
  grupo_id: number;
  item_id: number;
  conta_origem_id: number | null;
  conta_destino_id: number | null;
  pessoa_id: number | null;
  vencimento: string;
}

export interface TransacaoCompleta extends Omit<Transacao, "natureza_id" | "grupo_id" | "item_id" | "conta_origem_id" | "conta_destino_id" | "pessoa_id"> {
  natureza: string | null;
  grupo: string | null;
  item: string | null;
  conta_origem: string | null;
  conta_destino: string | null;
  pessoa: string | null;
}

export interface SaldoConta {
  id: number;
  conta: string;
  saldo_inicial: number;
  total_entradas: number;
  total_saidas: number;
  saldo_atual: number;
}

export interface ResumoMensal {
  mes: string;
  receita_bruta: number;
  despesa_total: number;
  resultado: number;
  custo_fixo: number;
  custo_variavel: number;
  capex: number;
  crescimento: number;
  total_socios: number;
  distribuicao_pablo: number;
  distribuicao_sandoval: number;
  geracao_caixa: number;
}

export interface ReceitaPorServico {
  mes: string;
  servico: string;
  grupo: string;
  qtd_transacoes: number;
  receita_total: number;
}

export interface LtvCliente {
  pessoa_id: number;
  cliente: string;
  tipo: TipoPessoa;
  total_transacoes: number;
  ltv_total: number;
  primeira_transacao: string | null;
  ultima_transacao: string | null;
}

export interface CalendarioItem {
  id: number;
  vencimento: string;
  nome: string;
  tipo: TipoTransacao;
  status: StatusTransacao;
  valor: number;
  natureza: string | null;
  grupo: string | null;
  item: string | null;
  conta_origem: string | null;
  pessoa: string | null;
  atrasado: boolean;
  dias_para_vencer: number;
}

const db = supabase as unknown as {
  from: (table: string) => any;
};

async function selectAll<T>(table: string, build?: (q: any) => any): Promise<T[]> {
  let query = db.from(table).select("*");
  if (build) query = build(query);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

export const contasQuery = queryOptions({
  queryKey: ["contas_bancarias"],
  queryFn: () => selectAll<ContaBancaria>("contas_bancarias", (q) => q.order("nome")),
});

export const pessoasQuery = queryOptions({
  queryKey: ["pessoas"],
  queryFn: () => selectAll<Pessoa>("pessoas", (q) => q.order("nome")),
});

export const naturezasQuery = queryOptions({
  queryKey: ["natureza"],
  queryFn: () => selectAll<Natureza>("natureza", (q) => q.order("id")),
});

export const gruposQuery = (naturezaId: number | null) =>
  queryOptions({
    queryKey: ["grupo", naturezaId],
    enabled: naturezaId != null,
    queryFn: () => selectAll<Grupo>("grupo", (q) => q.eq("natureza_id", naturezaId).order("nome")),
  });

export const itensQuery = (grupoId: number | null) =>
  queryOptions({
    queryKey: ["item", grupoId],
    enabled: grupoId != null,
    queryFn: () => selectAll<Item>("item", (q) => q.eq("grupo_id", grupoId).order("nome")),
  });

export const transacoesCompletasQuery = queryOptions({
  queryKey: ["transacoes_completas"],
  queryFn: () => selectAll<TransacaoCompleta>("transacoes_completas", (q) => q.order("vencimento", { ascending: false }).limit(1000)),
});

export const transacoesRawQuery = queryOptions({
  queryKey: ["transacoes"],
  queryFn: () => selectAll<Transacao>("transacoes", (q) => q.order("vencimento", { ascending: false }).limit(1000)),
});

export const saldoContasQuery = queryOptions({
  queryKey: ["saldo_contas"],
  queryFn: () => selectAll<SaldoConta>("saldo_contas", (q) => q.order("id")),
});

export const resumoMensalQuery = queryOptions({
  queryKey: ["resumo_mensal"],
  queryFn: () => selectAll<ResumoMensal>("resumo_mensal", (q) => q.order("mes")),
});

export const receitaPorServicoQuery = queryOptions({
  queryKey: ["receita_por_servico"],
  queryFn: () => selectAll<ReceitaPorServico>("receita_por_servico", (q) => q.order("receita_total", { ascending: false })),
});

export const ltvClientesQuery = queryOptions({
  queryKey: ["ltv_clientes"],
  queryFn: () => selectAll<LtvCliente>("ltv_clientes", (q) => q.order("ltv_total", { ascending: false })),
});

export const calendarioQuery = queryOptions({
  queryKey: ["calendario"],
  queryFn: () => selectAll<CalendarioItem>("calendario", (q) => q.order("vencimento")),
});

export const FINANCE_KEYS = [
  ["transacoes_completas"],
  ["transacoes"],
  ["saldo_contas"],
  ["resumo_mensal"],
  ["receita_por_servico"],
  ["ltv_clientes"],
  ["calendario"],
];

export async function writeRow(
  table: string,
  action: "insert" | "update" | "delete",
  payload: Record<string, unknown>,
  id?: number,
) {
  const q = db.from(table);
  const { error } =
    action === "insert"
      ? await q.insert(payload)
      : action === "update"
        ? await q.update(payload).eq("id", id)
        : await q.delete().eq("id", id);
  if (error) throw new Error(error.message);
}