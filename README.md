# SetTake Vision

Crie um ERP financeiro completo chamado SetTake Finance conectado ao meu projeto Supabase já configurado. O banco já contém todas as tabelas e views prontas — não crie nenhuma migration, apenas leia e escreva nas tabelas existentes.

SCHEMA EXISTENTE NO SUPABASE

Tabelas:

contas_bancarias: id, nome, saldo_inicial (numeric)

pessoas: id, nome, tipo (enum: 'Cliente' | 'Fornecedor')

natureza: id, nome, descricao — 8 registros fixos (IDs 1 a 8)

grupo: id, natureza_id (FK), nome — subcategoria de natureza

item: id, grupo_id (FK), nome — subcategoria de grupo

transacoes: id, nome, valor (numeric), tipo (enum: 'Receita' | 'Despesa' | 'Transferência'), status (enum: 'A Pagar' | 'A Receber' | 'Atrasada' | 'Concluído'), temperatura (enum: 'Quente' | 'Frio'), natureza_id (FK), grupo_id (FK), item_id (FK), conta_origem_id (FK → contas_bancarias), conta_destino_id (FK → contas_bancarias, nullable), pessoa_id (FK → pessoas, nullable), vencimento (date), criado_em, atualizado_em

Views (somente leitura — já fazem todos os JOINs):

transacoes_completas: retorna todas as transações com nomes no lugar de IDs (natureza, grupo, item, conta_origem, conta_destino, pessoa)

saldo_contas: id, conta, saldo_inicial, total_entradas, total_saidas, saldo_atual

ltv_clientes: pessoa_id, cliente, tipo, total_transacoes, ltv_total, primeira_transacao, ultima_transacao

resumo_mensal: mes (YYYY-MM), receita_bruta, despesa_total, resultado, custo_fixo, custo_variavel, capex, crescimento, total_socios, distribuicao_pablo, distribuicao_sandoval, geracao_caixa

receita_por_servico: mes, servico, grupo, qtd_transacoes, receita_total

calendario: id, vencimento, nome, tipo, status, valor, natureza, grupo, item, conta_origem, pessoa, atrasado (boolean), dias_para_vencer (integer)

DESIGN SYSTEM

Identidade visual: ERP financeiro profissional e denso em dados. Tema escuro obrigatório (dark mode como padrão único). Paleta: fundo principal #0F1117, superfícies de card #1A1D27, bordas sutis #2A2D3E, texto primário #F0F2F8, texto secundário #8B8FA8, accent principal #6C63FF (violeta), accent positivo #22C55E (verde), accent negativo #EF4444 (vermelho), accent alerta #F59E0B (âmbar).

Tipografia: Inter para tudo. Números financeiros em font-variant-numeric: tabular-nums para alinhar colunas. Valores monetários sempre com prefixo "R$" e 2 casas decimais formatadas com Intl.NumberFormat pt-BR.

Componentes visuais:

Cards com border: 1px solid #2A2D3E, border-radius: 12px, sem sombra exagerada

Badges de status coloridos: "A Pagar" → âmbar, "A Receber" → azul, "Atrasada" → vermelho com pulso animado, "Concluído" → verde

Badges de tipo: "Receita" → verde, "Despesa" → vermelho, "Transferência" → violeta

Sidebar fixa à esquerda com largura 240px, logo "SF" em gradiente violeta no topo

Tabelas com linhas zebradas sutis, hover em #1E2130

Todos os valores negativos (despesas) em vermelho, positivos em verde

ESTRUTURA DE PÁGINAS

1. DASHBOARD (/)

Layout em grid. Topo: 4 cards de saldo lado a lado buscando da view saldo_contas — exibir nome da conta, saldo_atual grande em destaque, saldo_inicial pequeno abaixo como referência. Cor do valor: verde se positivo, vermelho se negativo.

Abaixo dos cards: dois gráficos lado a lado usando Recharts:

Gráfico 1 — Resultado Mensal (BarChart combinado): barras de receita_bruta em verde e despesa_total em vermelho, linha de resultado em violeta, últimos 6 meses, dados da view resumo_mensal

