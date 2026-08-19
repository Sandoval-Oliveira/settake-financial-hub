import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  ArrowUpDown,
  CheckSquare2,
  Columns3,
  Copy,
  GripVertical,
  Pencil,
  Square,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  type TransacaoCompleta,
} from "@/lib/finance";
import type { TipoTransacao } from "@/lib/finance";
import { cn } from "@/lib/utils";
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
const PREFS_KEY = "settake:lancamentos:columns";

const COLUMNS = [
  { key: "vencimento", label: "Vencimento", width: 110 },
  { key: "nome", label: "Nome", width: 220 },
  { key: "tipo", label: "Tipo", width: 90 },
  { key: "natureza", label: "Natureza", width: 130 },
  { key: "grupo", label: "Grupo", width: 120 },
  { key: "item", label: "Item", width: 150 },
  { key: "conta", label: "Conta", width: 90 },
  { key: "pessoa", label: "Pessoa", width: 140 },
  { key: "valor", label: "Valor", width: 110 },
  { key: "status", label: "Status", width: 100 },
  { key: "conciliada", label: "Conciliada", width: 90 },
  { key: "temp", label: "Temperatura", width: 100 },
  { key: "acoes", label: "Ações", width: 90 },
] as const;

type ColKey = (typeof COLUMNS)[number]["key"];

const DEFAULT_ORDER = COLUMNS.map((c) => c.key) as ColKey[];
const COL_MAP = Object.fromEntries(COLUMNS.map((c) => [c.key, c])) as Record<
  ColKey,
  (typeof COLUMNS)[number]
>;
const RIGHT_ALIGNED: ColKey[] = ["valor", "acoes"];

function useColumnPrefs() {
  const [order, setOrder] = useState<ColKey[]>(DEFAULT_ORDER);
  const [hidden, setHidden] = useState<ColKey[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { order?: ColKey[]; hidden?: ColKey[] };
      const valid = (parsed.order ?? []).filter((k) => DEFAULT_ORDER.includes(k));
      const merged = [...valid, ...DEFAULT_ORDER.filter((k) => !valid.includes(k))];
      // "acoes" is always last and never hidden
      setOrder([...merged.filter((k) => k !== "acoes"), "acoes"]);
      setHidden((parsed.hidden ?? []).filter((k) => DEFAULT_ORDER.includes(k) && k !== "acoes" && k !== "nome"));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ order, hidden }));
    } catch {
      /* ignore */
    }
  }, [order, hidden]);

  return { order, setOrder, hidden, setHidden };
}

