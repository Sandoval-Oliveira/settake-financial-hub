# Novo Grupo "Financeiro" e Item "Baixa da antecipação"

Consigo fazer direto — não precisa criar nada manualmente no Supabase.

## O que será feito

Inserir na hierarquia existente (Natureza `Custo Variável`, id 4):

- Grupo: **Financeiro** (novo, dentro de Custo Variável)
- Item: **Baixa da antecipação** (novo, dentro do grupo Financeiro)

Hoje Custo Variável tem apenas: Comercial, Estrutura, Fiscal, Mobilidade. Depois passa a ter também Financeiro.

## Efeito na interface

Nenhuma alteração de código é necessária: os selects em cascata (Natureza → Grupo → Item) do drawer de lançamentos e os filtros da aba Categorias em Relatórios leem essas tabelas direto do banco, então o novo grupo/item aparece automaticamente.

## Detalhes técnicos

- Operação de dados (INSERT), sem migration de schema:
  - `insert into grupo (natureza_id, nome) values (4, 'Financeiro')`
  - `insert into item (grupo_id, nome) values (<id do grupo criado>, 'Baixa da antecipação')`
- Inserção idempotente (verifica se já existe antes de criar).
- O trigger `fn_valida_hierarquia` continua garantindo a consistência ao lançar transações nessa combinação.

## Opcional (não incluído)

Se quiser gerenciar Naturezas/Grupos/Itens pela tela de Cadastros no futuro, posso adicionar uma aba "Categorias" lá — hoje só existem Pessoas e Contas Bancárias.