Gráfico 2 — Receita por Serviço (BarChart horizontal): top 6 serviços do mês atual, dados de receita_por_servico, barras em gradiente violeta

Abaixo: tabela compacta com os próximos 7 vencimentos da view calendario onde atrasado = false, ordenado por vencimento ASC. Colunas: data, nome, tipo (badge), valor, status (badge), conta, pessoa. Ao lado: tabela igual mas para atrasados (atrasado = true), header em vermelho.

Rodapé do dashboard: 3 métricas do mês atual da view resumo_mensal: Geração de Caixa, Distribuição Pablo, Distribuição Sandoval.

2. LANÇAMENTOS (/lancamentos)

Página principal de gestão de transações.

Header da página: botão primário "+ Novo Lançamento" à direita que abre um drawer lateral deslizante da direita com formulário completo.

Filtros em linha acima da tabela: dropdown de Tipo (Receita/Despesa/Transferência/Todos), dropdown de Status (todos os status + "Todos"), input de busca por nome, date range picker de vencimento (mês atual como padrão), dropdown de Conta Origem. Botão "Limpar filtros".

Tabela principal com dados de transacoes_completas. Colunas: Data Vencimento (ordenável), Nome, Tipo (badge colorido), Natureza, Grupo, Item, Conta Origem, Pessoa, Valor (alinhado à direita, colorido por tipo), Status (badge), Temperatura (ícone 🔥 Quente ou ❄️ Frio), Ações (ícone de editar e de excluir). Paginação de 20 itens por página. Linha inteira clicável para abrir o drawer de edição.

Drawer de Novo/Editar Lançamento:

Título: "Novo Lançamento" ou "Editar Lançamento"

Campo: Nome (input text, obrigatório)

Campo: Tipo (select: Receita / Despesa / Transferência — ao mudar, refiltra as opções abaixo)

Campo: Valor (input numérico, obrigatório, apenas positivo)

Campo: Vencimento (date picker, obrigatório)

Campo: Status (select: A Pagar / A Receber / Atrasada / Concluído)

Campo: Temperatura (select: Quente / Frio, opcional)

Campo: Natureza (select que busca da tabela natureza — ao selecionar, limpa e recarrega Grupo)

Campo: Grupo (select dependente de natureza_id — ao selecionar, limpa e recarrega Item)

Campo: Item (select dependente de grupo_id)

Campo: Conta Origem (select de contas_bancarias, obrigatório)

Campo: Conta Destino (select de contas_bancarias, visível apenas quando tipo = "Transferência", não pode ser igual à Conta Origem)

Campo: Pessoa (select de pessoas com tipo ao lado, opcional, mostra apenas quando tipo = "Receita" ou "Despesa")

Botões: "Cancelar" (fechar drawer) e "Salvar" (insert ou update em transacoes)

Ao salvar com sucesso: fechar drawer, toast de sucesso, recarregar tabela

Validações obrigatórias:

Se tipo = Transferência: conta_destino obrigatória e diferente de conta_origem

natureza, grupo e item são sempre obrigatórios

valor deve ser > 0

3. CALENDÁRIO (/calendario)

Visão de vencimentos organizados.

Header: título "Calendário de Pagamentos", filtro de status (checkbox: A Pagar, A Receber, Atrasada), navegação de mês (← Mês Anterior / Mês Atual / Próximo Mês →).

