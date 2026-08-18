import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  contasQuery,
  pessoasQuery,
  writeRow,
  FINANCE_KEYS,
  type ContaBancaria,
  type Pessoa,
  type TipoPessoa,
} from "@/lib/finance";
import { formatDate, formatMoney } from "@/lib/format";
import { EmptyState, PageHeader, SectionCard, TableSkeleton } from "@/components/finance/ui-bits";
import { PessoaBadge } from "@/components/finance/badges";

export const Route = createFileRoute("/cadastros")({
  head: () => ({
    meta: [
      { title: "Cadastros — SetTake Finance" },
      { name: "description", content: "Gerencie clientes, fornecedores e contas bancárias da SetTake." },
      { property: "og:title", content: "Cadastros — SetTake Finance" },
      { property: "og:description", content: "Pessoas e contas bancárias do ERP financeiro." },
    ],
  }),
  component: Cadastros,
});

function useRefresh() {
  const queryClient = useQueryClient();
  return () => {
    ["pessoas", "contas_bancarias"].forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
    FINANCE_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
  };
}

function PessoasTab() {
  const refresh = useRefresh();
  const pessoas = useQuery(pessoasQuery);
  const [busca, setBusca] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Pessoa | null>(null);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoPessoa>("Cliente");

  const salvar = useMutation({
    mutationFn: async () => {
      if (!nome.trim()) throw new Error("Informe o nome.");
      await writeRow("pessoas", editing ? "update" : "insert", { nome: nome.trim(), tipo }, editing?.id);
    },
    onSuccess: () => {
      toast.success(editing ? "Pessoa atualizada." : "Pessoa criada.");
      refresh();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remover = useMutation({
    mutationFn: (id: number) => writeRow("pessoas", "delete", {}, id),
    onSuccess: () => { toast.success("Pessoa excluída."); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(
    () => (pessoas.data ?? []).filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase())),
    [pessoas.data, busca],
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input placeholder="Buscar pessoa…" value={busca} onChange={(e) => setBusca(e.target.value)} className="w-64" />
        <Button
          className="ml-auto"
          onClick={() => { setEditing(null); setNome(""); setTipo("Cliente"); setOpen(true); }}
        >
          <Plus className="mr-1 size-4" /> Nova Pessoa
        </Button>
      </div>

      <SectionCard>
        {pessoas.isLoading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : !rows.length ? (
          <EmptyState message="Nenhuma pessoa cadastrada." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left font-medium">ID</th>
                  <th className="px-3 py-2 text-left font-medium">Nome</th>
                  <th className="px-3 py-2 text-left font-medium">Tipo</th>
                  <th className="px-3 py-2 text-left font-medium">Criado em</th>
                  <th className="px-3 py-2 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p, i) => (
                  <tr key={p.id} className={i % 2 ? "bg-secondary/25" : undefined}>
                    <td className="px-3 py-2 text-muted-foreground tabular">{p.id}</td>
                    <td className="px-3 py-2">{p.nome}</td>
                    <td className="px-3 py-2"><PessoaBadge tipo={p.tipo} /></td>
                    <td className="px-3 py-2 text-muted-foreground">{formatDate(p.criado_em ?? null)}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button
                        aria-label="Editar"
                        className="mr-2 text-muted-foreground hover:text-primary"
                        onClick={() => { setEditing(p); setNome(p.nome); setTipo(p.tipo); setOpen(true); }}
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        aria-label="Excluir"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => { if (confirm(`Excluir "${p.nome}"?`)) remover.mutate(p.id); }}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Pessoa" : "Nova Pessoa"}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoPessoa)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cliente">Cliente</SelectItem>
                  <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
              {salvar.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ContasTab() {
  const refresh = useRefresh();
  const contas = useQuery(contasQuery);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContaBancaria | null>(null);
  const [nome, setNome] = useState("");
  const [saldo, setSaldo] = useState("0");

  const salvar = useMutation({
    mutationFn: async () => {
      const valor = Number(saldo.replace(",", "."));
      if (!nome.trim()) throw new Error("Informe o nome da conta.");
      if (!Number.isFinite(valor)) throw new Error("Saldo inicial inválido.");
      await writeRow("contas_bancarias", editing ? "update" : "insert", { nome: nome.trim(), saldo_inicial: valor }, editing?.id);
    },
    onSuccess: () => {
      toast.success(editing ? "Conta atualizada." : "Conta criada.");
      refresh();
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remover = useMutation({
    mutationFn: (id: number) => writeRow("contas_bancarias", "delete", {}, id),
    onSuccess: () => { toast.success("Conta excluída."); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => { setEditing(null); setNome(""); setSaldo("0"); setOpen(true); }}>
          <Plus className="mr-1 size-4" /> Nova Conta
        </Button>
      </div>

      <SectionCard>
        {contas.isLoading ? (
          <TableSkeleton rows={4} cols={3} />
        ) : !(contas.data ?? []).length ? (
          <EmptyState message="Nenhuma conta bancária cadastrada." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left font-medium">ID</th>
                  <th className="px-3 py-2 text-left font-medium">Nome</th>
                  <th className="px-3 py-2 text-right font-medium">Saldo Inicial</th>
                  <th className="px-3 py-2 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {(contas.data ?? []).map((c, i) => (
                  <tr key={c.id} className={i % 2 ? "bg-secondary/25" : undefined}>
                    <td className="px-3 py-2 text-muted-foreground tabular">{c.id}</td>
                    <td className="px-3 py-2">{c.nome}</td>
                    <td className="px-3 py-2 text-right tabular">{formatMoney(c.saldo_inicial)}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button
                        aria-label="Editar"
                        className="mr-2 text-muted-foreground hover:text-primary"
                        onClick={() => { setEditing(c); setNome(c.nome); setSaldo(String(c.saldo_inicial ?? 0)); setOpen(true); }}
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        aria-label="Excluir"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => { if (confirm(`Excluir "${c.nome}"?`)) remover.mutate(c.id); }}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Conta" : "Nova Conta"}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Saldo inicial</Label>
              <Input inputMode="decimal" value={saldo} onChange={(e) => setSaldo(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
              {salvar.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Cadastros() {
  return (
    <div>
      <PageHeader title="Cadastros" subtitle="Pessoas e contas bancárias" />
      <Tabs defaultValue="pessoas">
        <TabsList>
          <TabsTrigger value="pessoas">Pessoas</TabsTrigger>
          <TabsTrigger value="contas">Contas Bancárias</TabsTrigger>
        </TabsList>
        <TabsContent value="pessoas" className="mt-4"><PessoasTab /></TabsContent>
        <TabsContent value="contas" className="mt-4"><ContasTab /></TabsContent>
      </Tabs>
    </div>
  );
}