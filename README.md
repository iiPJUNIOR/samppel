# Portal Samppel

**Portal Samppel** é um MVP real de sistema operacional comercial, de produção e expedição de embalagens personalizadas, totalmente estruturado e preparado para integração bidirecional em segundo plano com o **ERP Conta Azul**.

O sistema foi arquitetado focando em **segurança de credenciais**, **isolamento de camadas** (UI, negócios, banco e integrações), **multi-empresa (multi-tenant)** e **controle de acesso granular** (Administrador, Comercial, Produção e Financeiro).

---

## 🚀 Principais Módulos & Funcionalidades

1. **Dashboard Inteligente**: Indicadores de pedidos ativos, carregamento de produção e faturamento. Os cartões e gráficos se adaptam dinamicamente conforme o perfil conectado.
2. **Gestão de Pedidos Customizados**: Controle operacional completo contendo Cliente, Produto, Medidas de Embalagem, Tiragem total, Qtd. de Caixas, Frete, Observações de Layout, Setor de Produção e Anotações Internas.
3. **Filtros Operacionais**: Filtros refinados por cliente, vendedor, status, setor físico e datas.
4. **Verificação Dinâmica de Estoque**: Alerta visual imediato no cadastro de pedidos caso a tiragem solicitada exceda as unidades em estoque do produto.
5. **Conciliação Financeira Básica**: Fluxo de contas a pagar (despesas) e receber (receitas de vendas), com botão de conciliação manual que sinaliza e inicia a sincronização do título financeiro com a Conta Azul.
6. **Controle de Acesso Granular (Role Permissions)**:
   - **Administrador**: Acesso irrestrito a cadastros, logs, faturamento, conciliação e chaves de API.
   - **Comercial**: Criação e edição de pedidos, clientes, fornecedores e produtos (sem acesso a dados de conciliação ou chaves).
   - **Produção**: Acesso focado na linha de montagem. Pode alterar apenas o status e o setor físico do pedido (Impressão, Corte, Colagem, Expedição). Bloqueado para alterar preços ou dados cadastrais.
   - **Financeiro**: Acesso a faturamento, conciliação de contas e visualizações de pedidos. Bloqueado de alterar especificações técnicas de embalagens.

---

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js (App Router com TypeScript)
- **Banco & Auth**: Supabase (PostgreSQL relacional)
- **Deploy**: Vercel
- **Estilização**: Vanilla CSS / CSS Modules (Premium, responsivo, suporte automático a light/dark mode baseado em HSL)
- **Integração**: API REST Conta Azul com fluxo OAuth 2.0 seguro rodando 100% no servidor.

---

## 📁 Estrutura de Pastas do Projeto

```text
/samppel
├── supabase/
│   └── schema.sql                # Modelagem do Banco (DDL e Seed Data)
├── src/
│   ├── app/                      # Rotas e Páginas do Next.js (App Router)
│   │   ├── api/                  # Endpoints de API seguros (Backend)
│   │   │   ├── auth/             # Callback seguro do OAuth 2.0 da Conta Azul
│   │   │   └── sync/             # Cron de processamento de background
│   │   ├── dashboard/            # Indicadores e gráficos SVG
│   │   ├── pedidos/              # Listagem, cadastros e controle de produção
│   │   ├── clientes/             # Cadastro de clientes e integração
│   │   ├── fornecedores/         # Cadastro de fornecedores
│   │   ├── produtos/             # Cadastro de produtos e ajustes de estoque
│   │   ├── financeiro/           # Conciliação de receitas/despesas
│   │   ├── configuracoes/        # Gestão de credenciais da API e log feed
│   │   ├── layout.tsx            # Wrapper do layout da aplicação com Sidebar
│   │   ├── page.tsx              # Tela de Login com simulador de acessos
│   │   └── globals.css           # Design System (variáveis HSL, temas, botões)
│   ├── components/               # Componentes UI encapsulados
│   │   ├── Sidebar.tsx           # Menu de navegação reativo a permissões
│   │   └── Sidebar.module.css
│   ├── context/                  # Contexto de simulação de login/roles
│   │   └── AuthContext.tsx
│   ├── services/                 # Regras de negócio e comunicações externas
│   │   ├── supabase.ts           # Cliente Supabase & Camada de dados Mock
│   │   ├── conta_azul.ts         # Métodos da API REST e Renovação de Token
│   │   └── sync_queue.ts         # Executor de background com retries
│   └── types/                    # Tipagem TypeScript
```

