import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as unknown as {
  from: (table: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => any;
};

export type TipoRecorrente = "Receita" | "Despesa";
export type FrequenciaRecorrente = "Mensal" | "Bimestral" | "Trimestral" | "Semestral" | "Anual";
export type StatusRecorrente = "Ativo" | "Pausado" | "Encerrado";

export const FREQUENCIAS: FrequenciaRecorrente[] = [
  "Mensal",
  "Bimestral",
  "Trimestral",
  "Semestral",
  "Anual",
];

/** Passo em meses de cada frequencia — espelha o gerador no banco. */
export const PASSO_MESES: Record<FrequenciaRecorrente, number> = {
  Mensal: 1,
  Bimestral: 2,
  Trimestral: 3,
  Semestral: 6,
  Anual: 12,
};

export interface LancamentoRecorrente {
  id: number;
  nome: string;
  tipo: TipoRecorrente;
  natureza_id: number | null;
  grupo_id: number | null;
  item_id: number | null;
  pessoa_id: number | null;
  conta_origem_id: number | null;
  valor: number;
  dia_vencimento: number;
  frequencia: FrequenciaRecorrente;
  data_inicio: string;
  data_fim: string | null;
  status: StatusRecorrente;
  meses_antecedencia: number | null;
  total_ocorrencias: number | null;
  renovado_de_id: number | null;
  valor_estimado: boolean;
  ultima_geracao: string | null;
  observacoes: string | null;
}

export interface AlertaSistema {
  tipo: "contrato_vencendo" | "contrato_encerrado" | "valor_a_confirmar" | "atrasado";
  mensagem: string;
  severidade: "Alta" | "Média";
  referencia: string;
  origem_id: number;
  pessoa_id: number | null;
}

export interface PrevisaoCaixa {
  periodo: string;
  periodo_curto: string;
  recebido: number;
  pago: number;
  a_receber: number;
  a_pagar: number;
  saldo_previsto: number;
  valor_estimado_pendente: number;
}

export interface CandidatoVinculo {
  recorrente_id: number;
  contrato: string;
  transacao_id: number;
  lancamento: string;
  vencimento: string;
  valor: number;
  status: string;
}

export interface OcorrenciaRecorrente {
  id: number;
  nome: string;
  valor: number;
  status: string;
  vencimento: string;
  competencia: string | null;
  valor_estimado: boolean;
}

export const RECORRENTES_KEYS: (readonly unknown[])[] = [
  ["lancamentos_recorrentes"],
  ["alertas_sistema"],
  ["previsao_caixa"],
  ["recorrentes_candidatos"],
  ["ocorrencias_recorrente"],
];

async function selectAll<T>(table: string, build?: (q: any) => any): Promise<T[]> {
  let query = db.from(table).select("*");
  if (build) query = build(query);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

export const recorrentesQuery = queryOptions({
  queryKey: ["lancamentos_recorrentes"],
  queryFn: () =>
    selectAll<LancamentoRecorrente>("lancamentos_recorrentes", (q) =>
      q.order("status").order("nome"),
    ),
});

export const alertasQuery = queryOptions({
  queryKey: ["alertas_sistema"],
  staleTime: 60 * 1000,
  queryFn: () => selectAll<AlertaSistema>("alertas_sistema", (q) => q.order("referencia")),
});

export const previsaoCaixaQuery = queryOptions({
  queryKey: ["previsao_caixa"],
  staleTime: 2 * 60 * 1000,
  queryFn: () => selectAll<PrevisaoCaixa>("previsao_caixa", (q) => q.order("periodo")),
});

export const candidatosQuery = (recorrenteId: number | null) =>
  queryOptions({
    queryKey: ["recorrentes_candidatos", recorrenteId],
    enabled: recorrenteId != null,
    queryFn: () =>
      selectAll<CandidatoVinculo>("recorrentes_candidatos", (q) =>
        q.eq("recorrente_id", recorrenteId).order("vencimento"),
      ),
  });

export const ocorrenciasQuery = (recorrenteId: number | null) =>
  queryOptions({
    queryKey: ["ocorrencias_recorrente", recorrenteId],
    enabled: recorrenteId != null,
    queryFn: async (): Promise<OcorrenciaRecorrente[]> => {
      const { data, error } = await db
        .from("transacoes")
        .select("id,nome,valor,status,vencimento,competencia,valor_estimado")
        .eq("lancamento_recorrente_id", recorrenteId)
        .order("vencimento");
      if (error) throw new Error(error.message);
      return (data ?? []) as OcorrenciaRecorrente[];
    },
  });

export type RecorrenteInput = Omit<
  LancamentoRecorrente,
  "id" | "renovado_de_id" | "ultima_geracao"
>;

export async function salvarRecorrente(payload: Partial<RecorrenteInput>, id?: number) {
  const query = db.from("lancamentos_recorrentes");
  const { error } = id
    ? await query.update(payload).eq("id", id)
    : await query.insert(payload);
  if (error) throw new Error(error.message);
}

export async function alterarStatusRecorrente(id: number, status: StatusRecorrente) {
  const { error } = await db.from("lancamentos_recorrentes").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Gera as ocorrencias que faltam. Idempotente no banco: nunca duplica. */
export async function gerarOcorrencias(id?: number): Promise<number> {
  const { data, error } = await db.rpc("gerar_transacoes_recorrentes", { p_id: id ?? null });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as { criadas: number }[];
  return rows.reduce((total, row) => total + (row.criadas ?? 0), 0);
}

/** Liga cobrancas ja lancadas ao contrato, preservando valor, data e status. */
export async function vincularHistorico(recorrenteId: number, transacaoIds: number[]): Promise<number> {
  const { data, error } = await db.rpc("vincular_transacoes_recorrente", {
    p_recorrente_id: recorrenteId,
    p_transacao_ids: transacaoIds,
  });
  if (error) throw new Error(error.message);
  return Number(data ?? 0);
}

export async function renovarContrato(id: number, meses: number, novoValor?: number | null) {
  const { data, error } = await db.rpc("renovar_recorrente", {
    p_id: id,
    p_meses: meses,
    p_novo_valor: novoValor ?? null,
  });
  if (error) throw new Error(error.message);
  return Number(data ?? 0);
}

/** Confirma o valor real de uma ocorrencia estimada (ex.: conta de energia). */
export async function confirmarValorOcorrencia(transacaoId: number, valor: number) {
  const { error } = await db
    .from("transacoes")
    .update({ valor, valor_estimado: false })
    .eq("id", transacaoId);
  if (error) throw new Error(error.message);
}

/** Reagenda uma ocorrencia. A competencia NAO muda — e a identidade da ocorrencia. */
export async function reagendarOcorrencia(transacaoId: number, vencimento: string) {
  const { error } = await db.from("transacoes").update({ vencimento }).eq("id", transacaoId);
  if (error) throw new Error(error.message);
}

/** Data final calculada a partir do numero de ocorrencias — usada na previa da tela. */
export function calcularDataFim(
  dataInicio: string,
  frequencia: FrequenciaRecorrente,
  totalOcorrencias: number,
): string {
  const [ano, mes, dia] = dataInicio.split("-").map(Number);
  const passo = PASSO_MESES[frequencia];
  const base = new Date(Date.UTC(ano, mes - 1, 1));
  base.setUTCMonth(base.getUTCMonth() + (totalOcorrencias - 1) * passo);
  const ultimoDia = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
  base.setUTCDate(Math.min(dia, ultimoDia));
  return base.toISOString().slice(0, 10);
}

/** Previa das datas que serao geradas, com a mesma regra de dia curto do banco. */
export function previaVencimentos(
  dataInicio: string,
  diaVencimento: number,
  frequencia: FrequenciaRecorrente,
  quantidade: number,
): string[] {
  const [ano, mes] = dataInicio.split("-").map(Number);
  const passo = PASSO_MESES[frequencia];
  const datas: string[] = [];
  for (let i = 0; i < Math.max(0, Math.min(quantidade, 60)); i++) {
    const ref = new Date(Date.UTC(ano, mes - 1 + i * passo, 1));
    const ultimoDia = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 0)).getUTCDate();
    ref.setUTCDate(Math.min(diaVencimento, ultimoDia));
    datas.push(ref.toISOString().slice(0, 10));
  }
  return datas;
}
