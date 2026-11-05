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

### Entrega B — Card Amarelo Fixo para Expedicoes Proximas (`<= 10 dias`)
- **Ponto de Restauracao Previo:** `backup_20261105_pre_yellow_card_10d`
- **O que foi alterado exclusivamente:**
  1. [`src/services/deadline_service.ts`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/services/deadline_service.ts#L162-L221): Criacao da funcao `getExpeditionUrgency` que calcula `daysRemaining`, `isNearExpedition` (`0 <= dias <= 10`) e `isOverdue` (`dias < 0`) para qualquer etapa ativa (ignorando `Concluido` e `CANCELADOS`).
  2. [`src/app/globals.css`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/globals.css#L1062-L1077): Adicao das variaveis `--warning-card-bg` (`#FEF9C3` no tema claro), `--warning-card-border`, `--warning-card-border-hover` e `--warning-card-shadow`.
  3. [`src/app/pedidos/page.tsx`](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/src/app/pedidos/page.tsx#L5623-L5720): Aplicacao condicional de `--warning-card-bg` e borda ambar nos cards liberados (`isReleased`) com `isNearExpedition || isOverdue`, mais selo `(Faltam Xd)` / `(Entrega Hoje)` na linha 6022.
- **Setores Blindados (Zero alteracao):** Calculo da data de expedicao (`calculateExpeditionDate`), botoes `DU`/`DC`, arrastar-e-soltar (drag & drop), filtros e modais de transicao permaneceram 100% intocados.

