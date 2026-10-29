---
name: system-checkup
description: Executa varredura de integridade e auditoria cruzada de funcionalidades na Samppel, registrando alterações, verificando quebras e alertando o usuário previamente sobre conflitos.
---

# Skill: Auditoria de Integridade e Checkup Contínuo (Samppel)

Esta skill estabelece o procedimento operacional padrão para realizar varreduras e checkups no sistema Samppel, garantindo que cada funcionalidade seja tratada separadamente, que novas funcionalidades sejam cadastradas, e que nenhuma alteração quebre outras partes do sistema.

---

## 1. Gatilhos de Ativação

Ative este protocolo sempre que o usuário solicitar:
* *"faça um checkup"*
* *"execute um check"*
* *"faça uma varredura"*
* *"verifique se está tudo ok"*
* *"auditoria do sistema"*

---

## 2. Regras Mandatórias de Operação

1. **Inclusão Obrigatória de Novas Funcionalidades:**
   * Sempre que uma funcionalidade nova for implementada, ela deve ser imediatamente cadastrada na [Matriz de Funcionalidades](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/docs/CHECKUP_MATRIX.md), recebendo um ID (`MOD-XX`), arquivos principais, dependências e critérios de teste.

2. **Validação Cruzada de Não-Regressão:**
   * Toda modificação em um módulo deve auditar ativamente os módulos listados em seu campo *"Módulos que Dependem Dele"* na matriz.

3. **Alerta Prévio com Opções (Regra Fundamental):**
   * Se qualquer quebra ou risco de efeito colateral for identificado, **o assistente deve SEMPRE avisar o usuário antes de tomar qualquer decisão ou modificar o código para 'tentar consertar'**.
   * O aviso deve apresentar claramente:
     * O que foi afetado e por quê.
     * Pelo menos 2 opções de solução com os prós e contras de cada uma.
     * Aguardar a decisão do usuário antes de prosseguir.

4. **Carimbo de Data e Log:**
   * Cada funcionalidade modificada deve ter sua data atualizada na coluna `Última Alteração` da matriz.
   * Ao finalizar o checkup, registre uma linha na tabela de histórico da matriz.

5. **Sem Emojis e com Links Clicáveis:**
   * Não utilize emojis no relatório ou código.
   * Todos os arquivos citados devem ter links clicáveis no formato `file:///...`.

---

## 3. Protocolo de Execução do Checkup (Passo a Passo)

### Passo 1: Verificação Técnica Automatizada
Execute o script de sanidade automatizada via terminal:
```bash
npm run checkup
```
Ou alternativamente:
```bash
npx tsc --noEmit
```
Confirme se o código compila sem erros estáticos de tipagem e sem quebras de módulos ou rotas.

### Passo 2: Mapeamento de Arquivos Modificados
Verifique quais arquivos foram tocados recentemente através do histórico do Git ou do contexto da sessão atual:
* Mapeie quais módulos (`MOD-01` a `MOD-XX`) foram afetados pelas mudanças.
* Atualize a coluna `Última Alteração` desses módulos em [docs/CHECKUP_MATRIX.md](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/docs/CHECKUP_MATRIX.md).

### Passo 3: Auditoria Lógica das Conexões Cruzadas
Para cada módulo alterado:
1. Abra o arquivo onde a mudança ocorreu.
2. Verifique se os dados que ele envia ou recebe continuam compatíveis com os módulos que dependem dele.
3. Se for detectada divergência de contrato, tipo ou comportamento:
   * **NÃO decida silenciosamente**.
   * Formule o alerta prévio para o usuário com as opções de resolução.

### Passo 4: Atualização da Matriz e Emissão do Relatório
1. Atualize a tabela em [docs/CHECKUP_MATRIX.md](file:///c:/Users/Paulo%20Junior/IDE%20Google/samppel/docs/CHECKUP_MATRIX.md).
2. Adicione a entrada na seção de histórico com a data e observações.
3. Apresente ao usuário o relatório consolidado no seguinte formato:

```markdown
### Relatório de Checkup do Sistema

#### 1. Status Geral: [APROVADO / ALERTA / REQUER DECISÃO]
Resumo executivo do estado do sistema e do teste técnico automatizado.

#### 2. Módulos Auditados
| ID | Módulo | Última Alteração | Status | Observação |
| :--- | :--- | :--- | :--- | :--- |
| MOD-XX | Nome do Módulo | YYYY-MM-DD | OK / ALERTA | Detalhe |

#### 3. Pontos de Atenção ou Decisões Requeridas (se houver)
Caso haja quebras, liste as opções de resolução para escolha do usuário.
```
