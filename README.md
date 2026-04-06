# Gestão de estoque (piloto)

Monorepo npm com API **Express + Prisma + PostgreSQL** e frontend **Next.js (App Router) + Tailwind**.

## Pré-requisitos

- Node.js 20+
- PostgreSQL em execução

## Configuração

1. Na raiz do repositório:

   ```bash
   npm install
   ```

2. API — copie `apps/api/.env.example` para `apps/api/.env` e ajuste `DATABASE_URL`, `PORT` (padrão `3011`) e `CORS_ORIGIN` (padrão `http://localhost:3000`).

3. Banco de dados:

   ```bash
   npm run db:push
   ```

   (ou `npm run db:migrate` após ajustar o nome da migration no fluxo interativo do Prisma.)

4. Web — copie `apps/web/.env.example` para `apps/web/.env.local` se precisar mudar a URL da API. O padrão é `http://localhost:3011/api`.

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

## Docker (PostgreSQL + API + Web)

Na raiz do repositório:

```bash
docker compose up --build
```

- Web: `http://localhost:3000`
- API: `http://localhost:3011/api` (health: `/api/health`)
- Postgres: `localhost:5432` (usuário `gestao`, senha `gestao`, banco `gestao_estoque`)

Na primeira subida, o container da API executa `prisma db push` automaticamente. Para produção, prefira migrations versionadas (`prisma migrate deploy`) em vez de `db push`.

Se o front for acessado por outro host (não `localhost`), reconstrua a web com o build-arg correto, porque `NEXT_PUBLIC_*` é embutido no build:

```bash
docker compose build --build-arg NEXT_PUBLIC_API_URL=https://seu-dominio/api web
```

## Pacotes

| Pacote | Descrição |
|--------|-----------|
| `packages/shared` | Schemas Zod compartilhados |
| `apps/api` | REST Express |
| `apps/web` | Interface Next.js |
