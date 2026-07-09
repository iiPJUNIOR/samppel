# Samppel — Manual de Identidade Visual do Sistema (Design Tokens)

> Este documento é a **fonte única de verdade** para todas as decisões visuais do Portal Samppel.
> Qualquer agente que edite código de interface **deve** seguir estas regras sem exceção.

---

## 1. Filosofia de Design

| Princípio | Descrição |
|---|---|
| **Light-first** | O tema claro é o padrão. O tema escuro existe como alternativa, não como protagonista. |
| **Corporativo e limpo** | Nada de gradientes chamativos, neon ou animações pesadas. Clareza, hierarquia e espaço. |
| **Dados respiram** | Espaçamento generoso entre linhas de tabela, entre cards, e entre seções. |
| **Profundidade com sombra** | A profundidade vem de sombras sutis e bordas finas, não de cores de fundo contrastantes. |
| **Consistência absoluta** | Cada botão, input, badge e card segue exatamente os mesmos tokens. |

---

## 2. Paleta de Cores — Design Tokens

### 2.1 Tema Claro (Padrão)

| Token | Valor | Uso |
|---|---|---|
| `--background` | `#F8FAFC` | Fundo geral de todas as telas (off-white suave, nunca branco puro) |
| `--surface` | `#FFFFFF` | Fundo de cards, painéis internos, modais (branco puro para profundidade) |
| `--surface-hover` | `#F1F5F9` | Fundo de hover em linhas de tabela, itens de lista |
| `--text` | `#0F172A` | Texto principal — grafite escuro, alta legibilidade |
| `--text-muted` | `#64748B` | Texto secundário — labels, legendas, timestamps |
| `--border` | `#E2E8F0` | Bordas de cards, tabelas, divisores |
| `--primary` | `#2563EB` | Azul corporativo — botões de ação principal, links, elementos ativos |
| `--primary-hover` | `#1D4ED8` | Hover do azul corporativo |
| `--primary-rgb` | `37, 99, 235` | RGB para box-shadow com opacidade |
| `--success` | `#16A34A` | Verde sutil para lucros, aprovações, status positivo |
| `--success-bg` | `#F0FDF4` | Background de badges/alertas de sucesso |
| `--warning` | `#D97706` | Âmbar para alertas e atenção |
| `--warning-bg` | `#FFFBEB` | Background de badges/alertas de warning |
| `--danger` | `#DC2626` | Vermelho discreto para erros, exclusões, saldos negativos |
| `--danger-bg` | `#FEF2F2` | Background de badges/alertas de erro |
| `--info` | `#0284C7` | Azul informativo para avisos neutros |
| `--info-bg` | `#F0F9FF` | Background de badges/alertas de info |
| `--sidebar-bg` | `#FFFFFF` | Sidebar em branco com borda à direita |
| `--sidebar-text` | `#0F172A` | Texto da sidebar |
| `--sidebar-text-muted` | `#64748B` | Texto secundário da sidebar |
| `--sidebar-active` | `#2563EB` | Cor do item ativo na sidebar |

### 2.2 Tema Escuro (Secundário)

| Token | Valor | Uso |
|---|---|---|
| `--background` | `#0F172A` | Fundo geral — cinza azulado escuro |
| `--surface` | `#1E293B` | Fundo de cards e painéis |
| `--surface-hover` | `#334155` | Hover em linhas de tabela |
| `--text` | `#F1F5F9` | Texto principal — cinza claro |
| `--text-muted` | `#94A3B8` | Texto secundário |
| `--border` | `#334155` | Bordas |
| `--primary` | `#3B82F6` | Azul mais brilhante no escuro |
| `--primary-hover` | `#2563EB` | Hover |
| `--primary-rgb` | `59, 130, 246` | RGB |
| `--sidebar-bg` | `#1E293B` | Sidebar escura |
| `--sidebar-text` | `#F1F5F9` | Texto da sidebar |
| `--sidebar-text-muted` | `#94A3B8` | Texto secundário sidebar |
| `--sidebar-active` | `#3B82F6` | Item ativo sidebar |

---

## 3. Tipografia

| Elemento | Fonte | Peso | Tamanho |
|---|---|---|---|
| **Corpo de texto** | `Geist Sans` / `Inter` | 400 | `0.875rem` (14px) |
| **Labels** | `Geist Sans` / `Inter` | 500 | `0.8125rem` (13px) |
| **Headings (h1)** | `Geist Sans` / `Inter` | 700 | `1.5rem` (24px) |
| **Headings (h2)** | `Geist Sans` / `Inter` | 600 | `1.25rem` (20px) |
| **Headings (h3)** | `Geist Sans` / `Inter` | 600 | `1rem` (16px) |
| **Monospace (dados)** | `Geist Mono` | 400 | `0.8125rem` (13px) |
| **Botões** | `Geist Sans` / `Inter` | 500 | `0.875rem` (14px) |

> **Regra**: Nunca usar `font-family` inline. Usar as variáveis `--font-sans` e `--font-mono`.

---

## 4. Espaçamento e Raios

| Token | Valor | Uso |
|---|---|---|
| `--radius-sm` | `6px` | Inputs, botões, badges |
| `--radius-md` | `8px` | Cards, painéis, tabelas |
| `--radius-lg` | `12px` | Modais, containers grandes |
| Padding de cards | `1.5rem` | Espaço interno consistente |
| Gap entre cards | `1.5rem` | Espaço entre elementos de grid |
| Padding de tabela th/td | `0.75rem 1rem` | Espaço interno de células |

