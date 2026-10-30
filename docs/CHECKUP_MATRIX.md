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
| **MOD-01** | Autenticação, Usuários e Perfis | `src/app/page.tsx`, `AuthContext.tsx`, `profiles.ts`, `AppGuard.tsx`, `Sidebar.tsx` | 2026-10-30 | OK |
| **MOD-02** | Pedidos: Criação, Edição e Itens | `src/app/pedidos/page.tsx`, `orders.ts` | 2026-10-29 | OK |
| **MOD-03** | Pedidos: Kanban e Transição de Etapas | `src/app/pedidos/page.tsx` (`moveOrderItemToStage`) | 2026-10-27 | OK |
| **MOD-04** | Pedidos: Alerta de Produção & Abatimento | `ProductionAlertModal.tsx`, `pedidos/page.tsx` | 2026-10-23 | OK |
| **MOD-05** | Pedidos: Equipes de Manuseio | `HandlingTeamModal.tsx`, `orders.ts` | 2026-10-21 | OK |
| **MOD-06** | Pedidos: Expedição, Sobras/Faltas e Frete | `ExpeditionTransitionModal.tsx`, `orders.ts` | 2026-10-23 | OK |
| **MOD-07** | Pedidos: Conferência Física na Expedição | `ConferencyModal.tsx`, `pedidos/page.tsx` | 2026-10-23 | OK |
| **MOD-08** | Saldos e Créditos de Clientes | `src/app/pedidos/saldos/page.tsx`, `orders.ts` | 2026-10-23 | OK |
| **MOD-09** | Financeiro: Contas e Conciliação | `src/app/financeiro/page.tsx`, `orders.ts` | 2026-10-18 | OK |
| **MOD-10** | Clientes: Gestão e Busca | `src/app/clientes/page.tsx`, `customers.ts` | 2026-10-17 | OK |
| **MOD-11** | Produtos e Catálogo Técnico | `src/app/produtos/page.tsx`, `products.ts` | 2026-10-17 | OK |
| **MOD-12** | Fornecedores | `src/app/fornecedores/page.tsx` | 2026-10-15 | OK |
| **MOD-13** | Relatórios e Estatísticas | `src/app/relatorios/page.tsx` | 2026-10-19 | OK |
| **MOD-14** | Configurações, Setores e Logs | `src/app/configuracoes/page.tsx`, `DatabaseStatusBanner.tsx`, `logs/` | 2026-10-30 | OK |
| **MOD-15** | Integração Conta Azul | `src/services/conta_azul.ts`, rotas em `api/sync/`, `.github/workflows/`, `vercel.json` | 2026-10-30 | OK |
| **MOD-16** | Central de Monitoramento, Telemetria Anti-Estouro e Governança | `src/app/monitoramento/page.tsx`, `src/app/api/admin/monitoring/route.ts`, `supabase/supabase_monitoring_center.sql` | 2026-10-30 | OK |

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
* **Responsabilidade:** Visualização e gestão centralizada de créditos de falta, cortesias de sobras e estoque de personalizados por cliente/produto.
* **Arquivos-Chave:** [saldos/page.tsx](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/pedidos/saldos/page.tsx), [orders.ts](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/services/supabase_modules/orders.ts#L1535-L1620).
* **Onde se conecta:** Tabelas `customer_stock_credits`, `customer_product_stock`, `order_balance_adjustments`.
* **Módulos que Dependem Dele:** MOD-04 (Alerta de Produção), MOD-06 (Expedição).
* **Critérios de Validação:**
  * Exibição clara de Quantidade Original vs Saldo Disponível.
  * Filtros por cliente e produto.
  * Permissão restrita a Administrador e Supervisão Comercial.

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
* **Responsabilidade:** Cadastro técnico de itens (sacolas, caixas, copos), facas de corte, medidas, matérias-primas e preços de tabela.
* **Arquivos-Chave:** [produtos/page.tsx](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/produtos/page.tsx), [products.ts](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/services/supabase_modules/products.ts).
* **Onde se conecta:** Tabelas `products`, `product_categories`.
* **Módulos que Dependem Dele:** MOD-02 (Itens de Pedido), MOD-04 (Alerta de Produção), MOD-08 (Saldos).
* **Critérios de Validação:**
  * Dimensões de medidas válidas.
  * Tipagem estrita de `product_id`.

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
* **Responsabilidade:** Monitoramento consolidado em 1 única chamada RPC (`get_system_monitoring_telemetry`) de consumo Supabase (disco, storage, pool de conexões, cache hit), detector N+1 (`pg_stat_statements` com linha de base resetável), anatomia de tabelas/bloat/índices, saúde OAuth/Crons/Filas Conta Azul, governança de segurança (validade PAT `04/01/2027`, RLS, sessões Auth, sanity checks operacionais) e playbooks corretivos em 1 clique. Acesso restrito exclusivamente a `junior.8350i@gmail.com`.
* **Arquivos-Chave:** [monitoramento/page.tsx](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/monitoramento/page.tsx), [monitoring.module.css](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/monitoramento/monitoring.module.css), [api/admin/monitoring/route.ts](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/api/admin/monitoring/route.ts), [serverAuth.ts](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/lib/serverAuth.ts), [supabase_monitoring_center.sql](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/supabase/supabase_monitoring_center.sql), [rollback_monitoring_center.sql](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/supabase/rollback_monitoring_center.sql).
* **Onde se conecta:** Catálogos internos do Postgres (`pg_stat_statements`, `pg_stat_activity`, `pg_stat_user_tables`, `pg_stat_user_indexes`), tabelas `system_monitoring_state` e `system_monitoring_snapshots` (`service_role` only).
* **Módulos que Dependem Dele:** Folha administrativa de observabilidade e governança (audita MOD-01 a MOD-15 sem interferir no fluxo operacional).
* **Critérios de Validação:**
  * Bloqueio estrito HTTP 403 e guard de interface para qualquer usuário diferente de `junior.8350i@gmail.com`.
  * Cache em memória de 60s e zero polling oculto em background (auto-consumo nulo).
  * Execução segura dos playbooks de manutenção via `execute_monitoring_maintenance`.

---

## 4. Registro Histórico de Checkups

| Data do Checkup | Módulos Auditados | Resultado Geral | Principais Observações |
| :--- | :--- | :--- | :--- |
| **2026-10-23** | MOD-01 até MOD-15 | APROVADO COM ÊXITO | Baseline inicial criada. Correções em MOD-04, MOD-06 e MOD-07 (Saldos e Créditos) validadas e 100% integradas. Zero erros no TypeScript e compilação Next.js estável. |
| **2026-10-29** | MOD-14, MOD-15 | APROVADO COM ÊXITO | Otimização anti-estouro de cotas Supabase: sincronização incremental rápida a cada 15 minutos (.github/workflows/sync-cron.yml), supressão de logs ruidosos, separação de catálogo diário (03:00) e trava de Page Visibility no monitor de status do banco. Puxar pedido manual (PV) 100% preservado. |
| **2026-10-29** | MOD-02 | APROVADO COM ÊXITO | Eliminação definitiva do gargalo N+1 em order_item_packaging (de 904 requisições por carregamento de página para 1 única requisição em lote com getOrderItemPackagingBulk). Redução de ~96,7% no tráfego de borda do Supabase. |
| **2026-10-30** | MOD-01, MOD-14, MOD-15, MOD-16 | APROVADO COM ÊXITO | Implementação da Central de Monitoramento, Telemetria Anti-Estouro e Governança (/monitoramento) exclusiva para junior.8350i@gmail.com, migração oficial do fluxo OAuth 2.0 Conta Azul v2 (login.contaazul.com/#/oauth/authorize e api-v2.contaazul.com/oauth/token + blindagem UUID de state no callback), índices anti-seq-scan em logs e sync_queue, Circuit Breaker OAuth + trava anti-cron duplicado (12 min), correção do cron diário (?mode=full) e busca direta de pedidos por número (termo_busca) sem restrição de data em getSaleIdByNumber. |