---

## ⚙️ Configuração Local (Passo a Passo)

### 1. Clonar e Instalar Dependências
```bash
# Instalar pacotes necessários
npm install
```

### 2. Configurar o Banco no Supabase
1. Crie um projeto gratuito no [Supabase](https://supabase.com).
2. Acesse o painel do projeto, abra o **SQL Editor** e clique em **New Query**.
3. Copie todo o conteúdo do arquivo `supabase/schema.sql` deste repositório, cole no editor do Supabase e clique em **Run**.
   * *Isso criará todas as tabelas (clientes, produtos, pedidos, logs, fila), índices, relacionamentos de integridade e inserirá dados de demonstração (seed) para uso imediato.*

### 3. Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto (use o `.env.local.example` como base):

```ini
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-privada (ignora RLS no background)

# Conta Azul API Credentials
CONTA_AZUL_CLIENT_ID=seu_client_id_gerado_no_portal_dev
CONTA_AZUL_CLIENT_SECRET=seu_client_secret_gerado_no_portal_dev
CONTA_AZUL_REDIRECT_URI=http://localhost:3000/api/auth/conta-azul/callback

# URL do App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> [!TIP]
> **Modo Sandbox / Sem Chaves**: Se você executar o projeto sem fornecer as chaves reais ou mantendo os placeholders padrão, o Portal entrará automaticamente em **Modo Simulação**. Ele funcionará 100% de forma interativa usando dados fictícios locais (CRUD em memória), simulando chamadas da API da Conta Azul e registrando logs fictícios. Perfeito para testes offline rápidos!

### 4. Executar em Desenvolvimento
```bash
npm run dev
```
Abra o navegador em [http://localhost:3000](http://localhost:3000).

---

## 🔄 Fluxo de Sincronização em Segundo Plano (Background)

O Portal Samppel possui um mecanismo de fila resiliente a falhas temporárias na API da Conta Azul:
1. Toda alteração local de dados (criar cliente, atualizar status do pedido, conciliar financeiro) grava automaticamente um item na tabela `sync_queue` com o status `PENDING`.
2. A rota `/api/sync/cron` atua como o processador da fila. Ela deve ser chamada em segundo plano (ex: a cada 5 ou 10 minutos).
3. **Resolução de Dependências**: Se a fila tentar sincronizar um Pedido mas o Cliente vinculado ainda não foi sincronizado com o ERP, o processador detectará isso e sincronizará o Cliente primeiro, salvará seu ID da Conta Azul, e então prosseguirá com a sincronização do Pedido.
4. **Retry Exponencial**: Em caso de falha temporária (ex: rate limit ou queda da API externa), a fila incrementa o contador de tentativas e agenda o próximo retry com backoff exponencial ($2^{tentativa}$ minutos).

---

## ☁️ Publicação na Vercel & Domínio Próprio

### 1. Publicar na Vercel
1. Crie um projeto na [Vercel](https://vercel.com) apontando para este repositório.
2. Nas configurações do projeto, adicione todas as variáveis de ambiente detalhadas no arquivo `.env.local`.
   * *Certifique-se de atualizar `NEXT_PUBLIC_APP_URL` e `CONTA_AZUL_REDIRECT_URI` com a URL real gerada pela Vercel (ex: `https://samppel-operacional.vercel.app`).*
3. Clique em **Deploy**.

### 2. Configurar Cron Job de Background
Para rodar a sincronização automática em segundo plano na Vercel, adicione um arquivo `vercel.json` na raiz do projeto configurando a rota de sync:

```json
{
  "crons": [
    {
      "path": "/api/sync/cron",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

### 3. Transição para o Domínio Próprio da Cliente
Quando for migrar o sistema para o domínio definitivo da cliente (ex: `portal.samppel.com.br`):
1. **No painel da Vercel**: Adicione o domínio próprio nas configurações de *Domains* e aponte os registros CNAME/ANAME no seu provedor de DNS conforme instruções da Vercel.
2. **Nas variáveis de ambiente**:
   - Atualize `NEXT_PUBLIC_APP_URL` para `https://portal.samppel.com.br`.
   - Atualize `CONTA_AZUL_REDIRECT_URI` para `https://portal.samppel.com.br/api/auth/conta-azul/callback`.
3. **No painel de desenvolvedor do Conta Azul**:
   - Atualize a URL de redirecionamento cadastrada no seu aplicativo para corresponder à nova URL de callback.
