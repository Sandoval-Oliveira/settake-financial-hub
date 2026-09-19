# Prompt Lovable — ERP · Vincular histórico (Recorrentes)

Cole no chat da Lovable do projeto settake-financial-hub:

---
O banco já foi atualizado. A view `recorrentes_candidatos` agora retorna TODOS os lançamentos soltos do cliente (sem `lancamento_recorrente_id`), inclusive os anteriores a `data_inicio` do contrato, e ganhou a coluna booleana `anterior_ao_contrato`.

Ajuste a tela de Recorrentes:

1. No diálogo "Vincular histórico" (src/lib/recorrentes.ts + componente que consome `recorrentes_candidatos`):
   - Não filtrar mais por `vencimento >= data_inicio` no front, se existir esse filtro.
   - Mostrar um chip discreto "Anterior ao contrato" quando `anterior_ao_contrato = true`.
   - Ordenar por vencimento desc, todos pré-selecionados; manter o botão "Vincular N lançamentos" chamando o RPC `vincular_transacoes_recorrente(p_recorrente_id, p_transacao_ids)`.
   - Mensagem vazia: "Nenhum candidato — todos os lançamentos deste cliente já estão vinculados."

2. Tipar `CandidatoVinculo` com `anterior_ao_contrato: boolean`.

3. No form de contrato, ao lado de `data_inicio`, texto de ajuda: "Use a data real de início do contrato. O gerador nunca cria cobrança duplicada para um mês que já tenha lançamento do cliente."

4. Tratar erro `Sem permissão` dos RPCs (gerar/renovar/vincular) com toast amigável — agora só admin/sócio podem executar.

Não altere schema; regenere `types.ts` se necessário.
---
