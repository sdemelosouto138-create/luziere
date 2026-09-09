# Luzière — Sistema de Gestão de Vendas

Sistema interno (usuário único) para gestão de vendas de artigos de iluminação da **Luzière**: cadastro de produtos com fotos, catálogo visual para mostrar ao cliente, clientes, orçamentos/pedidos com geração de PDF, controle de estoque com histórico, relatórios e dashboard.

Interface 100% em português, moeda em R$ e datas em dd/mm/aaaa. Funciona no computador e no celular (menu inferior no mobile).

## Stack

- **Next.js 16** (App Router) + TypeScript + React 19
- **Tailwind CSS v4** + **shadcn/ui** (Radix)
- **PostgreSQL** via **Prisma ORM 7** (driver adapter `@prisma/adapter-pg`)
- Autenticação de usuário único: senha (hash scrypt) em variável de ambiente, sessão em cookie `httpOnly` assinado (JWT via `jose`)
- PDF do orçamento: `@react-pdf/renderer` (roda em serverless sem Chromium)
- Imagens de produto: **Vercel Blob** em produção; pasta `public/uploads` em desenvolvimento
- Gráficos: Recharts

> **Sobre o banco:** o Prisma 7 exige Postgres também em desenvolvimento (não usa mais SQLite via `url` no schema). Para não precisar instalar nada, use o `npx prisma dev`, que sobe um Postgres local temporário. Em produção, use Neon ou Supabase.

## Rodando localmente

### 1. Instalar dependências

```bash
cd luziere
npm install
```

### 2. Configurar variáveis de ambiente

Copie o exemplo e edite:

```bash
cp .env.example .env
```

(No PowerShell do Windows: `copy .env.example .env`)

Variáveis:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão do PostgreSQL |
| `ADMIN_USER` | Nome de usuário do login (ex.: `admin`) |
| `ADMIN_PASSWORD_HASH` | Hash da senha (gere com o comando abaixo) |
| `SESSION_SECRET` | String longa e aleatória para assinar o cookie de sessão |
| `BLOB_READ_WRITE_TOKEN` | Token do Vercel Blob (só em produção; deixe vazio em dev) |
| `LOJA_NOME`, `LOJA_TELEFONE`, `LOJA_EMAIL`, `LOJA_ENDERECO`, `LOJA_CNPJ` | Dados da loja impressos no PDF do orçamento |

Gerar o hash da senha:

```bash
npm run senha:hash -- "sua-senha-aqui"
```

Copie a linha `ADMIN_PASSWORD_HASH="..."` que aparecer para o `.env`.

### 3. Subir um Postgres local (sem instalar nada)

Em um terminal separado, deixe rodando:

```bash
npx prisma dev
```

Ele imprime uma `DATABASE_URL` (algo como `postgres://postgres:postgres@localhost:51214/template1?...`). Cole essa URL no `.env`.

