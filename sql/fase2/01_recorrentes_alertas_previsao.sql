-- =====================================================================
-- FASE 2 · Recorrências sólidas + alertas + previsão de caixa
-- Seguro: idempotente, roda em transação, não apaga dado nenhum.
-- =====================================================================
begin;

-- ---------------------------------------------------------------------
-- 1. Colunas de controle
-- ---------------------------------------------------------------------
alter table public.lancamentos_recorrentes
  add column if not exists total_ocorrencias int,
  add column if not exists renovado_de_id    int references public.lancamentos_recorrentes(id),
  add column if not exists valor_estimado    boolean not null default false;

comment on column public.lancamentos_recorrentes.total_ocorrencias is
  'Quantidade total de lançamentos a gerar (inclui o primeiro). Null = usa data_fim.';
comment on column public.lancamentos_recorrentes.renovado_de_id is
  'Contrato anterior, quando este é uma renovação. Preserva o histórico.';
comment on column public.lancamentos_recorrentes.valor_estimado is
  'true = valor é previsão (ex.: energia). As ocorrências nascem marcadas para confirmação.';

alter table public.transacoes
  add column if not exists competencia    date,
  add column if not exists valor_estimado boolean not null default false;

comment on column public.transacoes.competencia is
  'Mês de referência da ocorrência. É a identidade do lançamento na recorrência: mudar o vencimento NÃO faz o gerador recriar a ocorrência.';
comment on column public.transacoes.valor_estimado is
  'true = valor ainda é estimativa (conta não chegou). Confirmar troca para false.';

update public.transacoes
   set competencia = date_trunc('month', vencimento)::date
 where competencia is null;

create or replace function public.fn_set_competencia()
returns trigger language plpgsql as $$
begin
  if new.competencia is null then
    new.competencia := date_trunc('month', new.vencimento)::date;
  end if;
  return new;
end $$;

drop trigger if exists trg_transacoes_competencia on public.transacoes;
create trigger trg_transacoes_competencia
  before insert or update on public.transacoes
  for each row execute function public.fn_set_competencia();

-- Marcar categorias como inativas em vez de excluir (histórico preservado)
alter table public.natureza add column if not exists ativo boolean not null default true;
alter table public.grupo    add column if not exists ativo boolean not null default true;
alter table public.item     add column if not exists ativo boolean not null default true;

-- ---------------------------------------------------------------------
-- 2. Regras de integridade
-- ---------------------------------------------------------------------
do $$
begin
  alter table public.lancamentos_recorrentes drop constraint if exists ck_lr_tipo;
  alter table public.lancamentos_recorrentes drop constraint if exists ck_lr_freq;
  alter table public.lancamentos_recorrentes drop constraint if exists ck_lr_status;
  alter table public.lancamentos_recorrentes drop constraint if exists ck_lr_dia;
  alter table public.lancamentos_recorrentes drop constraint if exists ck_lr_hier;
  alter table public.lancamentos_recorrentes drop constraint if exists ck_lr_fim;
  alter table public.lancamentos_recorrentes drop constraint if exists ck_lr_prazo;

  alter table public.lancamentos_recorrentes
    add constraint ck_lr_tipo   check (tipo in ('Receita','Despesa')),
    add constraint ck_lr_freq   check (frequencia in ('Mensal','Bimestral','Trimestral','Semestral','Anual')),
    add constraint ck_lr_status check (status in ('Ativo','Pausado','Encerrado')),
    add constraint ck_lr_dia    check (dia_vencimento between 1 and 31),
    add constraint ck_lr_hier   check (natureza_id is not null and grupo_id is not null and item_id is not null),
    add constraint ck_lr_fim    check (data_fim is null or data_fim >= data_inicio),
    add constraint ck_lr_prazo  check (data_fim is not null or total_ocorrencias is not null);
end $$;

-- Uma ocorrência por competência: trava definitiva contra duplicata
create unique index if not exists ux_transacoes_recorrente_competencia
  on public.transacoes (lancamento_recorrente_id, competencia)
  where lancamento_recorrente_id is not null;

create index if not exists ix_transacoes_lancamento_recorrente on public.transacoes (lancamento_recorrente_id);
create index if not exists ix_transacoes_vencimento_status     on public.transacoes (vencimento, status);
create index if not exists ix_transacoes_pessoa                on public.transacoes (pessoa_id);
create index if not exists ix_lr_status_fim                    on public.lancamentos_recorrentes (status, data_fim);

