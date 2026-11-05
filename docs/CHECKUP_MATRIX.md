# Matriz de Funcionalidades e Auditoria de Integridade (Checkup Matrix)

Este documento é o registro vivo de saúde, dependências e integridade lógica de cada módulo e funcionalidade do sistema Samppel.

---

## 1. Diretrizes Obrigatórias de Manutenção

1. **Inclusão Obrigatória de Novas Funcionalidades:** Toda e qualquer nova funcionalidade criada no sistema deve ser adicionada imediatamente a esta matriz com seus arquivos, escopo e dependências mapeados.
2. **Validação Cruzada de Não-Regressão:** Ao alterar qualquer funcionalidade, o assistente deve verificar os módulos listados na seção "Módulos que Dependem Dele" para assegurar que nada foi quebrado.
3. **Alerta Prévio com Opções:** Se for identificada qualquer quebra ou risco de efeito colateral em outra funcionalidade, o assistente **deve obrigatoriamente avisar o usuário antes de tomar qualquer decisão**, apresentando opções claras de resolução para que o usuário decida o caminho.
4. **Carimbo de Data:** Toda alteração em código deve atualizar o campo `Última Alteração` do respectivo módulo nesta matriz.

---

## 2. Tabela Mestra de Módulos e Status de Saúde

| ID | Módulo / Funcionalidade | Arquivos Principais | Última Alteração | Status |
| :--- | :--- | :--- | :--- | :--- |
| **MOD-01** | Autenticação, Usuários e Perfis | `src/app/page.tsx`, `AuthContext.tsx`, `profiles.ts`, `AppGuard.tsx`, `Sidebar.tsx`, `OperatorAuthModal.tsx` | 2026-11-05 | OK |
| **MOD-02** | Pedidos: Criação, Edição e Itens | `src/app/pedidos/page.tsx`, `orders.ts`, `src/components/modals/*`, `docs/MODALS_INVENTORY.md` | 2026-11-05 | OK |
| **MOD-03** | Pedidos: Kanban e Transição de Etapas | `src/app/pedidos/page.tsx` (`moveOrderItemToStage`), `src/services/deadline_service.ts` (`getExpeditionUrgency`), `src/app/globals.css` (`.kanban-board-scroll`, `--warning-card-bg`) | 2026-11-05 | OK |
| **MOD-04** | Pedidos: Alerta de Produção & Abatimento | `ProductionAlertModal.tsx`, `pedidos/page.tsx` | 2026-11-05 | OK |
| **MOD-05** | Pedidos: Equipes de Manuseio | `HandlingTeamModal.tsx`, `orders.ts` | 2026-11-05 | OK |
| **MOD-06** | Pedidos: Expedição, Sobras/Faltas e Frete | `ExpeditionTransitionModal.tsx`, `AdjustmentModal.tsx`, `orders.ts` | 2026-11-05 | OK |
| **MOD-07** | Pedidos: Conferência Física na Expedição | `ConferencyModal.tsx`, `pedidos/page.tsx` | 2026-11-05 | OK |
| **MOD-08** | Saldos e Créditos de Clientes | `src/app/pedidos/saldos/page.tsx`, `api/admin/saldos`, `orders.ts` | 2026-11-05 | OK |
| **MOD-09** | Financeiro: Contas e Conciliação | `src/app/financeiro/page.tsx`, `financial.ts`, `orders.ts` | 2026-11-05 | OK |
| **MOD-10** | Clientes: Gestão e Busca | `src/app/clientes/page.tsx`, `customers.ts` | 2026-11-05 | OK |
| **MOD-11** | Produtos e Catálogo Técnico | `src/app/produtos/page.tsx`, `products.ts`, `TransformSacoModal.tsx` | 2026-11-05 | OK |
| **MOD-12** | Fornecedores | `src/app/fornecedores/page.tsx`, `suppliers.ts` | 2026-11-05 | OK |
| **MOD-13** | Relatórios e Estatísticas | `src/app/relatorios/page.tsx` | 2026-11-05 | OK |
| **MOD-14** | Configurações, Setores e Logs | `src/app/configuracoes/page.tsx`, `api/config/conta-azul`, `DatabaseStatusBanner.tsx`, `logs/` | 2026-11-05 | OK |
| **MOD-15** | Integração Conta Azul | `src/services/conta_azul.ts`, `sync_queue.ts`, rotas em `api/sync/`, `.github/workflows/`, `vercel.json` | 2026-10-30 | OK |
| **MOD-16** | Central de Monitoramento, Telemetria Anti-Estouro e Governança | `src/app/monitoramento/page.tsx`, `InfoHint.tsx`, `metricGuides.ts`, `src/lib/supabasePlatformClient.ts`, `src/app/api/admin/monitoring/route.ts`, `supabase/supabase_monitoring_center.sql` | 2026-11-05 | OK |

