import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  contasQuery,
  saldoCartoesQuery,
  transacoesRawQuery,
  writeRow,
  FINANCE_KEYS,
  RECORRENTE_KEYS,
  type SaldoCartao,
} from "@/lib/finance";
import { formatDate, formatMoney, isoDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmptyState, Money, PageHeader, SectionCard, TableSkeleton } from "@/components/finance/ui-bits";

export const Route = createFileRoute("/cartoes")({
  head: () => ({
    meta: [
      { title: "Cartões — SetTake Finance" },
      { name: "description", content: "Saldo devedor, limite e transações dos cartões de crédito da SetTake." },
      { property: "og:title", content: "Cartões — SetTake Finance" },
      { property: "og:description", content: "Acompanhe faturas, limites e pagamentos dos cartões." },
    ],
  }),
  component: Cartoes,
});

function Cartoes() {
  const queryClient = useQueryClient();
  const cartoes = useQuery(saldoCartoesQuery);
  const contas = useQuery(contasQuery);
  const transacoes = useQuery(transacoesRawQuery);

  const [selecionado, setSelecionado] = useState<number | null>(null);
  const [pagando, setPagando] = useState<SaldoCartao | null>(null);
  const [contaPagamento, setContaPagamento] = useState("");
  const [valorPagamento, setValorPagamento] = useState("");
  const [dataPagamento, setDataPagamento] = useState(isoDate(new Date()));

  const lista = cartoes.data ?? [];
  const atual = lista.find((c) => c.id === selecionado) ?? lista[0] ?? null;

  const contasCorrentes = (contas.data ?? []).filter((c) => (c.tipo ?? "") !== "Cartão de Crédito");

  const mesAtual = new Date();
  const inicioMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
  const fimMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0);

  const movimentos = useMemo(() => {
    if (!atual) return [];
    return (transacoes.data ?? [])
      .filter((t) => {
        const conta = (t as any).conta_origem_id === atual.id || (t as any).conta_destino_id === atual.id;
        if (!conta) return false;
        const venc = new Date(`${String(t.vencimento).slice(0, 10)}T00:00:00`);
        return venc >= inicioMes && venc <= fimMes;
      })
      .sort((a, b) => String(a.vencimento).localeCompare(String(b.vencimento)));
  }, [transacoes.data, atual, inicioMes.getTime(), fimMes.getTime()]);

  const pagar = useMutation({
    mutationFn: async () => {
      if (!pagando) throw new Error("Nenhum cartão selecionado.");
      const valor = Number(valorPagamento.replace(",", "."));
      if (!Number.isFinite(valor) || valor <= 0) throw new Error("Informe um valor válido.");
      if (!contaPagamento) throw new Error("Escolha a conta de pagamento.");

      const base = {
        nome: `Pagamento fatura ${pagando.nome}`,
        valor,
        vencimento: dataPagamento,
        status: "Concluído",
        conciliada: false,
      };

      await writeRow("transacoes", "insert", {
        ...base,
        tipo: "Transferência",
        conta_origem_id: Number(contaPagamento),
        conta_destino_id: pagando.id,
      });
    },
    onSuccess: () => {
      toast.success("Pagamento de fatura registrado.");
      [...FINANCE_KEYS, ...RECORRENTE_KEYS].forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key }),
      );
      setPagando(null);
      setValorPagamento("");
      setContaPagamento("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Cartões de Crédito" subtitle="Faturas, limites e movimentações do mês" />

      {cartoes.isLoading ? (
        <TableSkeleton rows={3} cols={4} />
      ) : !lista.length ? (
        <EmptyState message="Nenhum cartão de crédito cadastrado." />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {lista.map((c) => {
              const limite = Number(c.limite ?? 0);
              const devedor = Number(c.saldo_devedor ?? 0);
              const pct = limite > 0 ? Math.min(100, (devedor / limite) * 100) : 0;
              const ativo = atual?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelecionado(c.id)}
                  className={cn(
                    "rounded-xl border bg-card p-4 text-left transition-colors",
                    ativo ? "border-primary" : "border-border hover:border-primary/50",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <CreditCard className="size-4 text-primary" /> {c.nome}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Fecha dia {c.dia_fechamento ?? "—"} · Vence dia {c.dia_vencimento_fatura ?? "—"}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">Fatura atual</p>
                  <p className="text-2xl font-semibold tabular text-destructive">{formatMoney(devedor)}</p>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Limite {formatMoney(limite)} · Disponível {formatMoney(Math.max(0, limite - devedor))}
                  </p>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPagando(c);
                        setValorPagamento(String(devedor.toFixed(2)));
                      }}
                    >
                      Pagar fatura
                    </Button>
                  </div>
                </button>
              );
            })}
          </div>

          <SectionCard title={atual ? `Transações do mês — ${atual.nome}` : "Transações do mês"}>
            {transacoes.isLoading ? (
              <TableSkeleton rows={6} cols={5} />
            ) : !movimentos.length ? (
              <EmptyState message="Nenhuma transação neste cartão no mês atual." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="px-4 py-2 text-left font-medium">Vencimento</th>
                      <th className="px-4 py-2 text-left font-medium">Nome</th>
                      <th className="px-4 py-2 text-left font-medium">Tipo</th>
                      <th className="px-4 py-2 text-left font-medium">Status</th>
                      <th className="px-4 py-2 text-right font-medium">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimentos.map((t, i) => (
                      <tr key={t.id} className={cn("hover:bg-surface-hover", i % 2 && "bg-secondary/25")}>
                        <td className="px-4 py-2 text-muted-foreground">{formatDate(t.vencimento)}</td>
                        <td className="px-4 py-2">
                          <span className="flex items-center gap-2">
                            {t.nome}
                            {(t as any).lancamento_recorrente_id && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <RefreshCw className="size-3.5 text-primary" />
                                  </TooltipTrigger>
                                  <TooltipContent>Gerado automaticamente</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{t.tipo}</td>
                        <td className="px-4 py-2 text-muted-foreground">{t.status}</td>
                        <td className="px-4 py-2 text-right"><Money value={t.valor} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      <Dialog open={!!pagando} onOpenChange={(o) => !o && setPagando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar fatura {pagando?.nome}</DialogTitle>
            <DialogDescription>
              Registra uma transferência da conta escolhida para o cartão.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Conta de pagamento</Label>
              <Select value={contaPagamento} onValueChange={setContaPagamento}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {contasCorrentes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Valor</Label>
                <Input inputMode="decimal" value={valorPagamento} onChange={(e) => setValorPagamento(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Data</Label>
                <Input type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPagando(null)}>Cancelar</Button>
            <Button onClick={() => pagar.mutate()} disabled={pagar.isPending}>
              {pagar.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Confirmar pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