-- ---------------------------------------------------------------------
-- 3. Gerador de ocorrências (substitui a função quebrada)
-- ---------------------------------------------------------------------
drop function if exists public.gerar_transacoes_recorrentes();
drop function if exists public.gerar_transacoes_recorrentes(int);

create or replace function public.gerar_transacoes_recorrentes(p_id int default null)
returns table (recorrente_id int, nome text, criadas int)
language plpgsql security definer set search_path = public as $$
declare
  r          record;
  v_step     int;
  v_status   status_transacao;
  v_comp     date;
  v_lim      date;
  v_horiz    date;
  v_venc     date;
  v_dia      int;
  v_n        int;
begin
  -- contratos vencidos deixam de gerar (não apaga histórico)
  update lancamentos_recorrentes
     set status = 'Encerrado', atualizado_em = now()
   where status = 'Ativo' and data_fim is not null and data_fim < current_date;

  for r in select * from lancamentos_recorrentes
            where status = 'Ativo' and (p_id is null or id = p_id)
            order by id loop

    v_step := case r.frequencia when 'Mensal' then 1 when 'Bimestral' then 2
                                when 'Trimestral' then 3 when 'Semestral' then 6
                                when 'Anual' then 12 else 1 end;
    v_status := case r.tipo when 'Receita' then 'A Receber'::status_transacao
                            else 'A Pagar'::status_transacao end;

    v_horiz := (date_trunc('month', current_date) + (coalesce(r.meses_antecedencia,3) || ' months')::interval)::date;
    v_lim   := least(coalesce(r.data_fim, v_horiz), v_horiz);

    if r.total_ocorrencias is not null then
      v_lim := least(v_lim,
        (date_trunc('month', r.data_inicio) + ((r.total_ocorrencias - 1) * v_step || ' months')::interval)::date);
    end if;

    v_n := 0;
    v_comp := date_trunc('month', r.data_inicio)::date;

    while v_comp <= v_lim loop
      -- dia 31 em mês curto cai no último dia do mês
      v_dia  := least(r.dia_vencimento,
                      extract(day from (date_trunc('month', v_comp) + interval '1 month - 1 day'))::int);
      v_venc := (v_comp + ((v_dia - 1) || ' days')::interval)::date;

      if not exists (select 1 from transacoes
                      where lancamento_recorrente_id = r.id and competencia = v_comp) then
        insert into transacoes (nome, valor, tipo, status, natureza_id, grupo_id, item_id,
                                conta_origem_id, pessoa_id, vencimento, competencia,
                                lancamento_recorrente_id, valor_estimado)
        values (r.nome, r.valor, r.tipo::tipo_transacao, v_status,
                r.natureza_id, r.grupo_id, r.item_id,
                r.conta_origem_id, r.pessoa_id, v_venc, v_comp, r.id, r.valor_estimado);
        v_n := v_n + 1;
      end if;

      v_comp := (v_comp + (v_step || ' months')::interval)::date;
    end loop;

    update lancamentos_recorrentes set ultima_geracao = now() where id = r.id;

    recorrente_id := r.id; nome := r.nome; criadas := v_n;
    return next;
  end loop;
end $$;

comment on function public.gerar_transacoes_recorrentes(int) is
  'Gera as ocorrências que faltam (Receita => A Receber, Despesa => A Pagar). Idempotente: nunca duplica, nunca reescreve valor/data alterados à mão, nunca toca em ocorrência concluída.';
revoke execute on function public.gerar_transacoes_recorrentes(int) from public, anon;
grant  execute on function public.gerar_transacoes_recorrentes(int) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- 4. Vincular lançamentos já existentes a um contrato (ex.: Amare)
-- ---------------------------------------------------------------------
create or replace function public.vincular_transacoes_recorrente(p_recorrente_id int, p_transacao_ids int[])
returns int language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  update transacoes t
     set lancamento_recorrente_id = p_recorrente_id,
         competencia = coalesce(t.competencia, date_trunc('month', t.vencimento)::date)
   where t.id = any(p_transacao_ids)
     and t.lancamento_recorrente_id is null;
  get diagnostics v_n = row_count;
  return v_n;
end $$;

comment on function public.vincular_transacoes_recorrente(int, int[]) is
  'Liga cobranças já lançadas ao contrato, preservando valor, data e status. Use antes de gerar, para o passado não ser recriado.';
revoke execute on function public.vincular_transacoes_recorrente(int, int[]) from public, anon;
grant  execute on function public.vincular_transacoes_recorrente(int, int[]) to authenticated, service_role;

