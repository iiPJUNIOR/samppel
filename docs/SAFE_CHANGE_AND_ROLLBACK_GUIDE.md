# Guia de Alteracao Cirurgica, Blindagem de Setores e Pontos de Restauracao Total (Rollback)

Este documento define o protocolo oficial de seguranca do sistema **Samppel** para garantir que:
1. **Apenas o trecho estritamente necessario** seja alterado em cada demanda (**Escopo Cirurgico / Blast Radius Zero**).
2. **Nenhum setor critico adjacente** sofra efeito colateral por edicoes desnecessarias.
3. **Qualquer alteracao possua Ponto de Restauracao Total e Parcial**, permitindo voltar atras (**Rollback**) em segundos — seja da mudanca inteira ou de um unico arquivo especifico.

---

## 1. Protocolo de Escopo Cirurgico ("O Que Mexer vs O Que Nao Tocar")

Antes de executar qualquer alteracao no codigo, deve-se preencher e respeitar os **3 Pilares de Isolamento**:

### 1.1. Regra de Ouro de Isolamento
- **Proibido refatorar codigo vizinho sem solicitacao explicita:** Se a tarefa e alterar a cor de um card ou adicionar uma barra de rolagem, **jamais** alterar funcoes de salvamento, queries do Supabase, chamadas de API ou regras de permissao no mesmo arquivo.
- **Edicao por bloco minimo (`edit_file`):** Substituir apenas as linhas exatas do componente visual ou funcao alvo, preservando intactas todas as linhas acima e abaixo.
- **Verificacao Cruzada Obrigatoria:** Sempre rodar `npm run checkup` (que executa a validacao de 19 arquivos estruturais, 11 rotas, `tsc --noEmit` e `CHECKUP_MATRIX.md`) imediatamente apos a edicao.

### 1.2. Mapa de Zonas Criticas Blindadas (Nao Mexer sem Ordem Explicita)

| ID | Setor / Nucleo Critico | Arquivos e Funcoes Blindadas | Risco se Alterado Indevidamente |
| :--- | :--- | :--- | :--- |
| **BLIND-01** | **Movimentacao de Etapas e Interceptacoes do Kanban** | [`pedidos/page.tsx`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/pedidos/page.tsx) (`moveOrderItemToStage`, `executeStageMove`, `handleConfirmMoveStage`) | Quebra das travas de PIN de operador, alerta de saldo na producao, equipes de manuseio e conferencia na expedicao. |
| **BLIND-02** | **Abatimento e Geracao de Saldos e Creditos** | [`orders.ts`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/services/supabase_modules/orders.ts), [`ProductionAlertModal.tsx`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/components/modals/ProductionAlertModal.tsx), [`ExpeditionTransitionModal.tsx`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/components/modals/ExpeditionTransitionModal.tsx), [`saldos/page.tsx`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/pedidos/saldos/page.tsx) | Duplicidade de creditos, perda de saldo remanescente (`remaining_quantity`) ou calculo incorreto da tiragem liquida. |
| **BLIND-03** | **Sincronizacao e OAuth2 Conta Azul** | [`conta_azul.ts`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/services/conta_azul.ts), [`callback/route.ts`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/api/auth/conta-azul/callback/route.ts), rotas em `src/app/api/sync/` | Queda do token OAuth2, bloqueio do cron de 15 min ou falha ao puxar pedido manual por numero de PV. |
| **BLIND-04** | **Financeiro, Parcelas e Trava de Bloqueio/Faturado** | [`financeiro/page.tsx`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/financeiro/page.tsx), [`financial.ts`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/services/supabase_modules/financial.ts), verificacao `first_payment_date` | Liberacao indevida de pedido sem pagamento/sinal para a fabrica. |
| **BLIND-05** | **Controle de Acesso (RBAC) e Permissoes de Vendedor/Operador** | [`AuthContext.tsx`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/context/AuthContext.tsx), [`serverAuth.ts`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/lib/serverAuth.ts), [`configuracoes/page.tsx`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/configuracoes/page.tsx) | Exposicao de pedidos de outros vendedores ou perda de restricao administrativa. |
| **BLIND-06** | **Telemetria Anti-Estouro e Governanca Free/Pro** | [`monitoramento/page.tsx`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/monitoramento/page.tsx), [`supabasePlatformClient.ts`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/lib/supabasePlatformClient.ts) | Perda de visibilidade sobre limites do Plano Free do Supabase. |