Legenda de Status:
* **OK:** Funcionalidade auditada, sem erros de compilação, tipos ou lógica aparente.
* **ALERTA:** Funcionalidade operante mas com atenção requerida ou necessidade de revisão.
* **FALHA:** Funcionalidade quebrada ou com conflito em outros módulos.
* **NÃO TESTADO:** Módulo pendente de varredura detalhada recente.

---

## 3. Detalhamento e Mapeamento de Dependências por Módulo

### MOD-01: Autenticação, Usuários e Perfis
* **Responsabilidade:** Login, logout, recuperação de senha, RBAC (Administrador, Vendedor, Comercial, Financeiro, Operador).
* **Arquivos-Chave:** [page.tsx](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/page.tsx), [AuthContext.tsx](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/context/AuthContext.tsx), [profiles.ts](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/services/supabase_modules/profiles.ts), [operador-perfil](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/operador-perfil/page.tsx).
* **Onde se conecta:** Supabase Auth (`auth.users`), tabela pública de operadores e perfis.
* **Módulos que Dependem Dele:** Todos (controla visibilidade no Sidebar e permissões de transição no Kanban).
* **Critérios de Validação:**
  * Login com credenciais válidas.
  * Respeito às regras de transição no Kanban por perfil.
  * Isolamento de vendedores aos seus próprios pedidos.

### MOD-02: Pedidos - Criação, Edição e Itens
* **Responsabilidade:** Formulário de novos pedidos, cadastro de itens avulsos, tiragem, data de entrega, observações.
* **Arquivos-Chave:** [pedidos/page.tsx](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/pedidos/page.tsx), [orders.ts](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/services/supabase_modules/orders.ts).
* **Onde se conecta:** Tabelas `orders`, `order_items`, `customers`, `products`.
* **Módulos que Dependem Dele:** MOD-03 (Kanban), MOD-09 (Financeiro), MOD-13 (Relatórios).
* **Critérios de Validação:**
  * Inserção com `tenant_id` correto.
  * Geração do número de PV e OP.
  * Associação íntegra de `customer_id` e `product_id`.

### MOD-03: Pedidos - Kanban e Transição de Etapas
* **Responsabilidade:** Renderização das colunas do Kanban, movimentação de cards (`moveOrderItemToStage`), ordenação e filtros.
* **Arquivos-Chave:** [pedidos/page.tsx](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/pedidos/page.tsx).
* **Onde se conecta:** Tabelas `order_items`, `stages`, modais de interceptação.
* **Módulos que Dependem Dele:** MOD-04, MOD-05, MOD-06, MOD-07.
* **Critérios de Validação:**
  * Bypasses funcionam e não causam loops infinitos.
  * Interceptações disparam corretamente ao atingir etapas sensíveis (Produção, Manuseio, Expedição).

