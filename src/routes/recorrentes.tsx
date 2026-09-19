import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Link2, Loader2, Pencil, Plus, RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageHeader, SectionCard, TableSkeleton } from "@/components/finance/ui-bits";
import { formatDate, formatMoney } from "@/lib/format";
import { contasQuery, pessoasQuery } from "@/lib/finance";
import {
  FREQUENCIAS,
  alertasQuery,
  alterarStatusRecorrente,
  calcularDataFim,
  candidatosQuery,
  confirmarValorOcorrencia,
  gerarOcorrencias,
  ocorrenciasQuery,
  previaVencimentos,
  previsaoCaixaQuery,
  recorrentesQuery,
  renovarContrato,
  salvarRecorrente,
  vincularHistorico,
  type FrequenciaRecorrente,
  type LancamentoRecorrente,
  type TipoRecorrente,
} from "@/lib/recorrentes";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/recorrentes")({
  head: () => ({
    meta: [
      { title: "Recorrentes — SetTake Finance" },
      { name: "description", content: "Contratos recorrentes, despesas repetidas e previsão de caixa." },
    ],
  }),
  component: Recorrentes,
});

const db = supabase as unknown as { from: (table: string) => any };

function useRefresh() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries();
}

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

/* ---------------------------- hierarquia ---------------------------- */

function useHierarquia() {
  const natureza = useQuery({
    queryKey: ["natureza"],
    queryFn: async () => {
      const { data, error } = await db.from("natureza").select("id,nome").order("nome");
      if (error) throw new Error(error.message);
      return (data ?? []) as { id: number; nome: string }[];
    },
  });
  const grupo = useQuery({
    queryKey: ["grupo"],
    queryFn: async () => {
      const { data, error } = await db.from("grupo").select("id,nome,natureza_id").order("nome");
      if (error) throw new Error(error.message);
      return (data ?? []) as { id: number; nome: string; natureza_id: number }[];
    },
  });
  const item = useQuery({
    queryKey: ["item"],
    queryFn: async () => {
      const { data, error } = await db.from("item").select("id,nome,grupo_id").order("nome");
      if (error) throw new Error(error.message);
      return (data ?? []) as { id: number; nome: string; grupo_id: number }[];
    },
  });
  return { natureza, grupo, item };
}

/* --------------------------- alertas ---------------------------- */

