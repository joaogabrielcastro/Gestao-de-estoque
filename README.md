# Gestão de estoque

Monorepo npm com API **Express + Prisma + PostgreSQL** e frontend **Next.js (App Router) + Tailwind**. Pronto para ambiente de **produção** (rede interna ou hospedagem própria): configure variáveis de ambiente, use **migrations** versionadas em PRD e mantenha backup do Postgres.

## Pré-requisitos

- Node.js 20+
- PostgreSQL em execução

## Configuração

1. Na raiz do repositório:

   ```bash
   npm install
   ```

2. API — copie `apps/api/.env.example` para `apps/api/.env` e ajuste `DATABASE_URL`, `PORT` (padrão `3011`) e `CORS_ORIGIN` (padrão `http://localhost:3000`). Sem `DATABASE_URL`, o Prisma falha com **P1012** ao rodar `db:push` / `migrate`.

3. Banco de dados:

   ```bash
   npm run db:push
   ```

   Em produção, prefira:

   ```bash
   npm run db:migrate -w @gestao/api
   ```

   e no deploy: `prisma migrate deploy` (não use `db push` em PRD se você versionar migrations).

4. Popular dados de demonstração (opcional):

   ```bash
   npm run db:seed
   ```

5. Web — copie `apps/web/.env.example` para `apps/web/.env.local` se precisar mudar URLs. Padrões: `NEXT_PUBLIC_API_URL=http://localhost:3011/api` e `NEXT_PUBLIC_APP_URL=http://localhost:3000` (usado no QR da **folha de carga**).

### Busca global (opcional)

- API: `ENABLE_GLOBAL_SEARCH=true`
- Web: `NEXT_PUBLIC_ENABLE_GLOBAL_SEARCH=true`

Os dois devem estar alinhados; o menu **Busca** só aparece quando a variável pública está habilitada.

## Testes de integração (API)

Usam Postgres real. Crie um banco só para teste e exporte a URL antes de rodar:

```bash
set TEST_DATABASE_URL=postgresql://gestao:gestao@localhost:5432/gestao_estoque_test?schema=public
npm run db:push -w @gestao/api
npm run test:api
```

Sem `TEST_DATABASE_URL`, a suíte é **ignorada** (não falha o comando).

## Executar em desenvolvimento

Dois terminais:

```bash
npm run dev:api
```

```bash
npm run dev:web
```

- API: `http://localhost:3011/api/health`
- Web: `http://localhost:3000`

## Build de produção

```bash
npm run build
```

O build compila `@gestao/shared`, depois API e Web.

## Docker (PostgreSQL + API + Web)

Na raiz do repositório:

```bash
docker compose up --build
```

- Web: `http://localhost:3000`
- API: `http://localhost:3011/api` (health: `/api/health`)
- Postgres: `localhost:5432` (usuário `gestao`, senha `gestao`, banco `gestao_estoque`)

Na primeira subida, o container da API executa `prisma db push` automaticamente. Para produção, prefira migrations versionadas (`prisma migrate deploy`) em vez de `db push`.

O `docker-compose` define `API_URL=http://api:3011/api` na **web** para o Next.js (Server Components) chamar a API pela rede interna do Docker; no navegador continua valendo `NEXT_PUBLIC_API_URL=http://localhost:3011/api`.

Se o front for acessado por outro host (não `localhost`), reconstrua a web com o build-arg correto, porque `NEXT_PUBLIC_*` é embutido no build:

```bash
docker compose build --build-arg NEXT_PUBLIC_API_URL=https://seu-dominio/api web
```

No sistema web, o menu **Guia** (`/guia`) traz o passo a passo sugerido para a operação no barracão.

## Checklist de homologação

1. Execute `npm run db:push && npm run db:seed` (ou migrations + seed em ambiente de teste).
2. Suba API e Web (`npm run dev:api` e `npm run dev:web`).
3. Valide o fluxo:
   - `Clientes` e `Produtos` (cadastros base)
   - `Entradas > Nova entrada` (registro de carga com NFs e setor)
   - `Estoque` (saldo atual por cliente/produto/setor)
   - `Saídas > Nova saída` (retirada com validação de estoque)
   - `Movimentações` (histórico entrada/saída)
   - `Relatórios` (download dos CSVs)
4. Regra de negócio: tentativa de retirada acima do saldo deve retornar bloqueio de estoque negativo.
5. Em **Entradas**, abra **Folha / QR** para imprimir a folha (Ctrl+P → salvar PDF) e conferir o QR que aponta para a mesma página.

## Marca / logo

O menu usa `apps/web/public/logo.svg` (referência AB em vermelho/preto). Para usar o arquivo oficial da empresa, substitua por `logo.png` (ou outro nome) e ajuste o `src` em `apps/web/components/Nav.tsx` e na folha de carga (`app/entradas/[id]/folha/page.tsx`).

## Padrão arquitetural (API)

A API segue módulos com responsabilidades explícitas:

- `routes/*`: apenas mapeamento HTTP.
- `modules/<dominio>/*.controller.ts`: tradução de `req/res`.
- `modules/<dominio>/*.service.ts`: regras de negócio e orquestração.
- `modules/<dominio>/*.repository.ts` ou `repositories/*`: acesso ao Prisma/DB.

Schemas Zod compartilhados entre API e pacote único:

- `packages/shared` — validações de entrada/saída; a API importa `@gestao/shared` (sem cópia local de schemas).

Barrels de módulo:

- `apps/api/src/modules/<dominio>/index.ts`
- `apps/api/src/modules/index.ts`

## Pacotes

| Pacote | Descrição |
|--------|-----------|
| `packages/shared` | Schemas Zod compartilhados (fonte única) |
| `apps/api` | REST Express |
| `apps/web` | Interface Next.js |
