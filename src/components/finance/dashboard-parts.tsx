import { useState } from "react";
import { ChevronDown, Pencil, TrendingDown, TrendingUp } from "lucide-react";
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DashboardFinanceiro, MetaFinanceira } from "@/lib/finance";

export const formatBRL = (v: number | null | undefined) =>
  Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatPct = (v: number | null | undefined) =>
  v == null ? "—" : `${v > 0 ? "+" : ""}${Number(v).toFixed(1)}%`;

export const formatK = (v: number) =>
  Math.abs(v) >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : formatBRL(v);

export function TooltipCustom({
  active,
  payload,
  label,
  percent = false,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
  percent?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 text-[13px] shadow-lg">
      <p className="mb-2 text-muted-foreground">{label}</p>
      {payload.map((p, i) => (
        <div key={`${p.name}-${i}`} className="mb-1 flex gap-3">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="ml-auto tabular text-foreground">
            {percent ? `${Number(p.value ?? 0).toFixed(1)}%` : formatBRL(Number(p.value ?? 0))}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ Card ------------------------------ */

export function CardCascata({
  titulo,
  valor,
  varPct,
  participacaoPct,
  despesa = false,
}: {
  titulo: string;
  valor: number;
  varPct: number | null;
  participacaoPct: number | null;
  despesa?: boolean;
}) {
  const valorNegativo = !despesa && valor < 0;
  const up = varPct != null && varPct > 0;
  const down = varPct != null && varPct < 0;
  const bom = despesa ? down : up;
  const ruim = despesa ? up : down;
  const varColor = varPct == null || varPct === 0 ? "#8B8FA8" : bom ? "#22C55E" : ruim ? "#EF4444" : "#8B8FA8";

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs text-muted-foreground">{titulo}</p>
      <p
        className="mt-2 text-2xl font-semibold tabular"
        style={{ color: valorNegativo ? "#EF4444" : "#F0F2F8" }}
      >
        {formatBRL(valor)}
      </p>
      <div className="mt-3 flex items-center gap-1.5 text-xs tabular" style={{ color: varColor }}>
        {up && <TrendingUp className="size-3.5" />}
        {down && <TrendingDown className="size-3.5" />}
        <span>{formatPct(varPct)}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground tabular">
        {participacaoPct == null ? "vs mês anterior" : `${Number(participacaoPct).toFixed(1)}% do fat.`}
      </p>
    </div>
  );
}

/* ------------------------------ Gauge ----------------------------- */

function gaugeColor(pct: number, teto: boolean) {
  if (teto) {
    if (pct > 100) return "#EF4444";
    if (pct >= 80) return "#F5820A";
    return "#22C55E";
  }
  if (pct < 50) return "#EF4444";
  if (pct < 80) return "#F5820A";
  return "#E8B800";
}

export function Gauge({
  titulo,
  atual,
  meta,
  teto = false,
  onClick,
}: {
  titulo: string;
  atual: number;
  meta: number;
  teto?: boolean;
  onClick?: () => void;
}) {
  const pct = meta > 0 ? (atual / meta) * 100 : 0;
  const color = gaugeColor(pct, teto);
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/50"
    >
      <p className="text-xs text-muted-foreground">{titulo}</p>
      <div className="mx-auto h-[110px] w-full max-w-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius={50}
            outerRadius={70}
            startAngle={180}
            endAngle={0}
            barSize={20}
            data={[{ value: Math.min(Math.max(pct, 0), 100), fill: color }]}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "#2A2D3E" }} angleAxisId={0} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <p className="-mt-6 text-center text-xl font-semibold tabular" style={{ color }}>
        {pct.toFixed(0)}%
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground tabular">
        {formatBRL(atual)} / {formatBRL(meta)}
      </p>
    </button>
  );
}

/* --------------------------- Metas dialog -------------------------- */

export function MetasDialog({
  open,
  onOpenChange,
  meta,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  meta: MetaFinanceira | null;
  onSave: (values: { meta_faturamento: number; meta_despesas: number; meta_lucro: number }) => void;
  saving?: boolean;
}) {
  const [fat, setFat] = useState("");
  const [desp, setDesp] = useState("");
  const [lucro, setLucro] = useState("");

  // sync when dialog opens
  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setFat(String(meta?.meta_faturamento ?? ""));
      setDesp(String(meta?.meta_despesas ?? ""));
      setLucro(String(meta?.meta_lucro ?? ""));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Definir metas do mês</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="meta-fat">Meta Faturamento</Label>
            <Input id="meta-fat" type="number" step="0.01" value={fat} onChange={(e) => setFat(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="meta-desp">Meta Despesas</Label>
            <Input id="meta-desp" type="number" step="0.01" value={desp} onChange={(e) => setDesp(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="meta-lucro">Meta Lucro</Label>
            <Input id="meta-lucro" type="number" step="0.01" value={lucro} onChange={(e) => setLucro(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={saving}
            onClick={() =>
              onSave({
                meta_faturamento: Number(fat) || 0,
                meta_despesas: Number(desp) || 0,
                meta_lucro: Number(lucro) || 0,
              })
            }
          >
            Salvar metas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BotaoEditarMetas({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      <Pencil className="size-3.5" /> Editar metas
    </Button>
  );
}

/* --------------------------- Cascata table -------------------------- */

function Valor({ v, negativo = false }: { v: number; negativo?: boolean }) {
  const isNeg = negativo || v < 0;
  const abs = Math.abs(v);
  return (
    <span className="tabular" style={{ color: isNeg ? "#EF4444" : "#F0F2F8" }}>
      {isNeg ? `(${formatBRL(abs)})` : formatBRL(abs)}
    </span>
  );
}

function Linha({
  label,
  valor,
  pct,
  varPct,
  sub = false,
  resultado = false,
  negativo = false,
}: {
  label: string;
  valor: number;
  pct?: number | null;
  varPct?: number | null;
  sub?: boolean;
  resultado?: boolean;
  negativo?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 py-1.5",
        sub && "pl-6 text-[13px] text-muted-foreground",
        resultado && "mt-1 border-t border-border pt-2 font-semibold",
      )}
    >
      <span className="flex-1 text-sm">{label}</span>
      <span className="w-32 text-right text-sm">
        <Valor v={valor} negativo={negativo} />
      </span>
      <span className="w-16 text-right text-xs text-muted-foreground tabular">
        {pct == null ? "" : `${Number(pct).toFixed(1)}%`}
      </span>
      <span
        className="w-20 text-right text-xs tabular"
        style={{ color: varPct == null ? "#8B8FA8" : varPct >= 0 ? "#22C55E" : "#EF4444" }}
      >
        {varPct === undefined ? "" : formatPct(varPct)}
      </span>
    </div>
  );
}

export function CascataDetalhada({ d }: { d: DashboardFinanceiro }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-5 py-4 text-left"
      >
        <ChevronDown className={cn("size-4 transition-transform", !open && "-rotate-90")} />
        <h2 className="text-sm font-semibold">Demonstrativo Detalhado — {d.periodo_curto}</h2>
      </button>
      {open && (
        <div className="px-5 pb-5">
          <Linha label="Faturamento Bruto" valor={d.faturamento_bruto} pct={100} varPct={d.fat_bruto_var_pct} />
          <Linha label="└ Receita de Vendas" valor={d.receita_vendas} sub />
          <Linha label="└ Receita Financeira" valor={d.receita_financeira} sub />
          <Linha label="(−) Custos e Deduções" valor={d.custos_deducoes} pct={d.custos_deducoes_pct} negativo />
          <Linha label="= Lucro Bruto" valor={d.lucro_bruto} pct={d.lucro_bruto_pct} varPct={d.lucro_bruto_var_pct} resultado />

          <Linha label="(−) Despesas Variáveis" valor={d.despesas_variaveis} pct={d.despesas_variaveis_pct} negativo />
          <Linha label="└ Mobilidade" valor={d.desp_var_mobilidade} sub negativo />
          <Linha label="└ Estrutura" valor={d.desp_var_estrutura} sub negativo />
          <Linha label="└ Comercial" valor={d.desp_var_comercial} sub negativo />
          <Linha label="= Margem de Contribuição" valor={d.margem_contribuicao} pct={d.margem_contribuicao_pct} varPct={d.margem_var_pct} resultado />

          <Linha label="(−) Despesas Fixas" valor={d.despesas_fixas} pct={d.despesas_fixas_pct} negativo />
          <Linha label="= EBITDA" valor={d.ebitda} pct={d.ebitda_pct} varPct={d.ebitda_var_pct} resultado />

          <Linha label="(−) Desp. Não Operacionais" valor={d.despesas_nao_operacionais} pct={d.despesas_nao_op_pct} negativo />
          <Linha label="└ CAPEX" valor={d.desp_capex} sub negativo />
          <Linha label="└ Crescimento" valor={d.desp_crescimento} sub negativo />
          <Linha label="= Geração de Caixa" valor={d.resultado_antes_socios} pct={d.geracao_caixa_pct} varPct={d.geracao_caixa_var_pct} resultado />

          <Linha label="(−) Sócios" valor={d.socios} pct={d.socios_pct} negativo />
          <Linha label="= Lucro Líquido" valor={d.lucro_liquido} pct={d.lucro_liquido_pct} varPct={d.lucro_liquido_var_pct} resultado />
        </div>
      )}
    </section>
  );
}