function AlertasCard() {
  const alertas = useQuery(alertasQuery);
  if (alertas.isLoading) return null;
  const lista = alertas.data ?? [];
  if (!lista.length) return null;

  return (
    <SectionCard title="Alertas" description="Contratos vencendo, valores a confirmar e lançamentos atrasados">
      <ul className="divide-y">
        {lista.map((a) => (
          <li key={`${a.tipo}-${a.origem_id}`} className="flex items-start gap-3 py-2 text-sm">
            <AlertTriangle
              className={a.severidade === "Alta" ? "mt-0.5 size-4 shrink-0 text-destructive" : "mt-0.5 size-4 shrink-0 text-muted-foreground"}
            />
            <div className="min-w-0">
              <p className="truncate">{a.mensagem}</p>
              <p className="text-xs text-muted-foreground">
                {a.severidade} · {formatDate(a.referencia)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

/* -------------------------- formulário -------------------------- */

interface FormState {
  nome: string;
  tipo: TipoRecorrente;
  natureza_id: string;
  grupo_id: string;
  item_id: string;
  pessoa_id: string;
  conta_origem_id: string;
  valor: string;
  dia_vencimento: string;
  frequencia: FrequenciaRecorrente;
  data_inicio: string;
  total_ocorrencias: string;
  valor_estimado: boolean;
  meses_antecedencia: string;
  observacoes: string;
}

function formVazio(tipo: TipoRecorrente): FormState {
  return {
    nome: "",
    tipo,
    natureza_id: "",
    grupo_id: "",
    item_id: "",
    pessoa_id: "",
    conta_origem_id: "",
    valor: "",
    dia_vencimento: "10",
    frequencia: "Mensal",
    data_inicio: hoje(),
    total_ocorrencias: tipo === "Receita" ? "12" : "12",
    valor_estimado: tipo === "Despesa",
    meses_antecedencia: "3",
    observacoes: "",
  };
}

function RecorrenteDialog({
  open,
  onOpenChange,
  tipo,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tipo: TipoRecorrente;
  editing: LancamentoRecorrente | null;
}) {
  const refresh = useRefresh();
  const { natureza, grupo, item } = useHierarquia();
  const pessoas = useQuery(pessooasQuery);
  const contas = useQuery(contasQuery);
  const [form, setForm] = useState<FormState>(() =>
    editing
      ? {
          nome: editing.nome,
          tipo: editing.tipo,
          natureza_id: String(editing.natureza_id ?? ""),
          grupo_id: String(editing.grupo_id ?? ""),
          item_id: String(editing.item_id ?? ""),
          pessooa_id: String(editing.pessooa_id ?? ""),
          conta_origem_id: String(editing.conta_origem_id ?? ""),
          valor: String(editing.valor),
          dia_vencimento: String(editing.dia_vencimento),
          frequencia: editing.frequencia,
          data_inicio: editing.data_inicio,
          total_ocorrencias: String(editing.total_ocorrencias ?? ""),
          valor_estimado: editing.valor_estimado,
          meses_antecedencia: String(editing.meses_antecedencia ?? 3),
          observacoes: editing.observacoes ?? "",
        }
      : formVazio(tipo),
  );

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const gruposFiltrados = useMemo(
    () => (grupo.data ?? []).filter((g) => String(g.natureza_id) === form.natureza_id),
    [grrupo.data, form.natureza_id],
  );
  const itensFiltrados = useMemo(
    () => (item.data ?? []).filter((i) => String(i.grupo_id) === form.grupo_id),
    [item.data, form.grupo_id],
  );

  const total = Number(form.total_ocorrencias || 0);
  const previa = useMemo(
    () =>
      total > 0 && form.data_inicio
        ? previaVencimentos(form.data_inicio, Number(form.dia_vencimento || 1), form.frequencia, Math.min(total, 6))
        : [],
    [form.data_inicio, form.dia_vencimento, form.frequencia, total],
  );

  const salvar = useMutation({
    mutationFn: async () => {
      if (!form.nome.trim()) throw new Error("Informe o nome.");
      if (!form.natureza_id || !form.grupo_id || !form.item_id)
        throw new Error("Selecione natureza, grupo e item — o banco exige a hierarquia completa.");
      if (!Number(form.valor)) throw new Error("Informe o valor.");
      if (!total) throw new Error("Informe quantas ocorrencias serão geradas.");

      await salvarRecorrente(
        {
          nome: form.nome.trim(),
          tipo: form.tipo,
          natureza_id: Number(form.natureza_id),
          grupo_id: Number(form.grupo_id),
          item_id: Number(form.item_id),
          pessoa_id: form.pessoa_id ? Number(form.pessoa_id) : null,
          conta_origem_id: form.conta_origem_id ? Number(form.conta_origem_id) : null,
          valor: Number(form.valor),
          dia_vencimento: Number(form.dia_vencimento),
          frequencia: form.frequencia,
          data_inicio: form.data_inicio,
          data_fim: calcularDataFim(form.data_inicio, form.frequencia, total),
          total_ocorrencias: total,
          valor_estimado: form.valor_estimado,
          meses_antecedencia: Number(form.meses_antecedencia || 3),
          status: "Ativo",
          observacoes: form.observacoes.trim() || null,
        },
        editing?.id,
      );
    },
    onSuccess: () => {
      toast.success(editing ? "Recorrencia atualizada." : "Recorrencia criada. Use 'Gerar' para lançar as ocorrencias.");
      refresh();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar" : form.tipo === "Receita" ? "Novo contrato recorrente" : "Nova despesa recorrente"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label>Nome</Label>
            <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder={form.tipo === "Receita" ? "Amare Pediatria — mensalidade" : "Energia elétrica"} />
          </div>

          <div className="grid gap-2">
            <Label>{form.tipo === "Receita" ? "Cliente" : "Fornecedor"}</Label>
            <Select value={form.pessooa_id} onValueChange={(v) => set("pessooa_id", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {(pessoas.data ?? []).map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Conta</Label>
            <Select value={form.conta_origem_id} onValueChange={(v) => set("conta_origem_id", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {(contas.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Natureza</Label>
            <Select
              value={form.natureza_id}
              onValueChange={(v) => setForm((f) => ({ ...f, natureza_id: v, grupo_id: "", item_id: "" }))}
            >
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {(natureza.data ?? []).map((n) => (
                  <SelectItem key={n.id} value={String(n.id)}>{n.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Grupo</Label>
            <Select
              value={form.grupo_id}
              onValueChange={(v) => setForm((f) => ({ ...f, grupo_id: v, item_id: "" }))}
              disabled={!form.natureza_id}
            >
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {gruposFiltrados.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>{g.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Item</Label>
            <Select value={form.item_id} onValueChange={(v) => set("item_id", v)} disabled={!form.grupo_id}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {itensFiltrados.map((i) => (
                  <SelectItem key={i.id} value={String(i.id)}>{i.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Valor</Label>
            <Input inputMode="decimal" value={form.valor} onChange={(e) => set("valor", e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label>Frequência</Label>
            <Select value={form.frequencia} onValueChange={(v) => set("frequencia", v as FrequenciaRecorrente)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FREQUENCIAS.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Dia do vencimento</Label>
            <Input
              type="number"
              min={1}
              max={31}
              value={form.dia_vencimento}
              onChange={(e) => set("dia_vencimento", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Primeiro vencimento (mês de inicio)</Label>
            <Input type="date" value={form.data_inicio} onChange={(e) => set("data_inicio", e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label>Quantas ocorrencias (inclui a primeira)</Label>
            <Input
              type="number"
              min={1}
              value={form.total_ocorrencias}
              onChange={(e) => set("total_ocorrencias", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Gerar com antecedencia de (meses)</Label>
            <Input
              type="number"
              min={1}
              max={24}
              value={form.meses_antecedencia}
              onChange={(e) => set("meses_antecedencia", e.target.value)}
            />
          </div>

          <label className="flex items-start gap-2 sm:col-span-2">
            <Checkbox
              checked={form.valor_estimado}
              onCheckedChange={(v) => set("valor_estimado", v === true)}
            />
            <span className="text-sm">
              Valor e estimado (ex.: onergia)
              <span className="block text-xs text-muted-foreground">
                As ocorrencias nascem marcadas para confirmacao e aparecem nos alertas. Nunca sao pagas automaticamente.
              </span>
            </span>
          </label>

          <div className="grid gap-2 sm:col-span-2">
            <Label>Observacoes</Label>
            <Input value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
          </div>

          {previa.length > 0 && (
            <div className="rounded-lg border bg-muted/40 p-3 text-xs sm:col-span-2">
              <p className="mb-1 font-medium">
                Previa - {total} ocorrencia(s), termino em {formatDate(calcularDataFim(form.data_inicio, form.frequencia, total))}
              </p>
              <p className="text-muted-foreground">
                {previa.map((d) => formatDate(d)).join(" - ")}
                {total > previa.length ? ` ... +${total - previa.length}` : ""}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
            {salvar.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}