---

## 2. Sistema de Pontos de Restauracao Total e Parcial (Rollback)

O projeto conta com o utilitario dedicado [`scripts/restore-point.ps1`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/scripts/restore-point.ps1) e pastas de snapshot físico `backup_YYYYMMDD_<nome>/` na raiz do projeto.

### 2.1. Como Listar Todos os Pontos de Restauracao Disponiveis
Execute no terminal (PowerShell):
```powershell
powershell -ExecutionPolicy Bypass -File scripts/restore-point.ps1 -Action list
```

### 2.2. Como Criar um Novo Ponto de Restauracao Antes de Qualquer Mudanca
```powershell
powershell -ExecutionPolicy Bypass -File scripts/restore-point.ps1 `
  -Action create `
  -PointName "backup_20261105_nome_da_mudanca" `
  -Description "Descricao exata do que sera alterado" `
  -Files @("src/app/pedidos/page.tsx", "src/services/deadline_service.ts")
```

### 2.3. Como Fazer Rollback TOTAL de uma Etapa (Voltar Tudo daquele Ponto)
Se desejar desfazer **100% das alteracoes** de uma etapa e restaurar todos os arquivos exatamente como estavam antes:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/restore-point.ps1 `
  -Action restore `
  -PointName "backup_20261105_pre_yellow_card_10d"
```

### 2.4. Como Fazer Rollback PARCIAL / CIRURGICO (Voltar Apenas 1 Arquivo Especifico)
Se desejar manter quase toda a atualizacao e voltar atras **somente em um arquivo especifico** (por exemplo, desfazer apenas um modal ou apenas o servico de prazo):
```powershell
powershell -ExecutionPolicy Bypass -File scripts/restore-point.ps1 `
  -Action restore `
  -PointName "backup_20261105_pre_kanban_modals_scroll" `
  -SingleFile "src/components/modals/DetailModal.tsx"
```

---

## 3. Catalogo de Pontos de Restauracao Ativos no Projeto