---

## 5. Sombras

| Token | Valor |
|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)` |
| `--shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.07), 0 4px 6px -2px rgba(0,0,0,0.03)` |
| `--shadow-premium` | `0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.03)` |

> No tema escuro as sombras são mais opacas (×3 a ×5 no alpha).

---

## 6. Componentes — Regras de Estilo

### 6.1 Botões

| Variante | Fundo | Texto | Borda |
|---|---|---|---|
| **Primário** | `var(--primary)` | `#FFFFFF` | Nenhuma |
| **Secundário** | `transparent` | `var(--text)` | `1px solid var(--border)` |
| **Danger** | `var(--danger)` | `#FFFFFF` | Nenhuma |
| **Ghost** | `transparent` | `var(--text-muted)` | Nenhuma |

- Border-radius: `var(--radius-sm)` (6px)
- Padding: `0.625rem 1.25rem`
- Transição: `background-color 0.15s ease, transform 0.1s ease`
- Active: `transform: scale(0.98)`

### 6.2 Inputs

- Background: `var(--surface)`
- Border: `1px solid var(--border)`
- Border-radius: `var(--radius-sm)`
- Focus: `border-color: var(--primary)` + `box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.12)`
- **Nunca** usar `border: none` em inputs de formulários internos
- Autofill override: manter o hack webkit para forçar fundo transparente

### 6.3 Tabelas

- Container: `border: 1px solid var(--border)`, `border-radius: var(--radius-md)`
- Header: `background: var(--surface-hover)`, texto `uppercase`, `0.75rem`, `font-weight: 600`
- Linhas: hover com `var(--surface-hover)`
- Última linha: sem `border-bottom`
- **Linhas finas e limpas** — nunca usar bordas grossas ou cores de fundo alternadas pesadas

### 6.4 Cards

- Background: `var(--surface)` (branco puro no tema claro)
- Border: `1px solid var(--border)`
- Border-radius: `var(--radius-md)` (8px)
- Box-shadow: `var(--shadow-sm)`
- Hover: `var(--shadow-md)` (sem mudar borda/cor)
- Padding: `1.5rem`

### 6.5 Badges

- Border-radius: `9999px` (pill shape)
- Font-size: `0.75rem`
- Padding: `0.25rem 0.625rem`
- Cores: usar `var(--[status]-bg)` para fundo e `var(--[status])` para texto

### 6.6 Sidebar

- Fundo: `var(--sidebar-bg)` (branco no light, escuro no dark)
- Borda direita: `1px solid var(--border)`
- Item ativo: `background: var(--sidebar-active)`, `color: white`, sombra com primary-rgb
- Item hover: `background: var(--primary-hover)`, `color: white`
- Logo e marca no topo com separador via `border-bottom`

---

## 7. Tela de Login — Regras Específicas

A tela de login é a primeira impressão do sistema. Deve ser **corporativa, confiável e elegante**.

| Regra | Descrição |
|---|---|
| Layout | Duas colunas: esquerda com branding/ilustração, direita com formulário |
| Fundo esquerda | Gradiente sutil do azul corporativo `var(--primary)` |
| Fundo direita | Branco `var(--surface)` |
| Logo | Usar `/logo.png` do projeto — sempre presente |
| Inputs | Usar o padrão de `6.2` acima — bordas visíveis, focus com anel azul |
| Botão principal | Azul corporativo full-width, `var(--primary)`, text branco |
| Links secundários | Cor `var(--text-muted)`, hover `var(--primary)` |
| Sem animações pesadas | Sem blobs, gooey filters, SVG physics. Apenas `fadeIn` sutil |
| Eye toggle na senha | Sempre presente, cor `var(--text-muted)` |

---

## 8. Anti-Padrões (O Que NÃO Fazer)

| ❌ Não Fazer | ✅ Fazer |
|---|---|
| Usar branco puro (`#FFF`) como fundo geral | Usar `#F8FAFC` (off-white) |
| Gradientes neon ou cores vibrantes | Tons sóbrios e corporativos |
| Sombras pesadas (`box-shadow: 0 0 30px...`) | Sombras sutis conforme tokens |
| `border: none` em inputs | `1px solid var(--border)` com focus ring |
| Fontes inline (`font-family: 'Space Mono'...`) | `var(--font-sans)` / `var(--font-mono)` |
| Animações de parallax, blobs, gooey | `fadeIn` suave, transições de 150-200ms |
| Estilos via `style={{}}` inline para layout | Classes CSS com variáveis |
| Cores hardcoded (`#FF4757`, `#050505`) | Variáveis de design tokens |

---

## 9. Checklist de Revisão Visual

Antes de fazer merge de qualquer PR que toca interface:

- [ ] Usa variáveis de design tokens (nunca cores hardcoded)
- [ ] Inputs têm bordas visíveis e focus ring
- [ ] Botões seguem as variantes documentadas
- [ ] Espaçamento entre elementos é generoso e consistente
- [ ] Texto principal usa `var(--text)`, secundário usa `var(--text-muted)`
- [ ] Cards têm `border`, `border-radius`, e `shadow` dos tokens
- [ ] Tabelas usam linhas finas, header uppercase, hover sutil
- [ ] Funciona no tema claro E no tema escuro
- [ ] Sem `style={{}}` inline para layout/cores (aceitável apenas para posicionamento dinâmico)
- [ ] Sem fontes, cores ou sombras fora deste manual
