# Scripts SQL — SetTake

Estes arquivos **não são migrations da Lovable** (ficam fora de `supabase/migrations/` de propósito, para não serem aplicados automaticamente).
Rodar manualmente no **Supabase → SQL Editor**, na ordem abaixo. Cada script roda dentro de uma transação: se falhar, nada muda.

| Ordem | Arquivo | O que faz | Quando rodar |
|---|---|---|---|
| 1 | `fase2/01_recorrentes_alertas_previsao.sql` | Corrige o gerador de recorrências, impede duplicatas, cria contratos com prazo/renovação, alertas no sistema + tarefa no CRM, previsão de caixa real | Agora |
| 2 | `fase3/02_cartao_credito.sql` | Faturas de cartão, compras categorizadas dentro da fatura, pagamento sem dupla contagem | Depois que a Fase 2 estiver validada |

## Verificação rápida após o script 1

```sql
select * from public.gerar_transacoes_recorrentes();   -- gera as ocorrências pendentes
select * from public.previsao_caixa;                    -- previsão por mês
select * from public.alertas_sistema;                   -- alertas do painel
select public.fn_alertar_contratos_vencendo(60);        -- cria tarefas no CRM
```

Rodar `gerar_transacoes_recorrentes()` duas vezes seguidas deve criar 0 na segunda vez.
