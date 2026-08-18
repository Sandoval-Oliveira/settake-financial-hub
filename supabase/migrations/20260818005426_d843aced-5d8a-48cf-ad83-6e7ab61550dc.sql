DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['contas_bancarias','pessoas','natureza','grupo','item','transacoes'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('DROP POLICY IF EXISTS "acesso_total_%s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "acesso_total_%s" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)', t, t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['contas_bancarias_id_seq','pessoas_id_seq','natureza_id_seq','grupo_id_seq','item_id_seq','transacoes_id_seq'] LOOP
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE public.%I TO anon, authenticated, service_role', t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['transacoes_completas','saldo_contas','ltv_clientes','resumo_mensal','receita_por_servico','calendario'] LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated, service_role', t);
    EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', t);
  END LOOP;
END $$;