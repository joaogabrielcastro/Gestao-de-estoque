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

2. API — copie `apps/api/.env.example` para `apps/api/.env` e ajuste `DATABASE_URL`, `PORT` (padrão `4000`) e `CORS_ORIGIN` (padrão `http://localhost:3000`).

3. Banco de dados:

   ```bash
   npm run db:push
   ```

   (ou `npm run db:migrate` após ajustar o nome da migration no fluxo interativo do Prisma.)

4. Web — copie `apps/web/.env.example` para `apps/web/.env.local` se precisar mudar a URL da API. O padrão é `http://localhost:4000/api`.

## Executar em desenvolvimento

Dois terminais:

```bash
npm run dev:api
```

```bash
npm run dev:web
```

- API: `http://localhost:4000/api/health`
- Web: `http://localhost:3000`

## Build de produção

```bash
npm run build
```

## Pacotes

| Pacote | Descrição |
|--------|-----------|
| `packages/shared` | Schemas Zod compartilhados |
| `apps/api` | REST Express |
| `apps/web` | Interface Next.js |