### MOD-04: Pedidos - Alerta de Produção & Abatimento de Saldos
* **Responsabilidade:** Interceptar cards ao mover de "Pedidos/A produzir" para "Em produção/Estoque" caso o cliente possua crédito ou pendência ativa do mesmo produto.
* **Arquivos-Chave:** [ProductionAlertModal.tsx](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/components/modals/ProductionAlertModal.tsx), [pedidos/page.tsx](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/pedidos/page.tsx#L1870-L1896).
* **Onde se conecta:** `customer_stock_credits`, `order_items`.
* **Módulos que Dependem Dele:** MOD-07 (Conferência na Expedição), MOD-08 (Saldos e Créditos).
* **Critérios de Validação:**
  * Abatimento proporcional se crédito for superior à tiragem (`leftoverCredit > 0`).
  * Atualização de `customer_stock_credits` com `remaining_quantity` e status `'ATIVO'` ou `'UTILIZADO'`.
  * Preenchimento de `applied_adjustment_id`, `adjusted_quantity_math` e `adjusted_production_quantity` no item.

### MOD-05: Pedidos - Equipes de Manuseio
* **Responsabilidade:** Interceptar cards ao entrar na etapa "Manuseio" para associar operadores e equipes.
* **Arquivos-Chave:** [HandlingTeamModal.tsx](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/components/modals/HandlingTeamModal.tsx), [orders.ts](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/services/supabase_modules/orders.ts).
* **Onde se conecta:** Tabelas `order_item_teams`, `operators`.
* **Módulos que Dependem Dele:** MOD-13 (Relatórios de Produtividade de Operadores).
* **Critérios de Validação:**
  * Gravação dos operadores vinculados e timestamps de início/término.

### MOD-06: Pedidos - Expedição, Sobras/Faltas e Frete
* **Responsabilidade:** Consolidar itens irmãos do pedido ao entrar na Expedição, coletar dados de volumes/frete e registrar sobras/faltas de produção.
* **Arquivos-Chave:** [ExpeditionTransitionModal.tsx](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/components/modals/ExpeditionTransitionModal.tsx), [orders.ts](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/services/supabase_modules/orders.ts#L1469-L1535).
* **Onde se conecta:** Tabelas `order_shipping_volumes`, `order_balance_adjustments`, `customer_stock_credits`, `customer_product_stock`.
* **Módulos que Dependem Dele:** MOD-07 (Conferência), MOD-08 (Saldos e Créditos).
* **Critérios de Validação:**
  * Não gerar registros duplicados em `customer_stock_credits`.
  * Gravar dimensões, peso e embalagem do frete.
  * Permitir ações de Sobra (Cortesia/Estoque do Cliente) e Falta (Crédito próximo pedido/Pendência entrega).

### MOD-07: Pedidos - Conferência Física na Expedição
* **Responsabilidade:** Exigir confirmação física do carregamento quando um item utilizou saldo de compensação anterior (`applied_adjustment_id`).
* **Arquivos-Chave:** [ConferencyModal.tsx](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/components/modals/ConferencyModal.tsx), [pedidos/page.tsx](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/pedidos/page.tsx#L1836-L1863).
* **Onde se conecta:** `order_items`, `customer_stock_credits`.
* **Módulos que Dependem Dele:** MOD-03 (Kanban), MOD-08 (Saldos).
* **Critérios de Validação:**
  * Preservar saldo remanescente se `remaining_quantity > 0` (não forçar zero).
  * Exigir checkbox de conferência física antes de permitir a liberação.
  * Gravar `over_short_quantity` e marcar `adjustment_resolved: true`.

### MOD-08: Saldos e Créditos de Clientes
* **Responsabilidade:** Visualização e gestão centralizada de faltas a entregar (`+ Produzir`), excedentes enviados (`- Abater`), histórico completo de conferência da expedição (`order_balance_adjustments`), estoque personalizado guardado na fábrica e cancelamento/exclusão administrativa auditável de saldos.
* **Arquivos-Chave:** [saldos/page.tsx](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/pedidos/saldos/page.tsx), [api/admin/saldos/route.ts](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/api/admin/saldos/route.ts), [orders.ts](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/services/supabase_modules/orders.ts#L757-L1020), [supabase_saldos_creditos_fix.sql](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/supabase/supabase_saldos_creditos_fix.sql).
* **Onde se conecta:** Tabelas `customer_stock_credits`, `customer_product_stock`, `order_balance_adjustments`.
* **Módulos que Dependem Dele:** MOD-04 (Alerta de Produção), MOD-06 (Expedição).
* **Critérios de Validação:**
  * Exibição clara de Quantidade Original vs Saldo Disponível e padronização visual com `ProductionAlertModal` (vermelho para falta `+ Produzir`, verde para excedente `- Abater`).
  * Trava anti-Clichê e proteção anti-duplicidade em banco e serviço (`idx_customer_stock_credits_unique_source_adj`).
  * Cancelamento/Exclusão de saldo restrito estritamente a `Administrador` via `requireAdmin`.

### MOD-09: Financeiro - Contas e Conciliação
* **Responsabilidade:** Contas a receber, contas a pagar, controle de parcelas e status de pagamento de pedidos.
* **Arquivos-Chave:** [financeiro/page.tsx](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/financeiro/page.tsx), [orders.ts](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/services/supabase_modules/orders.ts).
* **Onde se conecta:** Tabelas `orders`, `financial_transactions`, Conta Azul.
* **Módulos que Dependem Dele:** MOD-03 (Kanban - trava de faturado).
* **Critérios de Validação:**
  * Totalizadores de receitas e despesas.
  * Atualização de parcelas pagas em pedidos.

### MOD-10: Clientes - Gestão e Busca
* **Responsabilidade:** Cadastro, edição, listagem, pesquisa assíncrona por CNPJ/Razão Social e controle de limites.
* **Arquivos-Chave:** [clientes/page.tsx](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/clientes/page.tsx), [customers.ts](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/services/supabase_modules/customers.ts).
* **Onde se conecta:** Tabela `customers`.
* **Módulos que Dependem Dele:** MOD-02 (Pedidos), MOD-08 (Saldos), MOD-09 (Financeiro).
* **Critérios de Validação:**
  * Validação de duplicidade de CNPJ/CPF.
  * Busca eficiente em dropdowns (`SearchableCustomerSelect.tsx`).

### MOD-11: Produtos e Catálogo Técnico
* **Responsabilidade:** Cadastro técnico de itens (sacolas, caixas, copos), facas de corte, medidas, matérias-primas, preços de tabela e fluxo de Transformação de Saco para Sacola com geração automática de card na etapa `Ir para Manuseio`.
* **Arquivos-Chave:** [produtos/page.tsx](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/produtos/page.tsx), [products.ts](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/services/supabase_modules/products.ts), [TransformSacoModal.tsx](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/components/modals/TransformSacoModal.tsx).
* **Onde se conecta:** Tabelas `products`, `product_categories`, `stock_transactions`, `orders`, `order_items`, `order_stages`.
* **Módulos que Dependem Dele:** MOD-02 (Itens de Pedido), MOD-04 (Alerta de Produção), MOD-05 (Equipes de Manuseio), MOD-08 (Saldos).
* **Critérios de Validação:**
  * Dimensões de medidas válidas.
  * Tipagem estrita de `product_id`.
  * Na saída de estoque de produtos com `SACO` no nome, perguntar se deseja transformar em Sacola, vinculando inteligentemente à Sacola correspondente, baixando o estoque do Saco (`SAIDA`), subindo o estoque da Sacola (`ENTRADA` com `[ITEM:<id>]`) e gerando o card na etapa `Ir para Manuseio` com o número escolhido.

### MOD-12: Fornecedores
* **Responsabilidade:** Cadastro de fornecedores de insumos (papel, cola, tintas, embalagens).
* **Arquivos-Chave:** [fornecedores/page.tsx](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/fornecedores/page.tsx).
* **Onde se conecta:** Tabela `suppliers`.
* **Módulos que Dependem Dele:** MOD-09 (Financeiro - Contas a Pagar).
* **Critérios de Validação:**
  * Cadastro e persistência no banco.

### MOD-13: Relatórios e Estatísticas
* **Responsabilidade:** Relatórios analíticos de produção, expedição, saldos acumulados e desempenho de operadores.
* **Arquivos-Chave:** [relatorios/page.tsx](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/relatorios/page.tsx).
* **Onde se conecta:** Agrega dados de `orders`, `order_items`, `customer_stock_credits`, `order_item_teams`.
* **Módulos que Dependem Dele:** Nenhum módulo operacional (é folha de saída).
* **Critérios de Validação:**
  * Carregamento de filtros sem travar renderização.
  * Precisão nos cálculos de totais e médias.

### MOD-14: Configurações, Setores e Logs
* **Responsabilidade:** Cadastro de setores de fábrica, máquinas, perfis de acesso e auditoria de logs.
* **Arquivos-Chave:** [configuracoes/page.tsx](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/configuracoes/page.tsx), rotas em `src/app/api/config/`.
* **Onde se conecta:** Tabelas `sectors`, `machines`, `system_logs`.
* **Módulos que Dependem Dele:** MOD-03 (Setores de Produção).
* **Critérios de Validação:**
  * Integridade estrutural das configurações.

### MOD-15: Integração Conta Azul
* **Responsabilidade:** Sincronização bidirecional de pedidos, clientes e lançamentos financeiros com a API do Conta Azul, busca manual direta por número do PV independente de janela de datas (`termo_busca`), trava anti-cron duplicado (12 min) e Circuit Breaker OAuth2/`END_TRIAL`.
* **Arquivos-Chave:** [conta_azul.ts](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/services/conta_azul.ts), [callback/route.ts](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/api/auth/conta-azul/callback/route.ts), rotas em [src/app/api/sync/](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/api/sync/), [vercel.json](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/vercel.json).
* **Onde se conecta:** Gateway OAuth2 v2 da Conta Azul (`login.contaazul.com/#/oauth/authorize` e `api-v2.contaazul.com/oauth/token`), API REST v2 (`api-v2.contaazul.com/v1`) e tabelas locais `orders`, `financial_transactions`, `system_monitoring_state`.
* **Módulos que Dependem Dele:** MOD-02 (Importação de Pedidos), MOD-09 (Financeiro), MOD-16 (Monitoramento).
* **Critérios de Validação:**
  * Renovação e integridade do token de autenticação com captura detalhada de status/corpo HTTP.
  * Importação manual por número do PV funcionando independente da data de emissão do pedido.
  * Validação de sincronismo sem sobrescrever dados manuais locais indevidamente.

### MOD-16: Central de Monitoramento, Telemetria Anti-Estouro e Governança
* **Responsabilidade:** Monitoramento híbrido em tempo real combinando 1 única chamada RPC SQL (`get_system_monitoring_telemetry`: disco, storage, MAU 30d, pool de conexões, cache hit) com integração server-only às APIs oficiais da Supabase (`Management API v1` para Plano Real Pro/Free, Compute, Add-ons, API Gateway 24h e auditoria da trava global de 2 projetos Free ativos + `Prometheus Metrics API` para RAM física, disco provisionado `/data` e bytes de rede da VM), Régua Dupla Padrão ("Pro Ativo -> Alvo Free"), Checklist Automático de 6 Pré-Requisitos e Calendário de Janela Ideal (1 a 2 dias antes da renovação) para Downgrade Pro -> Free, Radar Anti-Upgrade Pro nos 5 pilares gratuitos, guia didático `(i)` (`InfoHint`) em todos os indicadores, detector N+1 (`pg_stat_statements`), anatomia de tabelas/bloat/índices, saúde Conta Azul e playbooks corretivos em 1 clique. Acesso restrito exclusivamente a `junior.8350i@gmail.com`.
* **Arquivos-Chave:** [monitoramento/page.tsx](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/monitoramento/page.tsx), [InfoHint.tsx](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/monitoramento/InfoHint.tsx), [metricGuides.ts](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/monitoramento/metricGuides.ts), [monitoring.module.css](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/monitoramento/monitoring.module.css), [supabasePlatformClient.ts](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/lib/supabasePlatformClient.ts), [api/admin/monitoring/route.ts](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/api/admin/monitoring/route.ts), [serverAuth.ts](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/lib/serverAuth.ts), [supabase_monitoring_center.sql](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/supabase/supabase_monitoring_center.sql), [rollback_monitoring_center.sql](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/supabase/rollback_monitoring_center.sql).
* **Onde se conecta:** Catálogos internos do Postgres (`pg_stat_statements`, `pg_stat_activity`, `pg_stat_user_tables`, `pg_stat_user_indexes`, `auth.users`), tabelas `system_monitoring_state` (incluindo `billing_transition_config`) e `system_monitoring_snapshots` (`service_role` only), Supabase Management API v1 (`https://api.supabase.com/v1` via `SUPABASE_ACCESS_TOKEN` com cache de 10 min) e Supabase Prometheus Metrics API (`/analytics/endpoints/metrics` / `/customer/v1/privileged/metrics`).
* **Módulos que Dependem Dele:** Folha administrativa de observabilidade e governança (audita MOD-01 a MOD-15 sem interferir no fluxo operacional).
* **Critérios de Validação:**
  * Bloqueio estrito HTTP 403 e guard de interface para qualquer usuário diferente de `junior.8350i@gmail.com`.
  * Cache em memória de 60s para RPC SQL e 10 minutos para APIs externas da Supabase, com degradação elegante caso `SUPABASE_ACCESS_TOKEN` não esteja definida.
  * Régua Dupla Padrão calibrada nos limites do Plano Free (500 MB DB, 1 GB Storage, 5 GB Egress, 50.000 MAU) mesmo com Plano Pro ativo, mais auditoria automática dos 6 pré-requisitos de downgrade.
  * Execução segura dos playbooks de manutenção via `execute_monitoring_maintenance` e persistência do calendário do ciclo Pro via `SET_BILLING_CYCLE_DATE`.
  * Popover acessível `(i)` renderizado em portal sem corte de `overflow` e com receita explícita de código anti-Pro.

---

## 4. Registro Histórico de Checkups

| Data do Checkup | Módulos Auditados | Resultado Geral | Principais Observações |
| :--- | :--- | :--- | :--- |
| **2026-10-23** | MOD-01 até MOD-15 | APROVADO COM ÊXITO | Baseline inicial criada. Correções em MOD-04, MOD-06 e MOD-07 (Saldos e Créditos) validadas e 100% integradas. Zero erros no TypeScript e compilação Next.js estável. |
| **2026-10-29** | MOD-14, MOD-15 | APROVADO COM ÊXITO | Otimização anti-estouro de cotas Supabase: sincronização incremental rápida a cada 15 minutos (.github/workflows/sync-cron.yml), supressão de logs ruidosos, separação de catálogo diário (03:00) e trava de Page Visibility no monitor de status do banco. Puxar pedido manual (PV) 100% preservado. |
| **2026-10-29** | MOD-02 | APROVADO COM ÊXITO | Eliminação definitiva do gargalo N+1 em order_item_packaging (de 904 requisições por carregamento de página para 1 única requisição em lote com getOrderItemPackagingBulk). Redução de ~96,7% no tráfego de borda do Supabase. |
| **2026-10-30** | MOD-01, MOD-14, MOD-15, MOD-16 | APROVADO COM ÊXITO | Implementação da Central de Monitoramento, Telemetria Anti-Estouro e Governança (/monitoramento) exclusiva para junior.8350i@gmail.com, migração oficial do fluxo OAuth 2.0 Conta Azul v2 (login.contaazul.com/#/oauth/authorize e api-v2.contaazul.com/oauth/token + blindagem UUID de state no callback), índices anti-seq-scan em logs e sync_queue, Circuit Breaker OAuth + trava anti-cron duplicado (12 min), correção do cron diário (?mode=full) e busca direta de pedidos por número (termo_busca) sem restrição de data em getSaleIdByNumber. |
| **2026-10-30** | MOD-01, MOD-02, MOD-05, MOD-06, MOD-08 a MOD-12, MOD-14, MOD-15 | APROVADO COM ÊXITO | Eliminação total de Mocks ativos e camada Sandbox morta (M1-A e M2-A): desativação de push reverso simulado em conta_azul.ts e sync_queue.ts, higienização no banco de 110 pedidos, 81 clientes, 9 produtos com conta_azul_id falso ca_* e 198 logs simulados (com backup JSON prévio), remoção completa de isMockMode/arrays mock*/shouldFallbackToMock em todos os serviços, exclusão de supabase.ts.bak e blindagem requireAdmin + erro HTTP 500 real em /api/config/conta-azul. |
| **2026-10-30** | MOD-04, MOD-06, MOD-08 | APROVADO COM ÊXITO | Saneamento completo de Saldos & Créditos de Clientes: remoção dos 4 clones duplicados em customer_stock_credits, correção do PV-1832 (Clichê 422 un -> Sacola Parda 423 un), trava anti-Clichê e anti-duplicidade (banco + serviço), inclusão de PENDENCIA_ENTREGA na CHECK constraint de order_balance_adjustments, distinção explícita entre Sobra a Abater e Cortesia Gratuita (Brinde), padronização de cores/rótulos com ProductionAlertModal, correção do prefixo PV duplicado, habilitação da aba Histórico Completo da Expedição e endpoint/modal de Cancelar ou Excluir Saldo exclusivo para Administrador (/api/admin/saldos). |
| **2026-10-30** | MOD-16 | APROVADO COM ÊXITO | Evolução didática da Central de Monitoramento (/monitoramento): adição do ícone circular (i) (InfoHint + metricGuides) em todos os KPIs, gráficos, colunas de tabela e seções explicando o significado prático, polaridade ideal (Bom ser ALTO vs BAIXO vs ZERO), gatilho anti-estouro e receita de código/banco para permanecer no Plano Free sem pagar upgrade Pro, além do painel Radar Anti-Upgrade Pro com veredito explícito de ação nos 5 pilares gratuitos. |
| **2026-10-30** | MOD-16 | APROVADO COM ÊXITO | Integração direta com APIs oficiais da Supabase em /monitoramento (supabasePlatformClient.ts: Management API v1 para Plano Real, Org, Compute, Add-ons, API Gateway 24h e auditoria da cota global de 2 projetos Free ativos + Prometheus Metrics API para RAM física, disco /data e rede da VM + MAU 30d e billing_transition_config via RPC SQL), com backup prévio completo, Régua Dupla Padrão (Pro Ativo -> Alvo Free) e Checklist Automático de 6 Pré-Requisitos + Janela Ideal (1-2 dias pré-renovação) para retorno seguro ao Plano Free. |
| **2026-11-05** | MOD-01 a MOD-14, MOD-16 | APROVADO COM ÊXITO | Habilitação de barras de rolagem lateral (horizontal) e vertical visíveis no quadro Kanban de Pedidos & Vendas (`.kanban-board-scroll`, `.kanban-column-scroll` em `globals.css` e `pedidos/page.tsx`), criação do inventário permanente de 55 modais do sistema em `docs/MODALS_INVENTORY.md` e padronização de rolagem vertical (`maxHeight: 90vh`, `overflowY: auto`, `.modal-scroll`) em 100% dos 55 modais (33 em `src/components/` e 22 inline em `src/app/`), com backup integral prévio em `backup_20261105_pre_kanban_modals_scroll/`. |
| **2026-11-05** | MOD-02, MOD-03 | APROVADO COM ÊXITO | Implementação do Card Amarelo Fixo (`--warning-card-bg`, `getExpeditionUrgency` em `deadline_service.ts` e `pedidos/page.tsx`) para pedidos liberados cuja Data de Expedição esteja a 10 dias ou menos da entrega (ou atrasados) em qualquer etapa ativa do Kanban, além da criação do Guia de Escopo Cirúrgico e Pontos de Restauração Total/Parcial (`docs/SAFE_CHANGE_AND_ROLLBACK_GUIDE.md` + `scripts/restore-point.ps1`) e ponto de restauração dedicado `backup_20261105_pre_yellow_card_10d/`. |
| **2026-11-05** | MOD-05, MOD-11 | APROVADO COM ÊXITO | Implementação do fluxo de Transformar Sacos em Sacolas (`TransformSacoModal.tsx` e `produtos/page.tsx`): ao dar Saída em um produto com `SACO` no nome e confirmar movimentação, pergunta se deseja transformar em Sacola, preenche automaticamente nome/medida/quantidade, realiza busca inteligente pela Sacola correspondente no catálogo (com opção de escolha manual ou criação imediata), exige a escolha do número do Card/OP, transfere o estoque (`SAIDA` do Saco -> `ENTRADA` da Sacola com marcador de idempotência `[ITEM:<id>]`) e gera o card diretamente na etapa `Ir para Manuseio`, com ponto de restauração prévio `backup_20261105_pre_saco_to_sacola/`. |
| **2026-11-05** | MOD-02, MOD-03 | APROVADO COM ÊXITO | Correção cirúrgica da exibição das informações e especificações do pedido ao abrir o card (`DetailViewModal.tsx`, `DetailModal.tsx` e `pedidos/page.tsx`): unificação de `item.notes` + `order.notes` via `combineOrderNotes` (evitando que detalhes curtos do item no Conta Azul ocultem as especificações completas do pedido), ampliação de `extractOrderDetails` para reconhecer `Prazo de Produção:`, `Quant e cor da arte:`, `Autorizado Créditos:`, `OC / OC SAMPPEL / OC IKS`, `NF IKS` e `Emissão Nota:`, e adição do campo `Clichê` no modal de edição, com ponto de restauração prévio `backup_20261105_pre_order_details_fix/`. |
| **2026-11-05** | MOD-03 | APROVADO COM ÊXITO | Separação visual entre pedidos próximos da expedição e pedidos já atrasados (`globals.css` e `pedidos/page.tsx`): Card Amarelo Fixo (`--warning-card-bg`) exclusivo para pedidos faltando de 0 a 10 dias para expedição (`isNearExpedition && !isOverdue`), e Card Vermelho Piscando Suave (`.kanban-card-overdue-pulse`, ciclo tranquilo de `3.2s ease-in-out`) para pedidos liberados cuja Data de Expedição já passou (`isOverdue`), com ponto de restauração prévio `backup_20261105_pre_overdue_red_pulse/`. |
| **2026-11-05** | MOD-02, MOD-05, MOD-11 | APROVADO COM ÊXITO | Implementação da opção rastreável de "Desfazer Transformação (Saco -> Sacola)" diretamente dentro do card gerado em Pedidos (`DetailViewModal.tsx` e `TransformSacoModal.tsx`): gravação de tag estruturada `[SACO_TO_SACOLA|SACO_ID:...|SACOLA_ID:...|QTY:...]`, banner de rastreabilidade no card, estorno completo de estoque (`+ENTRADA` de volta ao Saco e `-SAIDA` na Sacola registrados no Extrato `stock_transactions` com motivo, responsável e data/hora) e arquivamento auditável do card na etapa `CANCELADOS` com trava anti-duplicidade `[TRANSFORMACAO_DESFEITA]`, além de correção visual do sinal `-` em vermelho para saídas no Extrato de Movimentações (`produtos/page.tsx`), com ponto de restauração prévio `backup_20261105_pre_undo_saco_to_sacola/`. |
