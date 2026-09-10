# Prompt para a Lovable — ligar a tela Recorrentes

Cole isto na Lovable do **ERP (settake-financial-hub)**. É um ajuste pequeno e barato:
os arquivos novos já estão no repositório, falta apenas registrar a rota no menu.

---

Os arquivos `src/lib/recorrentes.ts` e `src/routes/recorrentes.tsx` já existem no projeto.
Faça apenas o seguinte, sem reescrever esses dois arquivos:

1. Regenere o `src/routeTree.gen.ts` para incluir a rota `/recorrentes` (mesmo padrão das rotas existentes como `/cadastros`).
2. Em `src/components/finance/app-shell.tsx`, adicione um item no array `NAV`, entre "Calendário" e "Relatórios":
   `{ to: "/recorrentes", label: "Recorrentes", icon: Repeat }`
   Importe `Repeat` de `lucide-react`.
3. Se houver proteção de rota por papel, `/recorrentes` deve seguir a mesma regra de `/lancamentos` (admin e socio; vendedor não acessa).
4. Verifique se `src/components/ui/checkbox.tsx` existe (é usado pela nova tela). Se não existir, adicione o componente checkbox do shadcn.
5. Não altere `src/lib/finance.ts`, `src/routes/lancamentos.tsx` nem nenhuma outra tela.

Critério de aceite: o menu mostra "Recorrentes", a tela abre com as três abas
(Contratos, Despesas, Previsão) e nenhuma outra tela quebra.

---

## Depois de publicar, testar nesta ordem

1. **Contratos → Novo contrato**: cliente Amare Pediatria, valor do contrato, frequência Mensal,
   dia do vencimento, primeiro vencimento e **12 ocorrências**. Confira a prévia das datas antes de salvar.
2. **Vincular histórico** (ícone de corrente): marque as cobranças da Amare que já existem.
   Elas passam a pertencer ao contrato sem ter valor ou data alterados.
3. **Gerar** (ícone de refresh): cria só o que falta. Clique duas vezes — a segunda deve dizer
   "Nada a gerar".
4. **Despesas → Nova despesa**: energia elétrica, 12 repetições, marcar "valor é estimado".
   Os lançamentos nascem como *A Pagar* e aparecem em Alertas para confirmação de valor.
5. **Previsão**: confira recebido / a receber / pago / a pagar por mês.
