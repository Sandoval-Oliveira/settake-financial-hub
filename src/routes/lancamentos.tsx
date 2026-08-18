import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpDown, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  contasQuery,
  transacoesCompletasQuery,
  transacoesRawQuery,
  writeRow,
  FINANCE_KEYS,
  STATUSES,
  TIPOS,
  type Transacao,
} from "@/lib/finance";
import { formatDate, isoDate } from "@/lib/format";
import { EmptyState, Money, PageHeader, SectionCard, TableSkeleton } from "@/components/finance/ui-bits";
import { StatusBadge, Temperatura, TipoBadge } from "@/components/finance/badges";
import { TransacaoDrawer } from "@/components/finance/transacao-drawer";

export const Route = createFileRoute("/lancamentos")({
  head: () => ({
    meta: [
      { title: "Lançamentos — SetTake Finance" },
      { name: "description", content: "Cadastre, filtre e edite receitas, despesas e transferências da SetTake." },
      { property: "og:title", content: "Lançamentos — SetTake Finance" },
      { property: "og:description", content: "Gestão completa de transações financeiras." },
    ],
  }),
  component: Lancamentos,
});

const PAGE_SIZE = 20;

function firstDayOfMonth() {
  const d = new Date();
  return isoDate(new Date(d.getFullYear(), d.getMonth(), 1));
}
function lastDayOfMonth() {
  const d = new Date();
  return isoDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

function Lancamentos() {
  const queryClient = useQueryClient();
  const lista = useQuery(transacoesCompletasQuery);
  const raw = useQuery(transacoesRawQuery);
  const contas = useQuery(contasQuery);

  const [tipo, setTipo] = useState("Todos");
  const [status, setStatus] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [de, setDe] = useState(firstDayOfMonth());
  const [ate, setAte] = useState(lastDayOfMonth());
  const [conta, setConta] = useState("Todas");
  const [asc, setAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Transacao | null>(null);

  const rows = useMemo(() => {
    const data = (lista.data ?? []).filter((t) => {
      if (tipo !== "Todos" && t.tipo !== tipo) return false;
      if (status !== "Todos" && t.status !== status) return false;
      if (busca && !t.nome.toLowerCase().includes(busca.toLowerCase())) return false;
      if (conta !== "Todas" && t.conta_origem !== conta) return false;
      const v = (t.vencimento ?? "").slice(0, 10);
      if (de && v < de) return false;
      if (ate && v > ate) return false;
      return true;
    });
    return data.sort((a, b) =>
      asc ? a.vencimento.localeCompare(b.vencimento) : b.vencimento.localeCompare(a.vencimento),
    );
  }, [lista.data, tipo, status, busca, conta, de, ate, asc]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const remove = useMutation({
    mutationFn: (id: number) => writeRow("transacoes", "delete", {}, id),
    onSuccess: () => {
      toast.success("Lançamento excluído.");
      FINANCE_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openEdit(id: number) {
    const found = (raw.data ?? []).find((t) => t.id === id) ?? null;
    setEditing(found);
    setDrawerOpen(true);
  }

  function limpar() {
    setTipo("Todos");
    setStatus("Todos");
    setBusca("");
    setDe(firstDayOfMonth());
    setAte(lastDayOfMonth());
    setConta("Todas");
    setPage(1);
  }

  return (
    <div>
      <PageHeader
        title="Lançamentos"
        subtitle={`${rows.length} lançamento(s) no filtro atual`}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDrawerOpen(true);
            }}
          >
            <Plus className="mr-1 size-4" /> Novo Lançamento
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={tipo} onValueChange={(v) => { setTipo(v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os tipos</SelectItem>
            {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os status</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          placeholder="Buscar por nome…"
          value={busca}
          onChange={(e) => { setBusca(e.target.value); setPage(1); }}
          className="w-56"
        />
        <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="w-40" />
        <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="w-40" />
        <Select value={conta} onValueChange={(v) => { setConta(v); setPage(1); }}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas as contas</SelectItem>
            {(contas.data ?? []).map((c) => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={limpar}>Limpar filtros</Button>
      </div>

      <SectionCard>
        {lista.isLoading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : !pageRows.length ? (
          <EmptyState message="Nenhum lançamento encontrado com esses filtros." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left font-medium">
                    <button className="flex items-center gap-1" onClick={() => setAsc((v) => !v)}>
                      Vencimento <ArrowUpDown className="size-3" />
                    </button>
                  </th>
                  <th className="px-3 py-2 text-left font-medium">Nome</th>
                  <th className="px-3 py-2 text-left font-medium">Tipo</th>
                  <th className="px-3 py-2 text-left font-medium">Natureza</th>
                  <th className="px-3 py-2 text-left font-medium">Grupo</th>
                  <th className="px-3 py-2 text-left font-medium">Item</th>
                  <th className="px-3 py-2 text-left font-medium">Conta</th>
                  <th className="px-3 py-2 text-left font-medium">Pessoa</th>
                  <th className="px-3 py-2 text-right font-medium">Valor</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-left font-medium">Temp.</th>
                  <th className="px-3 py-2 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((t, i) => (
                  <tr
                    key={t.id}
                    onClick={() => openEdit(t.id)}
                    className={`cursor-pointer hover:bg-surface-hover ${i % 2 ? "bg-secondary/25" : ""}`}
                  >
                    <td className="px-3 py-2 whitespace-nowrap">{formatDate(t.vencimento)}</td>
                    <td className="px-3 py-2">{t.nome}</td>
                    <td className="px-3 py-2"><TipoBadge tipo={t.tipo} /></td>
                    <td className="px-3 py-2 text-muted-foreground">{t.natureza ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{t.grupo ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{t.item ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{t.conta_origem ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{t.pessoa ?? "—"}</td>
                    <td className="px-3 py-2 text-right">
                      <Money value={t.valor} colored negative={t.tipo === "Despesa"} />
                    </td>
                    <td className="px-3 py-2"><StatusBadge status={t.status} /></td>
                    <td className="px-3 py-2"><Temperatura value={t.temperatura} /></td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button
                        aria-label="Editar"
                        className="mr-2 text-muted-foreground hover:text-primary"
                        onClick={(e) => { e.stopPropagation(); openEdit(t.id); }}
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        aria-label="Excluir"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Excluir "${t.nome}"?`)) remove.mutate(t.id);
                        }}
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
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>Página {currentPage} de {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
              Próxima
            </Button>
          </div>
        </div>
      </SectionCard>

      <TransacaoDrawer open={drawerOpen} onOpenChange={setDrawerOpen} transacao={editing} />
    </div>
  );
}