Seção "Em Atraso" (sempre no topo, fundo vermelho escuro #2D0F0F): cards dos lançamentos onde atrasado = true, exibindo dias_para_vencer em vermelho bold (ex: "-3 dias"), nome, valor, conta, pessoa. Botão "Marcar como Concluído" em cada card que faz UPDATE status = 'Concluído' direto na tabela transacoes.

Seção principal: lista de cards agrupados por data de vencimento. Cada data é um header (Segunda, 18 Ago). Abaixo: cards horizontais com: ícone do tipo (↑ receita, ↓ despesa, ↔ transferência), nome, natureza → grupo → item em texto menor, valor grande, badge de status, conta origem, pessoa (se houver), botão "Concluir" rápido. Cards de receita têm borda esquerda verde, despesa vermelha, transferência violeta.

4. RELATÓRIOS (/relatorios)

Página de análise financeira com 4 abas: Mensal, Serviços, Clientes, Contas.

Aba Mensal — dados de resumo_mensal:

Seletor de ano (default: ano atual)

Tabela com colunas: Mês, Receita Bruta, Despesa Total, Resultado (colorido), Custo Fixo, Custo Variável, CAPEX, Crescimento, Dist. Pablo, Dist. Sandoval, Geração de Caixa

Linha de totais no rodapé em bold

AreaChart abaixo mostrando receita_bruta vs despesa_total vs resultado ao longo dos meses, com tooltip rico

Aba Serviços — dados de receita_por_servico:

Seletor de mês e ano

BarChart horizontal ranqueando serviços por receita_total

Tabela com: serviço, grupo, qtd_transacoes, receita_total, % do total

Aba Clientes — dados de ltv_clientes:

Tabela ranqueada por ltv_total decrescente

Colunas: posição, cliente, tipo, total_transacoes, primeira_transacao, ultima_transacao, LTV Total (em verde bold)

Badge de tipo (Cliente/Fornecedor)

Aba Contas — dados de saldo_contas:

Cards grandes para cada conta com: nome da conta, saldo_inicial, total_entradas (verde), total_saidas (vermelho), saldo_atual (grande, colorido)

Mini gráfico de barras mostrando entrada vs saída de cada conta

5. CADASTROS (/cadastros)

Duas abas: Pessoas e Contas Bancárias.

Aba Pessoas:

Tabela com id, nome, tipo (badge Cliente/Fornecedor), criado_em

Botão "+ Nova Pessoa" abre modal com campos nome (text) e tipo (select)

Ícone de editar e excluir em cada linha

Busca por nome em tempo real

Aba Contas Bancárias:

Tabela com id, nome, saldo_inicial

Botão "+ Nova Conta" abre modal com campos nome (text) e saldo_inicial (numeric)

Ícone de editar e excluir em cada linha

NAVEGAÇÃO SIDEBAR

Itens fixos na sidebar esquerda com ícones Lucide:

📊 Dashboard → /

💸 Lançamentos → /lancamentos

📅 Calendário → /calendario

📈 Relatórios → /relatorios

👥 Cadastros → /cadastros

Item ativo com fundo accent violeta #6C63FF e texto branco. Rodapé da sidebar: nome do workspace "SetTake Finance" em texto pequeno.

REGRAS TÉCNICAS OBRIGATÓRIAS

Nunca usar localStorage, sessionStorage ou browser storage

Cascata de selects: ao mudar Natureza → resetar e recarregar Grupo com ?natureza_id=eq.X no Supabase; ao mudar Grupo → resetar e recarregar Item com ?grupo_id=eq.X

Formatação monetária: sempre Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

Formatação de data: sempre dd/MM/yyyy em português

Toasts de sucesso (verde) e erro (vermelho) em todas as operações de escrita

Loading states em todas as queries: skeleton loader nas tabelas, spinner nos botões de ação

Estado vazio: mensagem amigável com ícone quando não há dados

Responsivo: sidebar colapsa em ícones em telas < 1024px, esconde completamente em mobile com menu hambúrguer

Usar Recharts para todos os gráficos

Usar Lucide React para todos os ícones

Queries ao Supabase via supabase-js client já configurado pelo Lovable

PRIORIDADE DE ENTREGA

Se não for possível gerar tudo de uma vez, priorize nesta ordem:

Layout base (sidebar + roteamento)

Dashboard com cards de saldo e gráfico mensal

Página de Lançamentos com tabela e drawer de cadastro

Calendário

Relatórios

Cadastros

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://settake-financial-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2ca84796-00b3-40a9-96a9-90dce12c92a0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
