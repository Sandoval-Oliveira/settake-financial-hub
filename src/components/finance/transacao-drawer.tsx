import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  contasQuery,
  gruposQuery,
  itensQuery,
  naturezasQuery,
  pessoasQuery,
  writeRow,
  FINANCE_KEYS,
  STATUSES,
  TIPOS,
  type StatusTransacao,
  type TipoTransacao,
  type Transacao,
} from "@/lib/finance";
import { isoDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Template {
  label: string;
  nome: string;
  natureza_id: number;
  grupo: string;
  item: string;
  status: StatusTransacao;
  temperatura: string;
}

const TEMPLATES_DESPESA: Template[] = [
  { label: "Aluguel", nome: "Aluguel", natureza_id: 3, grupo: "Espaço Físico", item: "Aluguel", status: "A Pagar", temperatura: "Quente" },
  { label: "Internet", nome: "Ampernet", natureza_id: 3, grupo: "Espaço Físico", item: "Internet", status: "A Pagar", temperatura: "Quente" },
  { label: "Energia", nome: "Energia Elétrica", natureza_id: 3, grupo: "Espaço Físico", item: "Energia", status: "A Pagar", temperatura: "Quente" },
  { label: "Condomínio", nome: "Condomínio", natureza_id: 3, grupo: "Espaço Físico", item: "Condomínio", status: "A Pagar", temperatura: "Quente" },
  { label: "Transporte", nome: "Transporte", natureza_id: 4, grupo: "Mobilidade", item: "Transporte", status: "A Pagar", temperatura: "Quente" },
  { label: "DAS", nome: "Impostos — DAS", natureza_id: 4, grupo: "Fiscal", item: "Impostos — DAS", status: "A Pagar", temperatura: "Quente" },
  { label: "Taxa Pix", nome: "Taxa de Recebimento", natureza_id: 4, grupo: "Fiscal", item: "Taxa de Recebimento", status: "Concluído", temperatura: "Quente" },
];

const TEMPLATES_RECEITA: Template[] = [
  { label: "Plano Full", nome: "Plano Full", natureza_id: 1, grupo: "Recorrência", item: "Plano Full", status: "A Receber", temperatura: "Frio" },
  { label: "Plano Pocket", nome: "Plano Pocket", natureza_id: 1, grupo: "Recorrência", item: "Plano Pocket", status: "A Receber", temperatura: "Frio" },
  { label: "Diária", nome: "Diária de Captação", natureza_id: 1, grupo: "Projeto", item: "Diária de Captação", status: "A Receber", temperatura: "Quente" },
];

interface FormState {
  nome: string;
  tipo: TipoTransacao;
  valor: string;
  vencimento: string;
  status: StatusTransacao;
  temperatura: string;
  natureza_id: string;
  grupo_id: string;
  item_id: string;
  conta_origem_id: string;
  conta_destino_id: string;
  pessoa_id: string;
  conciliada: boolean;
}

function emptyForm(): FormState {
  return {
    nome: "",
    tipo: "Despesa",
    valor: "",
    vencimento: isoDate(new Date()),
    status: "A Pagar",
    temperatura: "",
    natureza_id: "",
    grupo_id: "",
    item_id: "",
    conta_origem_id: "",
    conta_destino_id: "",
    pessoa_id: "",
  };
}

function fromTransacao(t: Transacao): FormState {
  return {
    nome: t.nome,
    tipo: t.tipo,
    valor: String(t.valor ?? ""),
    vencimento: (t.vencimento ?? "").slice(0, 10),
    status: t.status,
    temperatura: t.temperatura ?? "",
    natureza_id: String(t.natureza_id ?? ""),
    grupo_id: String(t.grupo_id ?? ""),
    item_id: String(t.item_id ?? ""),
    conta_origem_id: t.conta_origem_id ? String(t.conta_origem_id) : "",
    conta_destino_id: t.conta_destino_id ? String(t.conta_destino_id) : "",
    pessoa_id: t.pessoa_id ? String(t.pessoa_id) : "",
  };
}

export function TransacaoDrawer({
  open,
  onOpenChange,
  transacao,
  mode = "edit",
  lockedTipo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transacao: Transacao | null;
  mode?: "edit" | "duplicate";
  lockedTipo?: TipoTransacao | undefined;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [pending, setPending] = useState<{ grupo: string; item: string } | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const isDuplicate = mode === "duplicate";

  useEffect(() => {
    if (!open) return;
    setPending(null);
    setActiveTemplate(null);
    if (transacao) {
      const base = fromTransacao(transacao);
      if (isDuplicate) {
        setForm({
          ...base,
          nome: "",
          vencimento: "",
          status:
            base.tipo === "Receita" ? "A Pagar" : base.tipo === "Despesa" ? "A Receber" : base.status,
        });
      } else {
        setForm(base);
      }
    } else {
      const empty = emptyForm();
      setForm(
        lockedTipo
          ? {
              ...empty,
              tipo: lockedTipo,
              status: lockedTipo === "Receita" ? "A Receber" : lockedTipo === "Despesa" ? "A Pagar" : empty.status,
            }
          : empty,
      );
    }
  }, [open, transacao, isDuplicate, lockedTipo]);

  const contas = useQuery(contasQuery);
  const pessoas = useQuery(pessoasQuery);
  const naturezas = useQuery(naturezasQuery);
  const grupos = useQuery(gruposQuery(form.natureza_id ? Number(form.natureza_id) : null));
  const itens = useQuery(itensQuery(form.grupo_id ? Number(form.grupo_id) : null));

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    if (!pending) return;
    if (!form.grupo_id) {
      const g = (grupos.data ?? []).find((x) => x.nome === pending.grupo);
      if (g) setForm((f) => ({ ...f, grupo_id: String(g.id), item_id: "" }));
      return;
    }
    const it = (itens.data ?? []).find((x) => x.nome === pending.item);
    if (it) {
      setForm((f) => ({ ...f, item_id: String(it.id) }));
      setPending(null);
    }
  }, [pending, grupos.data, itens.data, form.grupo_id]);

  function applyTemplate(t: Template) {
    setActiveTemplate(t.label);
    setForm((f) => ({
      ...f,
      nome: t.nome,
      status: t.status,
      temperatura: t.temperatura,
      natureza_id: String(t.natureza_id),
      grupo_id: "",
      item_id: "",
    }));
    setPending({ grupo: t.grupo, item: t.item });
  }

  const templates =
    isDuplicate || transacao
      ? []
      : form.tipo === "Despesa"
        ? TEMPLATES_DESPESA
        : form.tipo === "Receita"
          ? TEMPLATES_RECEITA
          : [];

  const mutation = useMutation({
    mutationFn: async () => {
      const valor = Number(form.valor.replace(",", "."));
      if (!form.nome.trim()) throw new Error("Informe o nome do lançamento.");
      if (!Number.isFinite(valor) || valor <= 0) throw new Error("O valor deve ser maior que zero.");
      if (!form.vencimento) throw new Error("Informe o vencimento.");
      if (!form.natureza_id || !form.grupo_id || !form.item_id)
        throw new Error("Natureza, grupo e item são obrigatórios.");
      if (!form.conta_origem_id) throw new Error("Informe a conta de origem.");
      if (form.tipo === "Transferência") {
        if (!form.conta_destino_id) throw new Error("Transferência exige conta de destino.");
        if (form.conta_destino_id === form.conta_origem_id)
          throw new Error("A conta de destino deve ser diferente da origem.");
      }

      const payload = {
        nome: form.nome.trim(),
        valor,
        tipo: form.tipo,
        status: form.status,
        temperatura: form.temperatura || null,
        natureza_id: Number(form.natureza_id),
        grupo_id: Number(form.grupo_id),
        item_id: Number(form.item_id),
        conta_origem_id: Number(form.conta_origem_id),
        conta_destino_id: form.tipo === "Transferência" ? Number(form.conta_destino_id) : null,
        pessoa_id: form.tipo === "Transferência" || !form.pessoa_id ? null : Number(form.pessoa_id),
        vencimento: form.vencimento,
      };

      await writeRow("transacoes", transacao && !isDuplicate ? "update" : "insert", payload, transacao?.id);
    },
    onSuccess: () => {
      toast.success(
        isDuplicate
          ? "Lançamento duplicado com sucesso!"
          : transacao
            ? "Lançamento atualizado."
            : "Lançamento criado.",
      );
      FINANCE_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto border-border bg-card sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {isDuplicate
              ? "Duplicar Lançamento"
              : transacao
                ? "Editar Lançamento"
                : lockedTipo
                  ? `Nova ${lockedTipo === "Transferência" ? "Transferência" : lockedTipo}`
                  : "Novo Lançamento"}
          </SheetTitle>
        </SheetHeader>

        <div className="grid gap-4 px-4 pb-6">
          {templates.length > 0 && (
            <div className="grid gap-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Templates Rápidos</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {templates.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1 text-xs transition-colors",
                      activeTemplate === t.label
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-[#3A3D50] bg-[#2A2D3E] text-foreground hover:border-primary hover:text-primary",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={(e) => set({ nome: e.target.value })} placeholder="Ex.: Mensalidade cliente X" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Tipo *</Label>
              <Select
                value={form.tipo}
                disabled={!!lockedTipo}
                onValueChange={(v) =>
                  set({
                    tipo: v as TipoTransacao,
                    conta_destino_id: "",
                    pessoa_id: v === "Transferência" ? "" : form.pessoa_id,
                    status: v === "Receita" ? "A Receber" : v === "Despesa" ? "A Pagar" : form.status,
                  })
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Valor *</Label>
              <Input
                inputMode="decimal"
                value={form.valor}
                onChange={(e) => set({ valor: e.target.value })}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Vencimento *</Label>
              <Input type="date" value={form.vencimento} onChange={(e) => set({ vencimento: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Status *</Label>
              <Select value={form.status} onValueChange={(v) => set({ status: v as StatusTransacao })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Temperatura</Label>
            <Select value={form.temperatura || "none"} onValueChange={(v) => set({ temperatura: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não informar</SelectItem>
                <SelectItem value="Quente">🔥 Quente</SelectItem>
                <SelectItem value="Frio">❄️ Frio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Natureza *</Label>
            <Select
              value={form.natureza_id}
              onValueChange={(v) => set({ natureza_id: v, grupo_id: "", item_id: "" })}
            >
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {(naturezas.data ?? []).map((n) => (
                  <SelectItem key={n.id} value={String(n.id)}>{n.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Grupo *</Label>
              <Select
                value={form.grupo_id}
                disabled={!form.natureza_id}
                onValueChange={(v) => set({ grupo_id: v, item_id: "" })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(grupos.data ?? []).map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>{g.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Item *</Label>
              <Select value={form.item_id} disabled={!form.grupo_id} onValueChange={(v) => set({ item_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(itens.data ?? []).map((i) => (
                    <SelectItem key={i.id} value={String(i.id)}>{i.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Conta Origem *</Label>
            <Select value={form.conta_origem_id} onValueChange={(v) => set({ conta_origem_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {(contas.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.tipo === "Transferência" && (
            <div className="grid gap-2">
              <Label>Conta Destino *</Label>
              <Select value={form.conta_destino_id} onValueChange={(v) => set({ conta_destino_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(contas.data ?? [])
                    .filter((c) => String(c.id) !== form.conta_origem_id)
                    .map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {form.tipo !== "Transferência" && (
            <div className="grid gap-2">
              <Label>Pessoa</Label>
              <Select value={form.pessoa_id || "none"} onValueChange={(v) => set({ pessoa_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {(pessoas.data ?? []).map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nome} · {p.tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}