-- Sugestão de candidatos para vincular (o usuário confirma na tela)
create or replace view public.recorrentes_candidatos with (security_invoker = true) as
select lr.id      as recorrente_id,
       lr.nome    as contrato,
       t.id       as transacao_id,
       t.nome     as lancamento,
       t.vencimento, t.valor, t.status
  from lancamentos_recorrentes lr
  join transacoes t
    on t.pessoa_id = lr.pessoa_id
   and t.tipo::text = lr.tipo
   and t.lancamento_recorrente_id is null
   and t.vencimento >= lr.data_inicio
 where lr.pessoa_id is not null;

-- ---------------------------------------------------------------------
-- 5. Renovação de contrato (6 ou 12 meses) — sempre manual
-- ---------------------------------------------------------------------
create or replace function public.renovar_recorrente(p_id int, p_meses int default 12, p_novo_valor numeric default null)
returns int language plpgsql security definer set search_path = public as $$
declare v_old lancamentos_recorrentes; v_new_id int; v_inicio date;
begin
  select * into v_old from lancamentos_recorrentes where id = p_id;
  if not found then raise exception 'Contrato % não encontrado', p_id; end if;

  v_inicio := (coalesce(v_old.data_fim, current_date) + interval '1 day')::date;

  insert into lancamentos_recorrentes
    (nome, tipo, natureza_id, grupo_id, item_id, pessoa_id, conta_origem_id, valor,
     dia_vencimento, frequencia, data_inicio, data_fim, status, meses_antecedencia,
     valor_estimado, renovado_de_id, observacoes)
  values
    (v_old.nome, v_old.tipo, v_old.natureza_id, v_old.grupo_id, v_old.item_id, v_old.pessoa_id,
     v_old.conta_origem_id, coalesce(p_novo_valor, v_old.valor), v_old.dia_vencimento, v_old.frequencia,
     v_inicio, (v_inicio + (p_meses || ' months')::interval - interval '1 day')::date,
     'Ativo', v_old.meses_antecedencia, v_old.valor_estimado, v_old.id,
     'Renovação do contrato #' || v_old.id)
  returning id into v_new_id;

  update lancamentos_recorrentes set status = 'Encerrado', atualizado_em = now() where id = p_id;
  return v_new_id;
end $$;
revoke execute on function public.renovar_recorrente(int, int, numeric) from public, anon;
grant  execute on function public.renovar_recorrente(int, int, numeric) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- 6. Alertas no sistema (painel do ERP)
-- ---------------------------------------------------------------------
create or replace view public.alertas_sistema with (security_invoker = true) as
select 'contrato_vencendo'::text as tipo,
       'Contrato de ' || coalesce(p.nome, lr.nome) || ' termina em ' || to_char(lr.data_fim,'DD/MM/YYYY') as mensagem,
       case when lr.data_fim - current_date <= 30 then 'Alta' else 'Média' end as severidade,
       lr.data_fim as referencia, lr.id as origem_id, p.id as pessoa_id
  from lancamentos_recorrentes lr
  left join pessoas p on p.id = lr.pessoa_id
 where lr.status = 'Ativo' and lr.tipo = 'Receita'
   and lr.data_fim between current_date and current_date + 60
union all
select 'contrato_encerrado',
       'Contrato de ' || coalesce(p.nome, lr.nome) || ' encerrou sem renovação',
       'Alta', lr.data_fim, lr.id, p.id
  from lancamentos_recorrentes lr
  left join pessoas p on p.id = lr.pessoa_id
 where lr.status = 'Encerrado' and lr.tipo = 'Receita'
   and lr.data_fim between current_date - 60 and current_date
   and not exists (select 1 from lancamentos_recorrentes n where n.renovado_de_id = lr.id)
union all
select 'valor_a_confirmar',
       'Confirmar valor de ' || t.nome || ' (' || to_char(t.vencimento,'DD/MM') || ')',
       'Média', t.vencimento, t.id, t.pessoa_id
  from transacoes t
 where t.valor_estimado and t.status <> 'Concluído'
   and t.vencimento <= current_date + 15
union all
select 'atrasado',
       t.nome || ' está vencido desde ' || to_char(t.vencimento,'DD/MM'),
       'Alta', t.vencimento, t.id, t.pessoa_id
  from transacoes t
 where t.status <> 'Concluído' and t.vencimento < current_date;

grant select on public.alertas_sistema to authenticated;

