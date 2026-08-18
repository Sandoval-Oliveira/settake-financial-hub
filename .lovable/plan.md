# Nova aba "Categorias" nos Relatórios

Adicionar uma quinta aba na tela de Relatórios para análise granular de gastos e receitas por Natureza, Grupo e Item, com filtro de período livre.

## O que o usuário verá

Aba **Categorias** ao lado de Mensal, Serviços, Clientes e Contas, contendo:

**Filtros no topo**
- Período: data inicial e data final (padrão: primeiro dia do ano atual até hoje), com atalhos rápidos (Este mês, Últimos 3 meses, Este ano, Ano passado).
- Tipo: Todos / Receita / Despesa / Transferência (padrão: Despesa, o caso de uso principal).
- Status: Todos / Concluído / Em aberto (A Pagar, A Receber, Atrasada).
- Natureza e Grupo: selects em cascata opcionais para restringir a análise.

**Resumo**
- Cards com total do período, número de lançamentos e ticket médio.

**Tabela hierárquica agrupada**
- Linhas de Natureza (expansíveis) contendo Grupos, que contêm Itens.
- Cada linha mostra nome, quantidade de lançamentos, valor total, % do total do período e uma barra de proporção.
- Ordenação por valor decrescente; clique no cabeçalho alterna entre valor e quantidade.

**Gráficos**
- Barras horizontais com o top 10 categorias no período (nível escolhido: Natureza, Grupo ou Item).
- Evolução mensal do total filtrado, para ver como "Transporte" ou "Contabilidade" variam mês a mês.

**Exportar CSV** do detalhamento filtrado.

## Detalhes técnicos

- Fonte de dados: view existente `transacoes_completas` (já traz natureza, grupo, item, valor, tipo, status, vencimento). Nenhuma migration, nenhuma alteração no Supabase.
- A query `transacoesCompletasQuery` existente é reutilizada; a agregação por período e categoria é feita no cliente com `useMemo` (limite atual de 1000 linhas mantido).
- Novo componente `src/components/finance/relatorio-categorias.tsx` com a UI da aba; `src/routes/relatorios.tsx` apenas ganha o novo `TabsTrigger`/`TabsContent`.
- Reuso de `SectionCard`, `Money`, `EmptyState`, `TableSkeleton` e dos formatadores de `src/lib/format.ts`.
- Cores seguem o brand atual (amarelo #E8B800, verde para receita, vermelho para despesa).