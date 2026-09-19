-- APLICADA EM PRODUÇÃO em 2026-09-19 (TESS). Arquivo versionado para histórico do schema.

-- 1. Constraints duplicadas que barravam 'Bimestral' e 'Encerrado'
alter table public.lancamentos_recorrentes
  drop constraint if exists lancamentos_recorrentes_frequencia_check,
  drop constraint if exists lancamentos_recorrentes_status_check,
  drop constraint if exists lancamentos_recorrentes_dia_vencimento_check;

-- 2. Vincular histórico: lista todos os lançamentos soltos do cliente (inclusive anteriores ao contrato)
create or replace view public.recorrentes_candidatos with (security_invoker = true) as
select lr.id as recorrente_id, lr.nome as contrato, t.id as transacao_id, t.nome as lancamento,
       t.vencimento, t.valor, t.status, (t.vencimento < lr.data_inicio) as anterior_ao_contrato
  from public.lancamentos_recorrentes lr
  join public.transacoes t on t.pessoa_id = lr.pessoa_id and t.tipo::text = lr.tipo and t.lancamento_recorrente_id is null
 where lr.pessoa_id is not null
 order by t.vencimento desc;

-- 3. Funções de recorrência: checagem de papel (admin/socio) + gerador não duplica mês que já tem lançamento solto do cliente
--    (definições completas: ver Supabase > Database > Functions)
--    gerar_transacoes_recorrentes(integer), renovar_recorrente(integer,integer,numeric), vincular_transacoes_recorrente(integer,integer[])
--    revoke execute from public, anon; grant execute to authenticated, service_role.

-- 4. Promotores (indicações)
create table if not exists public.crm_promotores (
  id serial primary key, nome text not null, pessoa_id integer references public.pessoas(id) on delete set null,
  whatsapp text, email text, meta_indicacoes integer not null default 0 check (meta_indicacoes >= 0),
  prazo_inicio date not null default current_date, prazo_fim date, ativo boolean not null default true,
  observacoes text, criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now(),
  check (prazo_fim is null or prazo_fim >= prazo_inicio));
alter table public.crm_leads add column if not exists promotor_id integer references public.crm_promotores(id) on delete set null;
alter table public.pessoas   add column if not exists promotor_id integer references public.crm_promotores(id) on delete set null;
-- RLS por papel (select/insert/update: admin,socio,vendedor · delete: admin,socio) e view crm_promotores_resumo
-- (indicacoes, faltam, pct_meta, clientes_convertidos, receita_gerada, receita_prevista, dias_restantes).