| ID do Ponto | Pasta de Backup | Escopo Protegido | O que este Rollback desfaz / restaura |
| :--- | :--- | :--- | :--- |
| **RP-13** | [`backup_20261113_pre_operator_pin_shield/`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/backup_20261113_pre_operator_pin_shield) | **9 arquivos** (`clear-force-password/route.ts`, `redefinir-senha/page.tsx`, `api/operators/route.ts`, `api/operators/authorize/route.ts`, `OperatorAuthModal.tsx`, `configuracoes/page.tsx`, `operador-perfil/page.tsx`, `CHECKUP_MATRIX.md`, `SAFE_CHANGE_AND_ROLLBACK_GUIDE.md`) | Desfaz **apenas** a blindagem completa de cadastro de PIN de operador (persistencia do PIN em `/redefinir-senha` mesmo com sessao ativa, deteccao automatica do papel `Producao`, cadastro imediato de PIN no modal `Validacao na Fabrica`, campo de definir/redefinir PIN no modal `Configurar Usuario` do Admin e obrigatoriedade em `/operador-perfil`), mantendo intactas todas as otimizacoes anteriores. |
| **RP-12** | [`backup_20261113_pre_cron_diff_and_health_throttle/`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/backup_20261113_pre_cron_diff_and_health_throttle) | **4 arquivos** (`conta_azul.ts`, `.github/workflows/sync-cron.yml`, `DatabaseStatusBanner.tsx`, `financeiro/page.tsx`) | Desfaz **apenas** a Etapa 3 da otimizacao anti-estouro do Supabase (diff previo em `importOrders` para evitar `UPDATE`/`DELETE+INSERT` redundantes no cron, janela comercial Seg-Sab 07h-20h no GitHub Actions, cooldown de 15 min no `DatabaseStatusBanner` e eliminacao de `getOrders` duplicado em `/financeiro`). |
| **RP-11** | [`backup_20261113_pre_kanban_infinite_scroll_skeleton/`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/backup_20261113_pre_kanban_infinite_scroll_skeleton) | **7 arquivos** (`globals.css`, `Skeleton.tsx`, `financial.ts`, `orders.ts`, `pedidos/page.tsx`, `CHECKUP_MATRIX.md`, `SAFE_CHANGE_AND_ROLLBACK_GUIDE.md`) | Desfaz **apenas** a Etapa 2 da otimizacao anti-estouro do Supabase (Skeleton UI dedicado para Kanban/Lista, Scroll Infinito com `IntersectionObserver` em `Concluido`/`CANCELADOS`, busca sob demanda no servidor para PVs historicos, cache de catalogos estaticos e eliminacao do full-scan de 5.438 clientes e payload financeiro inchado). |
| **RP-10** | [`backup_20261112_pre_supabase_requests_optimization/`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/backup_20261112_pre_supabase_requests_optimization) | **6 arquivos** (`orders.ts`, `pedidos/page.tsx`, `AuthContext.tsx`, `supabase_order_item_shortages.sql`, `CHECKUP_MATRIX.md`, `SAFE_CHANGE_AND_ROLLBACK_GUIDE.md`) | Desfaz **apenas** a otimizacao de requisicoes ao Supabase (eliminacao do erro `HTTP 400` de URL gigante nas 3 buscas Bulk usando `tenant_id` + filtro em memoria, estabilizacao de referencia de `user` no `AuthContext` em renovacoes de token e pausa de recarregamento em abas ocultas). |
| **RP-09** | [`backup_20261109_pre_seller_stage_permissions_fix/`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/backup_20261109_pre_seller_stage_permissions_fix) | **8 arquivos** (`AuthContext.tsx`, `profiles.ts`, `api/operators/route.ts`, `configuracoes/page.tsx`, `MoveStageModal.tsx`, `pedidos/page.tsx`, `CHECKUP_MATRIX.md`, `SAFE_CHANGE_AND_ROLLBACK_GUIDE.md`) | Desfaz **apenas** a correcao cirurgica de movimentacao de etapas por Vendedores/Perfis (`currentStageId` com fallback para `stages[0]`, persistencia de carteira no banco, normalizacao de nomes e substituicao de `window.alert` nativo por notificacao/modal do sistema), mantendo todas as entregas anteriores intactas. |
| **RP-08** | [`backup_20261105_pre_partial_manuseio_concluido/`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/backup_20261105_pre_partial_manuseio_concluido) | **4 arquivos** (`orders.ts`, `HandlingTeamModal.tsx`, `pedidos/page.tsx`, `DetailViewModal.tsx`) | Desfaz **apenas** o botao de Finalizar Entrega Parcial no Manuseio -> Concluido (`+Estoque`) + Geracao de Novo Card para o Saldo que Faltou e a blindagem de estoque no `splitOrderItem`, mantendo todas as entregas anteriores intactas. |
| **RP-07** | [`backup_20261105_pre_undo_saco_to_sacola/`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/backup_20261105_pre_undo_saco_to_sacola) | **6 arquivos** (`TransformSacoModal.tsx`, `DetailViewModal.tsx`, `produtos/page.tsx`, `pedidos/page.tsx`, `SAFE_CHANGE_AND_ROLLBACK_GUIDE.md`, `CHECKUP_MATRIX.md`) | Desfaz **apenas** o botao e modal de **Desfazer Transformacao (Saco -> Sacola)** e o sinal `-` nas saidas do extrato, mantendo todas as entregas anteriores intactas. |
| **RP-06** | [`backup_20261105_pre_overdue_red_pulse/`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/backup_20261105_pre_overdue_red_pulse) | **4 arquivos** (`globals.css`, `pedidos/page.tsx`, `SAFE_CHANGE_AND_ROLLBACK_GUIDE.md`, `CHECKUP_MATRIX.md`) | Desfaz **apenas** a separacao visual entre Card Vermelho Piscando Suave (atrasados) e Card Amarelo Fixo (`0 <= dias <= 10`). |
| **RP-05** | [`backup_20261105_pre_order_details_fix/`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/backup_20261105_pre_order_details_fix) | **5 arquivos** (`pedidos/page.tsx`, `DetailViewModal.tsx`, `DetailModal.tsx`, `SAFE_CHANGE_AND_ROLLBACK_GUIDE.md`, `CHECKUP_MATRIX.md`) | Desfaz **apenas** a correcao de leitura/unificacao de `item.notes + order.notes` e extracao de especificacoes nos modais de Pedido, mantendo todas as entregas anteriores intactas. |
| **RP-04** | [`backup_20261105_pre_saco_to_sacola/`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/backup_20261105_pre_saco_to_sacola) | **4 arquivos** (`produtos/page.tsx`, `MODALS_INVENTORY.md`, `CHECKUP_MATRIX.md`, `SAFE_CHANGE_AND_ROLLBACK_GUIDE.md`) | Desfaz **apenas** a funcionalidade de Transformar Saco em Sacola + Card em `Ir para Manuseio`, mantendo o Card Amarelo e as barras de rolagem intactos. |
| **RP-03** | [`backup_20261105_pre_yellow_card_10d/`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/backup_20261105_pre_yellow_card_10d) | **4 arquivos** (`deadline_service.ts`, `globals.css`, `pedidos/page.tsx`, `CHECKUP_MATRIX.md`) | Desfaz **apenas** o destaque de Card Amarelo Fixo (`<= 10 dias`), **mantendo** as barras de rolagem do Kanban e dos 55 modais intactas. |
| **RP-02** | [`backup_20261105_pre_kanban_modals_scroll/`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/backup_20261105_pre_kanban_modals_scroll) | **44 arquivos** (`globals.css`, `pedidos/page.tsx`, 33 componentes de modal e 9 paginas) | Desfaz tanto o Card Amarelo quanto as alteracoes de barra de rolagem do Kanban e dos 55 modais, voltando ao estado original anterior a 05/11/2026. |
| **RP-01** | [`backup_20261030_pre_supabase_platform_api/`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/backup_20261030_pre_supabase_platform_api) | **6 arquivos** do modulo `/monitoramento` | Restaura a tela de Monitoramento para o estado anterior a integracao direta com a Management/Prometheus API da Supabase. |

