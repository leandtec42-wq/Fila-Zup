# Zup — Sistema de Gerenciamento de Filas e Eventos

Plataforma SaaS completa para empresas criarem eventos e administrarem filas
de atendimento em tempo real, com notificações reais pelo **WhatsApp Cloud
API (Meta)**, dashboard administrativo, métricas e gráficos.

> ⚠️ **Sobre este projeto**: todo o código foi escrito à mão, arquivo por
> arquivo, para ser completo e funcional — não há mocks, `TODO`s ou
> simulações nas partes centrais do sistema. A única coisa que este ambiente
> de desenvolvimento não conseguiu fazer sozinho foi **rodar `npm install`**,
> porque este sandbox não tem acesso à internet para baixar pacotes do npm.
> Isso significa que `npm run lint`, `npm test` e `npm run build` não
> puderam ser executados aqui — você vai rodá-los na sua máquina, no VS Code,
> seguindo o passo a passo abaixo (que é exatamente o que qualquer projeto
> Next.js normal exige). Veja também `PASSO_A_PASSO.txt` na raiz do projeto.

## Índice

1. [Stack tecnológica](#stack-tecnológica)
2. [Requisitos](#requisitos)
3. [Instalação](#instalação)
4. [Configuração do .env](#configuração-do-env)
5. [Banco de dados (MySQL)](#banco-de-dados-mysql)
6. [Prisma — migrations e seed](#prisma--migrations-e-seed)
7. [Executando localmente](#executando-localmente)
8. [Meta WhatsApp Cloud API](#meta-whatsapp-cloud-api)
9. [Estrutura do projeto](#estrutura-do-projeto)
10. [Arquitetura multi-tenant e segurança](#arquitetura-multi-tenant-e-segurança)
11. [Testes](#testes)
12. [Build e deploy em produção](#build-e-deploy-em-produção)
13. [Variáveis de ambiente](#variáveis-de-ambiente)
14. [Troubleshooting](#troubleshooting)

---

## Stack tecnológica

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Next.js Route Handlers (API Routes), TypeScript
- **Banco de dados**: MySQL 8+ (via Prisma ORM)
- **Autenticação**: NextAuth.js (Auth.js) com Credentials Provider + bcrypt
- **Gráficos**: Recharts
- **Validação**: Zod
- **Formulários**: React Hook Form + Zod
- **Atualização em tempo real**: SWR com polling curto e inteligente
- **WhatsApp**: Meta WhatsApp Cloud API (oficial — sem WhatsApp Web)
- **Testes**: Vitest

## Requisitos

- Node.js 18.18 ou superior (recomendado 20 LTS)
- npm 9+
- Um servidor **MySQL 8+** (local, Docker, PlanetScale, Railway, RDS, etc.)
- Uma conta no [Meta for Developers](https://developers.facebook.com/) para a
  integração de WhatsApp (opcional para rodar em modo desenvolvimento)

## Instalação

```bash
# 1. Extraia o projeto e entre na pasta
cd queue-saas

# 2. Instale as dependências
npm install
```

O `postinstall` já roda `prisma generate` automaticamente.

## Configuração do .env

```bash
cp .env.example .env
```

Abra o `.env` e preencha, no mínimo:

```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/queue_saas"
AUTH_SECRET="gere-com-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Gere um `AUTH_SECRET` forte com:

```bash
openssl rand -base64 32
```

As variáveis do WhatsApp (`META_WHATSAPP_*`) podem ficar em branco — o
sistema funciona em **modo desenvolvimento** (mensagens logadas no banco e no
console, sem envio real) até que você configure as credenciais reais. Veja o
guia completo em [`docs/WHATSAPP.md`](./docs/WHATSAPP.md).

## Banco de dados (MySQL)

Você pode usar qualquer MySQL 8+ compatível. Algumas opções:

**Opção A — MySQL local (Docker, recomendado para desenvolvimento):**

```bash
docker run --name zup-mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=queue_saas \
  -p 3306:3306 \
  -d mysql:8
```

Nesse caso, use no `.env`:

```env
DATABASE_URL="mysql://root:password@localhost:3306/queue_saas"
```

**Opção B — MySQL instalado nativamente na sua máquina:**

```bash
mysql -u root -p -e "CREATE DATABASE queue_saas CHARACTER SET utf8mb4;"
```

**Opção C — MySQL gerenciado na nuvem** (PlanetScale, Railway, AWS RDS,
Google Cloud SQL etc.): crie o banco no painel do provedor e copie a
connection string fornecida para `DATABASE_URL`.

## Prisma — migrations e seed

Você tem duas formas equivalentes de criar as tabelas no banco:

**Opção A — deixar o Prisma gerar e aplicar a migration (recomendado):**

Com o `DATABASE_URL` apontando para um banco MySQL acessível, rode:

```bash
# Cria as tabelas a partir do schema (gera a primeira migration)
npx prisma migrate dev --name init

# Popula o banco com dados de demonstração
npm run seed
```

**Opção B — usar o arquivo SQL já escrito (`database/schema.sql`):**

Se preferir criar as tabelas diretamente, sem passar pelo Prisma CLI, use o
script SQL pronto incluído no projeto — ele corresponde exatamente ao
`prisma/schema.prisma`:

```bash
mysql -u root -p < database/schema.sql

# Popula o banco com dados de demonstração
npm run seed
```

Depois de rodar o `schema.sql` diretamente, avise o Prisma que essa
"migration inicial" já foi aplicada (para ele não tentar recriá-la depois):

```bash
npx prisma migrate resolve --applied "0_init"
```

Isso cria:
- 1 usuário de demonstração
- 2 eventos de demonstração (um ativo, um pausado)
- ~70 participantes fictícios distribuídos entre os status da fila, com
  horários variados (suficiente para os gráficos aparecerem preenchidos)

**Credenciais de acesso da conta demo (apenas desenvolvimento):**

```
E-mail: demo@zup.com.br
Senha:  demo12345
```

> Nenhum dado real de pessoas foi usado — todos os nomes, e-mails e
> telefones do seed são fictícios.

Para inspecionar o banco visualmente:

```bash
npx prisma studio
```

## Executando localmente

```bash
npm run dev
```

Acesse http://localhost:3000. Você verá a landing page. Use as credenciais
demo para entrar em `/login`, ou crie uma conta nova em `/cadastro`.

## Meta WhatsApp Cloud API

O passo a passo completo (criar app no Meta, obter token, configurar
webhook, criar e aprovar templates) está em
[`docs/WHATSAPP.md`](./docs/WHATSAPP.md). Resumo rápido:

1. Crie um app tipo "Empresa" em https://developers.facebook.com/
2. Adicione o produto **WhatsApp** e copie o `Phone Number ID`
3. Gere um token de acesso permanente via **Usuário do Sistema**
4. Configure `META_WHATSAPP_ACCESS_TOKEN` e `META_WHATSAPP_PHONE_NUMBER_ID` no `.env`
5. Configure o webhook apontando para `/api/whatsapp/webhook` com o mesmo
   `META_WHATSAPP_VERIFY_TOKEN` do seu `.env`
6. Crie e aguarde a aprovação do template de mensagem

Enquanto isso não estiver configurado, o sistema funciona normalmente: as
mensagens ficam registradas com status `LOGGED_DEV_MODE` (visível na tela de
detalhes de cada participante) e o conteúdo aparece no console do servidor.

## Estrutura do projeto

```
zup/
├── prisma/
│   ├── schema.prisma        # Modelo de dados (User, Event, QueueEntry, QueueAction, WhatsAppMessage)
│   └── seed.ts               # Dados de demonstração
├── database/
│   └── schema.sql             # Script SQL equivalente ao schema.prisma (opção B de criação do banco)
├── docs/
│   └── WHATSAPP.md           # Passo a passo da integração Meta WhatsApp Cloud API
├── public/
│   └── logo.png               # Logo do Zup (favicon e cabeçalhos)
├── src/
│   ├── app/
│   │   ├── page.tsx                       # Landing page
│   │   ├── login/ | cadastro/             # Autenticação
│   │   ├── privacidade/                   # Política de privacidade (LGPD)
│   │   ├── fila/[slug]/                   # Página PÚBLICA de entrada na fila
│   │   ├── dashboard/                     # Painel administrativo (protegido)
│   │   │   ├── page.tsx                   # Dashboard principal (métricas globais)
│   │   │   ├── eventos/                   # Lista, criação e edição de eventos
│   │   │   │   └── [id]/fila|participantes|metricas
│   │   │   └── configuracoes/
│   │   └── api/                           # Todas as rotas de backend (Route Handlers)
│   ├── components/                        # Componentes de UI reutilizáveis
│   ├── lib/
│   │   ├── queue.ts        # Motor da fila: números sequenciais, chamar próximo, concorrência
│   │   ├── whatsapp.ts     # WhatsAppService — integração real com a Meta Cloud API
│   │   ├── metrics.ts      # Cálculo de métricas e séries para gráficos
│   │   ├── auth.ts         # Configuração do NextAuth
│   │   ├── phone.ts        # Normalização de telefone para E.164
│   │   ├── validations.ts  # Schemas Zod
│   │   ├── rate-limit.ts   # Rate limiting das rotas públicas
│   │   └── api-helpers.ts  # Autenticação, isolamento multi-tenant e tratamento de erros
│   └── middleware.ts        # Protege as rotas /dashboard/*
└── tests/                    # Testes automatizados (Vitest)
```

## Arquitetura multi-tenant e segurança

- Cada `User` (cliente) possui vários `Event`; cada `Event` possui várias
  `QueueEntry`.
- **Toda** rota administrativa chama `requireUser()` (401 se não
  autenticado) e `requireOwnedEvent(userId, eventId)` (404 se o evento não
  pertencer ao usuário) — ver `src/lib/api-helpers.ts`. Isso garante que um
  cliente nunca acesse ou modifique dados de outro, mesmo manipulando IDs
  manualmente nas requisições.
- Senhas são armazenadas com hash `bcrypt` (custo 12), nunca em texto puro.
- As rotas públicas (`/api/events/:id/queue/join`, `/api/public/*`) têm
  **rate limiting** (`src/lib/rate-limit.ts`) para mitigar spam.
- O número sequencial da fila é obtido por um **incremento atômico no
  banco** (`UPDATE ... lastQueueNumber = lastQueueNumber + 1` dentro de uma
  transação), o que impede que dois participantes recebam o mesmo número
  mesmo sob alta concorrência.
- O botão "Chamar próximo" usa **atualização condicional**
  (`updateMany` com `WHERE status = 'WAITING'`, checando `count === 1`) para
  garantir que dois administradores clicando ao mesmo tempo nunca chamem a
  mesma pessoa duas vezes.
- IDs públicos (`publicSlug` dos eventos, `id` das entradas na fila) são
  gerados com `crypto.randomBytes` / `cuid`, longos e não sequenciais —
  impossíveis de adivinhar.
- Dados pessoais nunca aparecem na tela pública da fila (só senha e
  posição). O administrador pode excluir (anonimizar) os dados de um
  participante a qualquer momento — mecanismo de LGPD.
- Cabeçalhos de segurança (`X-Frame-Options`, `X-Content-Type-Options`,
  etc.) configurados em `next.config.mjs`.

## Testes

```bash
npm test
```

Os testes cobrem (com mocks do Prisma, sem precisar de banco real):

- Normalização e validação de telefone para E.164
- Cálculo de métricas (tempo médio de espera/atendimento, taxas)
- Motor de fila: bloqueio de duplicidade, atribuição atômica de número
  sequencial, "chamar próximo" sob concorrência (garantindo que a mesma
  pessoa nunca seja chamada duas vezes)
- Isolamento multi-tenant (`requireOwnedEvent` retornando 404 para eventos
  de outro usuário)

## Build e deploy em produção

```bash
npm run lint
npm test
npm run build
npm start
```

### Deploy na Vercel

1. Suba o projeto para um repositório Git (GitHub/GitLab/Bitbucket).
2. Importe o repositório na [Vercel](https://vercel.com/new).
3. Configure as variáveis de ambiente do `.env.example` no painel da Vercel.
4. Use um MySQL gerenciado acessível pela internet (PlanetScale, Railway,
   AWS RDS, etc.) — `DATABASE_URL` precisa ser alcançável pela Vercel.
5. Antes do primeiro deploy (ou via um passo de build), rode as migrations
   em produção com:
   ```bash
   npx prisma migrate deploy
   ```
6. Configure o webhook do WhatsApp apontando para
   `https://SEU_DOMINIO.vercel.app/api/whatsapp/webhook`.

## Variáveis de ambiente

Veja `.env.example` para a lista completa e comentada. Resumo:

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | Sim | Connection string do MySQL |
| `AUTH_SECRET` | Sim | Segredo do NextAuth (JWT) |
| `NEXTAUTH_URL` | Sim | URL base da aplicação |
| `NEXT_PUBLIC_APP_URL` | Sim | URL pública usada para montar o link `/fila/[slug]` |
| `META_WHATSAPP_ACCESS_TOKEN` | Não* | Token da Graph API |
| `META_WHATSAPP_PHONE_NUMBER_ID` | Não* | ID do número de telefone no WhatsApp Business |
| `META_WHATSAPP_BUSINESS_ACCOUNT_ID` | Não | ID da conta WhatsApp Business (WABA) |
| `META_WHATSAPP_VERIFY_TOKEN` | Não* | Token de verificação do webhook |
| `META_WHATSAPP_TEMPLATE_NAME` / `_LANGUAGE` | Não | Template aprovado para primeiro contato |
| `RATE_LIMIT_WINDOW_SECONDS` / `RATE_LIMIT_MAX_REQUESTS` | Não | Ajuste fino do rate limiting |

\* Sem essas variáveis, o sistema roda em modo desenvolvimento (sem envio
real de WhatsApp, apenas log).

## Troubleshooting

| Problema | Solução |
|---|---|
| `Error: P1001: Can't reach database server` | Verifique se o MySQL está rodando e se `DATABASE_URL` está correto |
| `Error: connect ECONNREFUSED` no `prisma migrate dev` | O MySQL não está aceitando conexões na porta configurada — confira `docker ps` ou o serviço local |
| Login não funciona após `npm run seed` | Confirme que está usando exatamente `demo@zup.com.br` / `demo12345` |
| Mensagens de WhatsApp não chegam | Veja a seção de Troubleshooting em [`docs/WHATSAPP.md`](./docs/WHATSAPP.md) |
| `npx prisma migrate dev` pede para resetar o banco | Isso acontece se o schema mudou de forma incompatível com migrations existentes; em desenvolvimento, você pode aceitar o reset (todos os dados de teste serão recriados pelo seed) |
| Erro de tipos do NextAuth (`session.user.id` não existe) | Já resolvido via `src/types/next-auth.d.ts` — rode `npm install` novamente se o erro persistir |
| Build falha por falta de variáveis de ambiente | Garanta que todas as variáveis obrigatórias da tabela acima estão definidas antes de rodar `npm run build` |

---

Feito com Next.js, Prisma e a Meta WhatsApp Cloud API. 💜💚
