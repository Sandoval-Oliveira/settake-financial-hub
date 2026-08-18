ALTER VIEW public.transacoes_completas SET (security_invoker = true);
GRANT SELECT ON public.transacoes_completas TO anon, authenticated;