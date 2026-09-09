import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  FREQUENCIAS,
  RECORRENTE_KEYS,
  STATUS_RECORRENTE,
  type LancamentoRecorrente,
} from "@/lib/finance";
import { isoDate } from "@/lib/format";

interface FormState {
  nome: string;
  tipo: "Receita" | "Despesa";
  valor: string;
  dia_vencimento: string;
  frequencia: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  meses_antecedencia: string;
  natureza_id: string;
  grupo_id: string;
  item_id: string;
  pessoa_id: string;
  conta_origem_id: string;
  observacoes: string;
}

function emptyForm(tipo: "Receita" | "Despesa"): FormState {
  return {
    nome: "",
    tipo,
    valor: "",
    dia_vencimento: "5",
    frequencia: "Mensal",
    data_inicio: isoDate(new Date()),
    data_fim: "",
    status: "Ativo",
    meses_antecedencia: "1",
    natureza_id: "",
    grupo_id: "",
    item_id: "",
    pessoa_id: "",
    conta_origem_id: "",
    observacoes: "",
  };
}

function fromRow(r: LancamentoRecorrente): FormState {
  return {
    nome: r.nome,
    tipo: (r.tipo as "Receita" | "Despesa") ?? "Receita",
    valor: String(r.valor ?? ""),
    dia_vencimento: String(r.dia_vencimento ?? ""),
    frequencia: r.frequencia ?? "Mensal",
    data_inicio: (r.data_inicio ?? "").slice(0, 10),
    data_fim: (r.data_fim ?? "").slice(0, 10),
    status: r.status ?? "Ativo",
    meses_antecedencia: String(r.meses_antecedencia ?? 1),
    natureza_id: r.natureza_id ? String(r.natureza_id) : "",
    grupo_id: r.grupo_id ? String(r.grupo_id) : "",
    item_id: r.item_id ? String(r.item_id) : "",
    pessoa_id: r.pessoa_id ? String(r.pessoa_id) : "",
    conta_origem_id: r.conta_origem_id ? String(r.conta_origem_id) : "",
    observacoes: r.observacoes ?? "",
  };
}

export function RecorrenteDrawer({
  open,
  onOpenChange,
  registro,
  tipo,
  mode = "edit",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registro: LancamentoRecorrente | null;
  tipo: "Receita" | "Despesa";
  mode?: "edit" | "duplicate";
}) {
  const [form, setForm] = useState<FormState>(() => emptyForm(tipo));
  const [buscaPessoa, setBuscaPessoa] = useState("");
  const queryClient = useQueryClient();
  const isDuplicate = mode === "duplicate";

  useEffect(() => {
    if (!open) return;
    setBuscaPessoa("");
    if (registro) {
      const base = fromRow(registro);
      setForm(isDuplicate ? { ...base, nome: `${base.nome} (cópia)` } : base);
    } else {
      setForm(emptyForm(tipo));
    }
  }, [open, registro, tipo, isDuplicate]);

  const contas = useQuery(contasQuery);
  const pessoas = useQuery(pessoasQuery);
  const naturezas = useQuery(naturezasQuery);
  const grupos = useQuery(gruposQuery(form.natureza_id ? Number(form.natureza_id) : null));
  const itens = useQuery(itensQuery(form.grupo_id ? Number(form.grupo_id) : null));

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const pessoasFiltradas = (pessoas.data ?? []).filter((p) =>
    p.nome.toLowerCase().includes(buscaPessoa.toLowerCase()),
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const valor = Number(form.valor.replace(",", "."));
      const dia = Number(form.dia_vencimento);
      if (!form.nome.trim()) throw new Error("Informe o nome.");
      if (!Number.isFinite(valor) || valor < 0) throw new Error("Valor inválido.");
      if (!Number.isFinite(dia) || dia < 1 || dia > 31)
        throw new Error("Dia de vencimento deve estar entre 1 e 31.");
      if (!form.data_inicio) throw new Error("Informe a data de início.");
      if (!form.natureza_id || !form.grupo_id || !form.item_id)
        throw new Error("Natureza, grupo e item são obrigatórios.");

      const payload = {
        nome: form.nome.trim(),
        tipo: form.tipo,
        valor,
        dia_vencimento: dia,
        frequencia: form.frequencia,
        data_inicio: form.data_inicio,
        data_fim: form.data_fim || null,
        status: form.status,
        meses_antecedencia: Number(form.meses_antecedencia) || 1,
        natureza_id: Number(form.natureza_id),
        grupo_id: Number(form.grupo_id),
        item_id: Number(form.item_id),
        pessoa_id: form.pessoa_id ? Number(form.pessoa_id) : null,
        conta_origem_id: form.conta_origem_id ? Number(form.conta_origem_id) : null,
        observacoes: form.observacoes || null,
      };

      await writeRow(
        "lancamentos_recorrentes",
        registro && !isDuplicate ? "update" : "insert",
        payload,
        registro?.id,
      );
    },
    onSuccess: () => {
      toast.success(registro && !isDuplicate ? "Recorrência atualizada." : "Recorrência criada.");
      RECORRENTE_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto border-border bg-card sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {registro && !isDuplicate
              ? "Editar recorrência"
              : form.tipo === "Receita"
                ? "Nova assinatura"
                : "Nova despesa recorrente"}
          </SheetTitle>
        </SheetHeader>

        <div className="grid gap-4 px-4 pb-6">
          <div className="grid gap-2">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={(e) => set({ nome: e.target.value })} placeholder="Ex.: Plano Full — Cliente X" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Tipo *</Label>
              <Select value={form.tipo} onValueChange={(v) => set({ tipo: v as "Receita" | "Despesa" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Receita">Receita</SelectItem>
                  <SelectItem value="Despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Valor *</Label>
              <Input inputMode="decimal" value={form.valor} onChange={(e) => set({ valor: e.target.value })} placeholder="0,00" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Dia venc. *</Label>
              <Input inputMode="numeric" value={form.dia_vencimento} onChange={(e) => set({ dia_vencimento: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Frequência *</Label>
              <Select value={form.frequencia} onValueChange={(v) => set({ frequencia: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FREQUENCIAS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status *</Label>
              <Select value={form.status} onValueChange={(v) => set({ status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_RECORRENTE.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Início *</Label>
              <Input type="date" value={form.data_inicio} onChange={(e) => set({ data_inicio: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Fim</Label>
              <Input type="date" value={form.data_fim} onChange={(e) => set({ data_fim: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Antecedência</Label>
              <Input inputMode="numeric" value={form.meses_antecedencia} onChange={(e) => set({ meses_antecedencia: e.target.value })} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Natureza *</Label>
            <Select value={form.natureza_id} onValueChange={(v) => set({ natureza_id: v, grupo_id: "", item_id: "" })}>
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
              <Select value={form.grupo_id} disabled={!form.natureza_id} onValueChange={(v) => set({ grupo_id: v, item_id: "" })}>
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
            <Label>Conta</Label>
            <Select value={form.conta_origem_id || "none"} onValueChange={(v) => set({ conta_origem_id: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {(contas.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Cliente / Fornecedor</Label>
            <Input
              placeholder="Buscar por nome…"
              value={buscaPessoa}
              onChange={(e) => setBuscaPessoa(e.target.value)}
            />
            <Select value={form.pessoa_id || "none"} onValueChange={(v) => set({ pessoa_id: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {pessoasFiltradas.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.nome} · {p.tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => set({ observacoes: e.target.value })} rows={3} />
          </div>

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