function useColumnWidths() {
  const [widths, setWidths] = useState<Record<string, number>>(() =>
    Object.fromEntries(COLUMNS.map((c) => [c.key, c.width])),
  );
  const drag = useRef<{ key: string; startX: number; startW: number } | null>(null);

  function onMouseDown(key: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    drag.current = { key, startX: e.clientX, startW: widths[key] ?? 100 };
    const move = (ev: MouseEvent) => {
      const d = drag.current;
      if (!d) return;
      const next = Math.max(60, d.startW + (ev.clientX - d.startX));
      setWidths((w) => ({ ...w, [d.key]: next }));
    };
    const up = () => {
      drag.current = null;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  return { widths, onMouseDown };
}

function firstDayOfMonth() {
  const d = new Date();
  return isoDate(new Date(d.getFullYear(), d.getMonth(), 1));
}
function lastDayOfMonth() {
  const d = new Date();
  return isoDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

function ColumnManager({
  order,
  setOrder,
  hidden,
  setHidden,
}: {
  order: ColKey[];
  setOrder: (o: ColKey[]) => void;
  hidden: ColKey[];
  setHidden: (h: ColKey[]) => void;
}) {
  const [dragKey, setDragKey] = useState<ColKey | null>(null);

  function onDrop(target: ColKey) {
    if (!dragKey || dragKey === target || target === "acoes") return;
    const next = order.filter((k) => k !== dragKey);
    const idx = next.indexOf(target);
    next.splice(idx, 0, dragKey);
    setOrder([...next.filter((k) => k !== "acoes"), "acoes"]);
    setDragKey(null);
  }

  return (
    <Popover>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Configurar colunas">
                <Columns3 className="size-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Configurar colunas</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent align="end" className="w-64 border-border bg-card p-3">
        <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">Colunas visíveis</p>
        <div className="max-h-80 space-y-0.5 overflow-y-auto">
          {order.map((key) => {
            const col = COL_MAP[key];
            const locked = key === "acoes";
            const lockedVisibility = locked || key === "nome";
            return (
              <div
                key={key}
                draggable={!locked}
                onDragStart={() => !locked && setDragKey(key)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(key)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-1 py-1.5 text-sm",
                  locked ? "text-muted-foreground" : "hover:bg-secondary/50",
                  dragKey === key && "opacity-50",
                )}
              >
                {locked ? (
                  <span className="size-4" />
                ) : (
                  <GripVertical className="size-4 cursor-grab text-muted-foreground active:cursor-grabbing" />
                )}
                <Checkbox
                  checked={!hidden.includes(key)}
                  disabled={lockedVisibility}
                  onCheckedChange={(v) =>
                    setHidden(v ? hidden.filter((k) => k !== key) : [...hidden, key])
                  }
                />
                <span className="truncate">{col.label}</span>
              </div>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={() => {
            setOrder(DEFAULT_ORDER);
            setHidden([]);
          }}
        >
          Restaurar padrão
        </Button>
      </PopoverContent>
    </Popover>
  );
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
  const [somenteNaoConciliadas, setSomenteNaoConciliadas] = useState(false);
  const [asc, setAsc] = useState(false);
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Transacao | null>(null);
  const [drawerMode, setDrawerMode] = useState<"edit" | "duplicate">("edit");
  const [lockedTipo, setLockedTipo] = useState<TipoTransacao | undefined>(undefined);
  const { widths, onMouseDown } = useColumnWidths();
  const { order, setOrder, hidden, setHidden } = useColumnPrefs();

  const visibleColumns = useMemo(
    () => order.filter((k) => !hidden.includes(k)).map((k) => COL_MAP[k]),
    [order, hidden],
  );

  const rows = useMemo(() => {
    const data = (lista.data ?? []).filter((t) => {
      if (tipo !== "Todos" && t.tipo !== tipo) return false;
      if (status !== "Todos" && t.status !== status) return false;
      if (busca && !t.nome.toLowerCase().includes(busca.toLowerCase())) return false;
      if (conta !== "Todas" && t.conta_origem !== conta) return false;
      if (somenteNaoConciliadas && t.conciliada) return false;
      const v = (t.vencimento ?? "").slice(0, 10);
      if (de && v < de) return false;
      if (ate && v > ate) return false;
      return true;
    });
    return data.sort((a, b) =>
      asc ? a.vencimento.localeCompare(b.vencimento) : b.vencimento.localeCompare(a.vencimento),
    );
  }, [lista.data, tipo, status, busca, conta, somenteNaoConciliadas, de, ate, asc]);

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

  const toggleConciliada = useMutation({
    mutationFn: async ({ id, conciliada }: { id: number; conciliada: boolean }) => {
      await writeRow("transacoes", "update", { conciliada: !conciliada }, id);
    },
    onSuccess: (_, vars) => {
      toast.success(vars.conciliada ? "Lançamento marcado como não conciliado." : "Lançamento conciliado.");
      FINANCE_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openEdit(id: number) {
    const found = (raw.data ?? []).find((t) => t.id === id) ?? null;
    setEditing(found);
    setDrawerMode("edit");
    setLockedTipo(undefined);
    setDrawerOpen(true);
  }

  function openDuplicate(id: number) {
    const found = (raw.data ?? []).find((t) => t.id === id) ?? null;
    setEditing(found);
    setDrawerMode("duplicate");
    setLockedTipo(undefined);
    setDrawerOpen(true);
  }

  function openNovo(tipo: TipoTransacao) {
    setEditing(null);
    setDrawerMode("edit");
    setLockedTipo(tipo);
    setDrawerOpen(true);
  }

  function limpar() {
    setTipo("Todos");
    setStatus("Todos");
    setBusca("");
    setDe(firstDayOfMonth());
    setAte(lastDayOfMonth());
    setConta("Todas");
    setSomenteNaoConciliadas(false);
    setPage(1);
  }

  function renderCell(t: TransacaoCompleta, key: ColKey) {
    switch (key) {
      case "vencimento":
        return <span className="truncate whitespace-nowrap">{formatDate(t.vencimento)}</span>;
      case "nome":
        return <span className="block truncate">{t.nome}</span>;
      case "tipo":
        return <TipoBadge tipo={t.tipo} />;
      case "natureza":
        return <span className="block truncate text-muted-foreground">{t.natureza ?? "—"}</span>;
      case "grupo":
        return <span className="block truncate text-muted-foreground">{t.grupo ?? "—"}</span>;
      case "item":
        return <span className="block truncate text-muted-foreground">{t.item ?? "—"}</span>;
      case "conta":
        return <span className="block truncate text-muted-foreground">{t.conta_origem ?? "—"}</span>;
      case "pessoa":
        return <span className="block truncate text-muted-foreground">{t.pessoa ?? "—"}</span>;
      case "valor":
        return <Money value={t.valor} colored negative={t.tipo === "Despesa"} />;
      case "status":
        return <StatusBadge status={t.status} />;
      case "conciliada":
        return (
          <button
            aria-label={t.conciliada ? "Marcar como não conciliado" : "Marcar como conciliado"}
            className={cn(
              "transition-colors",
              t.conciliada ? "text-success" : "text-muted-foreground hover:text-success",
            )}
            onClick={(e) => {
              e.stopPropagation();
              toggleConciliada.mutate({ id: t.id, conciliada: t.conciliada });
            }}
          >
            {t.conciliada ? <CheckSquare2 className="size-5" /> : <Square className="size-5" />}
          </button>
        );
      case "temp":
        return <Temperatura value={t.temperatura} />;
      case "acoes":
        return (
          <span className="whitespace-nowrap">
            <button
              aria-label="Editar"
              className="mr-2 text-muted-foreground hover:text-primary"
              onClick={(e) => { e.stopPropagation(); openEdit(t.id); }}
            >
              <Pencil className="size-4" />
            </button>
            <button
              aria-label="Duplicar"
              className="mr-2 text-muted-foreground hover:text-primary"
              onClick={(e) => { e.stopPropagation(); openDuplicate(t.id); }}
            >
              <Copy className="size-4" />
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
          </span>
        );
      default:
        return null;
    }
  }

  return (
    <div>
      <PageHeader
        title="Lançamentos"
        subtitle={`${rows.length} lançamento(s) no filtro atual`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => openNovo("Receita")}
              className="bg-success text-[#0F1117] hover:bg-success/90"
            >
              <ArrowUp className="mr-1 size-4" /> Nova Receita
            </Button>
            <Button
              onClick={() => openNovo("Despesa")}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <ArrowDown className="mr-1 size-4" /> Nova Despesa
            </Button>
            <Button onClick={() => openNovo("Transferência")}>
              <ArrowLeftRight className="mr-1 size-4" /> Nova Transferência
            </Button>
          </div>
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

        <button
          type="button"
          aria-pressed={somenteNaoConciliadas}
          onClick={() => { setSomenteNaoConciliadas((v) => !v); setPage(1); }}
          className={cn(
            "flex h-9 items-center gap-2 rounded-full border px-3 text-sm transition-colors",
            somenteNaoConciliadas
              ? "border-primary bg-primary/10 text-primary"
              : "border-[#3A3D50] bg-[#2A2D3E] text-[#8B8FA8] hover:text-foreground",
          )}
        >
          {somenteNaoConciliadas ? <CheckSquare2 className="size-4" /> : <Square className="size-4" />}
          Não conciliadas
        </button>

        <ColumnManager order={order} setOrder={setOrder} hidden={hidden} setHidden={setHidden} />
        <Button variant="outline" onClick={limpar}>Limpar filtros</Button>
      </div>

      <SectionCard>
        {lista.isLoading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : !pageRows.length ? (
          <EmptyState message="Nenhum lançamento encontrado com esses filtros." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                {visibleColumns.map((c) => (
                  <col key={c.key} style={{ width: widths[c.key] }} />
                ))}
              </colgroup>
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  {visibleColumns.map((c) => (
                    <th
                      key={c.key}
                      className={`group relative px-3 py-2 font-medium ${
                        RIGHT_ALIGNED.includes(c.key) ? "text-right" : "text-left"
                      }`}
                    >
                      {c.key === "vencimento" ? (
                        <button className="flex items-center gap-1" onClick={() => setAsc((v) => !v)}>
                          Vencimento <ArrowUpDown className="size-3" />
                        </button>
                      ) : (
                        <span className="block truncate">{c.label}</span>
                      )}
                      <span
                        role="separator"
                        onMouseDown={(e) => onMouseDown(c.key, e)}
                        className="absolute top-0 right-0 h-full w-[2px] cursor-col-resize bg-transparent hover:bg-primary"
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((t, i) => (
                  <tr
                    key={t.id}
                    onClick={() => openEdit(t.id)}
                    className={`cursor-pointer hover:bg-surface-hover ${i % 2 ? "bg-secondary/25" : ""}`}
                  >
                    {visibleColumns.map((c) => (
                      <td
                        key={c.key}
                        className={cn(
                          "px-3 py-2",
                          RIGHT_ALIGNED.includes(c.key) ? "text-right" : undefined,
                        )}
                      >
                        {renderCell(t, c.key)}
                      </td>
                    ))}
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

      <TransacaoDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        transacao={editing}
        mode={drawerMode}
        lockedTipo={lockedTipo}
      />
    </div>
  );
}
