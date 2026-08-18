CREATE OR REPLACE VIEW public.transacoes_completas AS
SELECT t.id,
    t.nome,
    t.valor,
    t.tipo,
    t.status,
    t.temperatura,
    n.nome AS natureza,
    g.nome AS grupo,
    i.nome AS item,
    co.nome AS conta_origem,
    cd.nome AS conta_destino,
    p.nome AS pessoa,
    p.tipo AS tipo_pessoa,
    t.vencimento,
    t.criado_em,
    t.atualizado_em,
    t.conciliada
FROM transacoes t
  JOIN natureza n ON n.id = t.natureza_id
  JOIN grupo g ON g.id = t.grupo_id
  JOIN item i ON i.id = t.item_id
  LEFT JOIN contas_bancarias co ON co.id = t.conta_origem_id
  LEFT JOIN contas_bancarias cd ON cd.id = t.conta_destino_id
  LEFT JOIN pessoas p ON p.id = t.pessoa_id;

GRANT SELECT ON public.transacoes_completas TO anon;
GRANT SELECT ON public.transacoes_completas TO authenticated;
GRANT ALL ON public.transacoes_completas TO service_role;