---

## 4. Registro de Escopo Cirurgico das Alteracoes de 05/11/2026

Para total transparencia e auditoria rapida, abaixo esta o mapa exato do que foi tocado em cada entrega de hoje e o que permaneceu 100% intocado:

### Entrega A — Barra de Rolagem Lateral no Kanban + Rolagem Vertical nos 55 Modais
- **Ponto de Restauracao Previo:** `backup_20261105_pre_kanban_modals_scroll`
- **O que foi alterado exclusivamente:**
  1. [`src/app/globals.css`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/globals.css#L1013-L1059): Adicao das classes CSS `.kanban-board-scroll`, `.kanban-column-scroll` e `.modal-scroll`.
  2. [`src/app/pedidos/page.tsx`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/pedidos/page.tsx): Substituicao da classe `no-scrollbar` por `kanban-board-scroll` (linha 5339) e `kanban-column-scroll` (linha 5599), e liberacao de `overflowY: 'auto'` no `.page-container` (linha 4768).
  3. **55 Modais** (mapeados em [`docs/MODALS_INVENTORY.md`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/docs/MODALS_INVENTORY.md)): Inclusao exclusiva das propriedades visuais `maxHeight: '90vh'`, `overflowY: 'auto'` e classe `modal-scroll` no container externo de cada modal.
- **Setores Blindados (Zero alteracao):** Nenhuma logica de formulario, botao de salvar, chamada Supabase ou transição de etapa foi modificada.

### Entrega B — Card Amarelo Fixo (`0 a 10 dias`) + Card Vermelho Piscando Suave (Atrasados)
- **Pontos de Restauracao Previos:** `backup_20261105_pre_yellow_card_10d` e `backup_20261105_pre_overdue_red_pulse`
- **O que foi alterado exclusivamente:**
  1. [`src/services/deadline_service.ts`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/services/deadline_service.ts#L162-L221): Criacao da funcao `getExpeditionUrgency` que calcula `daysRemaining`, `isNearExpedition` (`0 <= dias <= 10`) e `isOverdue` (`dias < 0`) para qualquer etapa ativa (ignorando `Concluido` e `CANCELADOS`).
  2. [`src/app/globals.css`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/globals.css#L1062-L1117): Adicao das variaveis `--warning-card-bg` (`#FEF9C3` fixo para `0 <= dias <= 10`) e da animacao suave `.kanban-card-overdue-pulse` (`overdueSoftRedPulse 3.2s ease-in-out infinite` entre `#FFF1F2` e `#FEE2E2` para pedidos atrasados).
  3. [`src/app/pedidos/page.tsx`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/pedidos/page.tsx#L5694-L5798): Separacao entre `isYellowAlert` (somente `0 <= dias <= 10`, amarelo fixo) e `isOverdueAlert` (`dias < 0`, vermelho piscando levemente de forma suave e tranquila).
- **Setores Blindados (Zero alteracao):** Calculo da data de expedicao (`calculateExpeditionDate`), botoes `DU`/`DC`, arrastar-e-soltar (drag & drop), filtros e modais de transicao permaneceram 100% intocados.

### Entrega C — Transformar Saco em Sacola + Gerar Card em "Ir para Manuseio" + Opcao "Desfazer Transformacao" Rastreavel
- **Pontos de Restauracao Previos:** `backup_20261105_pre_saco_to_sacola` e `backup_20261105_pre_undo_saco_to_sacola`
- **O que foi alterado exclusivamente:**
  1. [`src/components/modals/TransformSacoModal.tsx`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/components/modals/TransformSacoModal.tsx): Novo modal dedicado para interceptar saidas de produtos com `SACO` no nome, converter automaticamente nome/medida/quantidade, buscar e vincular a `SACOLA` correspondente (ou permitir escolha manual/criacao), exigir o numero do card/OP, dar `SAIDA` no Saco e `ENTRADA` na Sacola (com `[ITEM:<id>]` e `[SACO_TO_SACOLA|SACO_ID:...|SACOLA_ID:...|QTY:...]` para rastreabilidade e idempotencia) e criar o card na etapa `Ir para Manuseio`.
  2. [`src/components/modals/DetailViewModal.tsx`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/components/modals/DetailViewModal.tsx): Banner de rastreabilidade e botao **Desfazer Transformacao (Saco -> Sacola)** ao abrir o card gerado em Pedidos, permitindo devolver `+qty` ao Saco (`ENTRADA`), retirar `-qty` da Sacola (`SAIDA`) e arquivar o card em `CANCELADOS` com log completo de estorno (`[TRANSFORMACAO_DESFEITA]`, data/hora, responsavel e motivo) ou exclui-lo.
  3. [`src/app/produtos/page.tsx`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/produtos/page.tsx): Interceptacao cirurgica em `handleStockSubmit` quando `stockAdjType === 'SAIDA'` e `isSacoProduct(selectedProduct.name)`, e exibicao do sinal negativo (`-`) em vermelho para transacoes do tipo `SAIDA` no Extrato de Movimentacoes.
- **Setores Blindados (Zero alteracao):** Funcao `adjustStock` em `products.ts`, sincronizacao Conta Azul e demais tipos de movimentacao (`ENTRADA`, `AJUSTE` e `SAIDA` de produtos que nao sao Saco) permaneceram 100% intocados.

### Entrega D — Unificacao de Observacoes (`item.notes` + `order.notes`) e Extracao Completa das Especificacoes do Pedido
- **Ponto de Restauracao Previo:** `backup_20261105_pre_order_details_fix`
- **O que foi alterado exclusivamente:**
  1. [`src/app/pedidos/page.tsx`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/pedidos/page.tsx): Criacao de `combineOrderNotes` e ampliacao de `extractOrderDetails(notes, secondaryNotes)` para combinar `item.notes` e `order.notes` sem perder as especificacoes gerais do pedido quando o item possui um detalhe curto (ex: `"L ENTRECOT"`, `"MUY"`, `"FAT BUDDHA"`), alem de reconhecer `Prazo de Producao:`, `Quant e cor da arte:`, `Autorizado Creditos:`, `OC / OC SAMPPEL / OC IKS`, `NF IKS` e `Emissao Nota:` e passar `formCliche` / `setFormCliche` ao `DetailModal`.
  2. [`src/components/modals/DetailViewModal.tsx`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/components/modals/DetailViewModal.tsx): Exibicao completa das especificacoes extraidas (`extractOrderDetails(detailItem.notes, order.notes)`) e apresentacao conjunta de `detailItem.notes` (Detalhe do Item) + `order.notes` (Observacoes Gerais do Pedido) na secao de Observacoes.
  3. [`src/components/modals/DetailModal.tsx`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/components/modals/DetailModal.tsx): Inclusao do campo `Cliche` na grade de Especificacoes do Item no modal de edicao.
- **Setores Blindados (Zero alteracao):** Regras de transicao do Kanban, calculo de saldos/creditos, financeiro e sincronizacao Conta Azul permaneceram 100% intocados.