-- ---------------------------------------------------------------------
-- 7. Tarefa no CRM quando a recorrência exige ação comercial
-- ---------------------------------------------------------------------
create or replace function public.fn_alertar_contratos_vencendo(p_dias int default 60)
returns int language plpgsql security definer set search_path = public as $$
declare a record; v_titulo text; v_n int := 0;
begin
  for a in select * from alertas_sistema
            where tipo in ('contrato_vencendo','contrato_encerrado')
              and referencia <= current_date + p_dias loop

    v_titulo := case a.tipo when 'contrato_vencendo' then 'Renovar contrato: ' else 'Recuperar recorrência: ' end
                || coalesce((select nome from pessoas where id = a.pessoa_id), 'cliente');

    if not exists (select 1 from crm_tarefas
                    where titulo = v_titulo and status in ('Pendente','Em Andamento')) then
      insert into crm_tarefas (titulo, descricao, prioridade, status, prazo, pessoa_id)
      values (v_titulo, a.mensagem,
              case a.severidade when 'Alta' then 'Alta'::crm_prioridade_tarefa else 'Média'::crm_prioridade_tarefa end,
              'Pendente', a.referencia::timestamptz, a.pessoa_id);
      v_n := v_n + 1;
    end if;
  end loop;
  return v_n;
end $$;

comment on function public.fn_alertar_contratos_vencendo(int) is
  'Cria tarefas no CRM para contratos vencendo ou encerrados sem renovação. Idempotente: não duplica tarefa pendente.';
revoke execute on function public.fn_alertar_contratos_vencendo(int) from public, anon;
grant  execute on function public.fn_alertar_contratos_vencendo(int) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- 8. Previsão de caixa real (substitui forecast_recorrentes)
-- ---------------------------------------------------------------------
drop view if exists public.forecast_recorrentes;

create or replace view public.previsao_caixa with (security_invoker = true) as
with meses as (
  select date_trunc('month', d)::date as mes
    from generate_series(date_trunc('month', current_date) - interval '2 months',
                         date_trunc('month', current_date) + interval '5 months',
                         interval '1 month') d
)
select to_char(m.mes,'YYYY-MM') as periodo,
       to_char(m.mes,'MM/YY')   as periodo_curto,
       coalesce(sum(t.valor) filter (where t.tipo = 'Receita' and t.status = 'Concluído'), 0) as recebido,
       coalesce(sum(t.valor) filter (where t.tipo = 'Despesa' and t.status = 'Concluído'), 0) as pago,
       coalesce(sum(t.valor) filter (where t.tipo = 'Receita' and t.status <> 'Concluído'), 0) as a_receber,
       coalesce(sum(t.valor) filter (where t.tipo = 'Despesa' and t.status <> 'Concluído'), 0) as a_pagar,
       coalesce(sum(t.valor) filter (where t.tipo = 'Receita'), 0)
         - coalesce(sum(t.valor) filter (where t.tipo = 'Despesa'), 0) as saldo_previsto,
       coalesce(sum(t.valor) filter (where t.tipo <> 'Transferência' and t.valor_estimado and t.status <> 'Concluído'), 0) as valor_estimado_pendente
  from meses m
  left join transacoes t
    on date_trunc('month', t.vencimento)::date = m.mes
   and t.tipo <> 'Transferência'
 group by m.mes
 order by m.mes;

comment on view public.previsao_caixa is
  'Realizado, a receber, a pagar e saldo previsto por mês, calculado sobre os vencimentos reais das transações — reflete reagendamento e alteração de valor. Transferências (incl. pagamento de fatura) são excluídas para não duplicar.';
grant select on public.previsao_caixa to authenticated;

-- ---------------------------------------------------------------------
-- 9. Correções de segurança pendentes da Fase 1
-- ---------------------------------------------------------------------
alter view public.mrr_ativo               set (security_invoker = true);
alter view public.custo_fixo_comprometido set (security_invoker = true);
alter view public.saldo_cartoes           set (security_invoker = true);

revoke all on public.calendario             from anon;
revoke all on public.crm_interacoes         from anon;
revoke all on public.crm_metricas_conversao from anon;
revoke all on public.saldo_cartoes          from anon;
revoke all on public.mrr_ativo              from anon;
revoke all on public.custo_fixo_comprometido from anon;
revoke all on public.recorrentes_candidatos from anon;
revoke all on public.alertas_sistema        from anon;
revoke all on public.previsao_caixa         from anon;

commit;

-- =====================================================================
-- VERIFICAÇÃO
-- =====================================================================
-- select * from public.gerar_transacoes_recorrentes();  -- rodar 2x: 2ª deve dar 0
-- select * from public.previsao_caixa;
-- select * from public.alertas_sistema order by severidade, referencia;
-- select public.fn_alertar_contratos_vencendo(60);
