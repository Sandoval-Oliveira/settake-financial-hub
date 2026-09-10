-- =====================================================================
-- FASE 3 · Cartão de crédito com granularidade (Asaas, 1 cartão)
-- Princípio: a COMPRA carrega a categoria; o PAGAMENTO da fatura é
-- Transferência (conta -> cartão). Assim a despesa nunca conta 2x.
-- Rodar SOMENTE depois da Fase 2 validada.
-- =====================================================================
begin;

-- 1. Faturas
create table if not exists public.cartao_faturas (
  id                     serial primary key,
  conta_id               int  not null references public.contas_bancarias(id),
  competencia            date not null,
  fechamento             date not null,
  vencimento             date not null,
  status                 text not null default 'Aberta' check (status in ('Aberta','Fechada','Paga')),
  transacao_pagamento_id int  references public.transacoes(id),
  criado_em              timestamptz not null default now(),
  unique (conta_id, competencia)
);
comment on table public.cartao_faturas is 'Ciclo de fatura por cartão. O pagamento é uma Transferência conta->cartão, nunca uma Despesa.';

alter table public.transacoes add column if not exists fatura_id int references public.cartao_faturas(id);
alter table public.transacoes add column if not exists parcela_num   int;
alter table public.transacoes add column if not exists parcela_total int;
comment on column public.transacoes.fatura_id is 'Compra pertencente a uma fatura de cartão.';
comment on column public.transacoes.parcela_num is 'Reservado para parcelamento (não usado ainda).';

create index if not exists ix_transacoes_fatura on public.transacoes (fatura_id);

-- 2. Fatura correspondente a uma compra (cria se necessário)
create or replace function public.fn_fatura_da_compra(p_conta_id int, p_data date)
returns int language plpgsql security definer set search_path = public as $$
declare c contas_bancarias; v_comp date; v_fech date; v_venc date; v_id int;
begin
  select * into c from contas_bancarias where id = p_conta_id;
  if not found or c.tipo <> 'Cartão de Crédito' then return null; end if;

  -- compra após o fechamento entra na fatura do mês seguinte
  v_comp := date_trunc('month', p_data)::date;
  if c.dia_fechamento is not null and extract(day from p_data) > c.dia_fechamento then
    v_comp := (v_comp + interval '1 month')::date;
  end if;

  v_fech := (v_comp + (least(coalesce(c.dia_fechamento, 28),
              extract(day from (v_comp + interval '1 month - 1 day'))::int) - 1) * interval '1 day')::date;
  v_venc := (v_comp + (least(coalesce(c.dia_vencimento_fatura, 10),
              extract(day from (v_comp + interval '1 month - 1 day'))::int) - 1) * interval '1 day')::date;
  if v_venc < v_fech then v_venc := (v_venc + interval '1 month')::date; end if;

  select id into v_id from cartao_faturas where conta_id = p_conta_id and competencia = v_comp;
  if v_id is null then
    insert into cartao_faturas (conta_id, competencia, fechamento, vencimento)
    values (p_conta_id, v_comp, v_fech, v_venc) returning id into v_id;
  end if;
  return v_id;
end $$;
revoke execute on function public.fn_fatura_da_compra(int, date) from public, anon;
grant  execute on function public.fn_fatura_da_compra(int, date) to authenticated, service_role;

-- 3. Toda despesa lançada no cartão cai automaticamente na fatura certa
create or replace function public.fn_transacao_cartao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.tipo = 'Despesa' and new.conta_origem_id is not null and new.fatura_id is null then
    new.fatura_id := fn_fatura_da_compra(new.conta_origem_id, new.vencimento);
  end if;
  return new;
end $$;

drop trigger if exists trg_transacoes_cartao on public.transacoes;
create trigger trg_transacoes_cartao
  before insert or update of conta_origem_id, vencimento on public.transacoes
  for each row execute function public.fn_transacao_cartao();