> Alternativa: crie um banco gratuito no [Neon](https://neon.tech) e use a connection string dele já em desenvolvimento. Funciona igual.

### 4. Criar as tabelas e popular com dados de exemplo

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

O seed cria 9 categorias, 15 produtos, 3 clientes e 2 pedidos (1 orçamento e 1 aprovado).

### 5. Rodar o sistema

```bash
npm run dev
```

Acesse http://localhost:3000 e entre com o usuário/senha configurados.

Para ver os dados direto no banco: `npm run db:studio`.

## Deploy na Vercel + Neon (passo a passo)

### 1. Banco de dados (Neon)

1. Crie uma conta em https://neon.tech e um projeto novo (região mais próxima, ex.: São Paulo).
2. Copie a **connection string** (formato `postgresql://usuario:senha@host/neondb?sslmode=require`).

### 2. Código no GitHub

1. Crie um repositório no GitHub e envie a pasta `luziere`:

```bash
git init && git add . && git commit -m "Luzière: sistema de gestão de vendas"
```

```bash
git remote add origin https://github.com/SEU-USUARIO/luziere.git && git push -u origin main
```

### 3. Projeto na Vercel

1. Em https://vercel.com, clique em **Add New → Project** e importe o repositório.
2. Em **Environment Variables**, adicione todas as variáveis do `.env.example`:
   - `DATABASE_URL` = connection string do Neon
   - `ADMIN_USER`, `ADMIN_PASSWORD_HASH` (gere com `npm run senha:hash`), `SESSION_SECRET` (uma string longa aleatória)
   - `LOJA_NOME`, `LOJA_TELEFONE`, `LOJA_EMAIL`, `LOJA_ENDERECO`, `LOJA_CNPJ`
3. Clique em **Deploy**.

O comando de build (`prisma generate && prisma migrate deploy && next build`) já cria as tabelas no Neon automaticamente no primeiro deploy.

> **Neon e migrações:** a `DATABASE_URL` do Neon é a URL do *pooler*. As migrações precisam de conexão direta, então o `prisma.config.ts` deriva sozinho a URL direta (remove `-pooler` do host). Se usar outro provedor com pooler (ex.: Supabase), defina `DIRECT_URL` com a URL direta.

> **Dica:** evite rodar `npm run build` localmente enquanto o `npx prisma dev` estiver ativo — o `migrate deploy` pode derrubar as conexões do Postgres embutido. Se acontecer, rode `npx prisma dev stop default` e suba de novo com `npx prisma dev`.

### 4. Armazenamento de imagens (Vercel Blob)

1. No projeto da Vercel, vá em **Storage → Create Database → Blob** e crie um store.
2. A Vercel adiciona sozinha a variável `BLOB_READ_WRITE_TOKEN` ao projeto.
3. Faça um novo deploy (**Deployments → Redeploy**). A partir daí, as fotos de produto vão para o Blob.

Funciona com store **público** (URL direta do Blob) ou **privado** (o app serve a imagem em `/api/imagens/...`, lendo com o token). Para checar a configuração em produção, abra `/api/upload` logado: ele responde `blobConfigurado: true/false`. Se a variável aparecer na Vercel mas o upload reclamar que está vazia, edite-a e cole o token do store (aba *Quickstart* do store, começa com `vercel_blob_rw_`).

### 5. Dados de exemplo em produção (opcional)

Para popular o banco de produção com os dados de exemplo, rode localmente apontando para o Neon:

```bash
DATABASE_URL="postgresql://...neon..." npm run db:seed
```

(No PowerShell: `$env:DATABASE_URL="postgresql://..."; npm run db:seed`)

### 6. Acessar

A Vercel gera um link (`https://luziere-xxx.vercel.app`). Abra no computador ou no celular e faça login. Você pode adicionar um domínio próprio em **Settings → Domains**.

## Logo e marca

- `public/logo-simbolo-escuro.png` — símbolo em fundo grafite (sidebar e tela de login).
- `public/logo-simbolo-claro.png` — símbolo em fundo creme (cabeçalho do PDF).
- `brand/moodboard.png` e `brand/logo-horizontal-claro.png` — material de referência da marca (não é servido pelo site).

O wordmark "Luzière" é renderizado em tipografia (Playfair Display) ao lado do símbolo. Para trocar a logo, substitua os PNGs mantendo os nomes; se tiver a versão em SVG com fundo transparente, troque as referências em `src/components/layout/sidebar.tsx`, `src/app/(auth)/login/page.tsx` e `src/components/pdf/orcamento-pdf.tsx` (o PDF aceita PNG/JPG, não SVG).

## Estrutura de pastas

```
luziere/
├── prisma/
│   ├── schema.prisma          # modelos do banco
│   ├── migrations/            # migrações SQL
│   └── seed.ts                # dados de exemplo
├── prisma.config.ts           # configuração do CLI do Prisma
├── scripts/gerar-hash-senha.ts
├── src/
│   ├── proxy.ts               # proteção de rotas (ex-middleware)
│   ├── app/
│   │   ├── (auth)/login/      # tela de login
│   │   ├── (app)/             # rotas protegidas com sidebar
│   │   │   ├── dashboard/  produtos/  catalogo/  clientes/
│   │   │   ├── pedidos/  estoque/  relatorios/
│   │   └── api/               # rotas de API (produtos, clientes, pedidos, estoque, relatorios, upload, auth)
│   ├── components/
│   │   ├── ui/                # shadcn/ui
│   │   ├── layout/            # sidebar e menu mobile
│   │   ├── produtos/ clientes/ pedidos/ dashboard/
│   │   └── pdf/orcamento-pdf.tsx
│   ├── lib/
│   │   ├── prisma.ts          # cliente Prisma (singleton)
│   │   ├── auth.ts            # hash de senha e sessão
│   │   ├── format.ts          # R$ e datas em pt-BR
│   │   ├── pedido.ts          # cálculo de totais
│   │   ├── storage.ts         # upload (Blob ou pasta local)
│   │   ├── fornecedores/      # cadastro de fornecedores (vinculados aos produtos)
│   │   ├── validations/       # schemas zod
│   │   └── fonts/             # fontes do PDF
│   └── generated/prisma/      # cliente gerado (não versionar)
└── public/uploads/            # imagens em dev (não versionar)
```

## Regras de negócio

- **Status do pedido:** `Orçamento → Aprovado → Concluído`, e `Cancelado` a partir de qualquer um.
- **Estoque:** a baixa acontece ao **aprovar**; cancelar um pedido aprovado/concluído devolve os itens ao estoque. Tudo fica registrado no histórico de movimentações.
- **Edição de pedido:** itens só podem ser editados enquanto o status é Orçamento.
- **Exclusão de produto:** se o produto já estiver em algum pedido, ele é apenas desativado (some das listas, mas o histórico é preservado).
- **Relatórios e dashboard:** consideram vendas apenas pedidos Aprovados e Concluídos. Lucro estimado = (itens − desconto) − custo dos produtos.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build e execução em produção |
| `npm run db:local` | Sobe um Postgres local (`prisma dev`) |
| `npm run db:migrate` | Cria/aplica migrações em dev |
| `npm run db:seed` | Popula dados de exemplo |
| `npm run db:studio` | Abre o Prisma Studio |
| `npm run senha:hash -- "senha"` | Gera o hash para `ADMIN_PASSWORD_HASH` |