-- 4. Registrar o pagamento da fatura (Transferência, não Despesa)
create or replace function public.pagar_fatura(p_fatura_id int, p_conta_pagadora_id int, p_data date default current_date)
returns int language plpgsql security definer set search_path = public as $$
declare f cartao_faturas; v_total numeric; v_tid int; v_nat int; v_gru int; v_item int;
begin
  select * into f from cartao_faturas where id = p_fatura_id;
  if not found then raise exception 'Fatura % não encontrada', p_fatura_id; end if;
  if f.status = 'Paga' then raise exception 'Fatura % já está paga', p_fatura_id; end if;

  select coalesce(sum(valor),0) into v_total from transacoes where fatura_id = p_fatura_id and tipo = 'Despesa';
  if v_total <= 0 then raise exception 'Fatura % não tem compras lançadas', p_fatura_id; end if;

  select natureza_id, grupo_id, item_id into v_nat, v_gru, v_item
    from transacoes where fatura_id = p_fatura_id order by id limit 1;

  insert into transacoes (nome, valor, tipo, status, natureza_id, grupo_id, item_id,
                          conta_origem_id, conta_destino_id, vencimento, competencia)
  values ('Pagamento fatura ' || to_char(f.competencia,'MM/YYYY'), v_total,
          'Transferência'::tipo_transacao, 'Concluído'::status_transacao,
          v_nat, v_gru, v_item, p_conta_pagadora_id, f.conta_id, p_data, f.competencia)
  returning id into v_tid;

  update cartao_faturas set status = 'Paga', transacao_pagamento_id = v_tid where id = p_fatura_id;
  return v_tid;
end $$;
revoke execute on function public.pagar_fatura(int, int, date) from public, anon;
grant  execute on function public.pagar_fatura(int, int, date) to authenticated, service_role;

-- 5. Visões
create or replace view public.cartao_faturas_resumo with (security_invoker = true) as
select f.id, c.nome as cartao, f.competencia, f.fechamento, f.vencimento, f.status,
       coalesce(sum(t.valor),0) as total,
       count(t.id)              as qtd_compras,
       c.limite,
       c.limite - coalesce(sum(t.valor) filter (where f.status <> 'Paga'),0) as limite_disponivel
  from cartao_faturas f
  join contas_bancarias c on c.id = f.conta_id
  left join transacoes t on t.fatura_id = f.id and t.tipo = 'Despesa'
 group by f.id, c.nome, f.competencia, f.fechamento, f.vencimento, f.status, c.limite;

create or replace view public.cartao_gastos_categoria with (security_invoker = true) as
select to_char(f.competencia,'YYYY-MM') as periodo, c.nome as cartao,
       n.nome as natureza, g.nome as grupo, i.nome as item,
       count(t.id) as qtd, sum(t.valor) as total
  from transacoes t
  join cartao_faturas f on f.id = t.fatura_id
  join contas_bancarias c on c.id = f.conta_id
  join natureza n on n.id = t.natureza_id
  join grupo    g on g.id = t.grupo_id
  join item     i on i.id = t.item_id
 where t.tipo = 'Despesa'
 group by f.competencia, c.nome, n.nome, g.nome, i.nome;

grant select on public.cartao_faturas_resumo, public.cartao_gastos_categoria to authenticated;
revoke all   on public.cartao_faturas_resumo, public.cartao_gastos_categoria from anon;

-- 6. Segurança
alter table public.cartao_faturas enable row level security;
drop policy if exists cartao_faturas_select on public.cartao_faturas;
drop policy if exists cartao_faturas_write  on public.cartao_faturas;
create policy cartao_faturas_select on public.cartao_faturas for select to authenticated
  using (public.tem_papel('admin','socio'));
create policy cartao_faturas_write on public.cartao_faturas for all to authenticated
  using (public.tem_papel('admin','socio')) with check (public.tem_papel('admin','socio'));
revoke all on public.cartao_faturas from anon;

commit;

-- =====================================================================
-- CORTE HISTÓRICO
-- Lançamentos antigos de 'pagamento de fatura' como Despesa ficam como estão.
-- A partir daqui: compras categorizadas + pagar_fatura(). Não relançar
-- os dois formatos no mesmo mês, senão a despesa conta duas vezes.
-- =====================================================================
