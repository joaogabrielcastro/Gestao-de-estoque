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

2. API — copie `apps/api/.env.example` para `apps/api/.env` e ajuste `DATABASE_URL`, `PORT` (padrão `3011`) e `CORS_ORIGIN` (padrão `http://localhost:3000`). Sem `DATABASE_URL`, o Prisma falha com **P1012** ao rodar `db:push` / `migrate`.

3. Banco de dados:

   ```bash
   npm run db:push
   ```

   (ou `npm run db:migrate` após ajustar o nome da migration no fluxo interativo do Prisma.)

4. Popular dados de demonstração:

   ```bash
   npm run db:seed
   ```

5. Web — copie `apps/web/.env.example` para `apps/web/.env.local` se precisar mudar URLs. Padrões: `NEXT_PUBLIC_API_URL=http://localhost:3011/api` e `NEXT_PUBLIC_APP_URL=http://localhost:3000` (usado no QR da **folha de carga**).

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

## Roteiro para apresentação do piloto

1. Execute `npm run db:push && npm run db:seed`.
2. Suba API e Web (`npm run dev:api` e `npm run dev:web`).
3. Mostre o fluxo:
   - `Clientes` e `Produtos` (cadastros base)
   - `Entradas > Nova entrada` (registro de carga com NFs e setor)
   - `Estoque` (saldo atual por cliente/produto/setor)
   - `Saídas > Nova saída` (retirada com validação de estoque)
   - `Movimentações` (histórico entrada/saída)
   - `Relatórios` (download dos CSVs)
4. Para provar regra de negócio, tente retirar quantidade maior que o saldo e mostre o bloqueio de estoque negativo.
5. Em **Entradas**, abra **Folha / QR** para imprimir a “folha do pallet” (Ctrl+P → salvar PDF) e mostrar o QR que aponta para a mesma página.

## Marca / logo

O menu usa `apps/web/public/logo.svg` (referência AB em vermelho/preto). Para usar o arquivo oficial da empresa, substitua por `logo.png` (ou outro nome) e ajuste o `src` em `apps/web/components/Nav.tsx` e na folha de carga (`app/entradas/[id]/folha/page.tsx`).

## Pacotes

| Pacote | Descrição |
|--------|-----------|
| `packages/shared` | Schemas Zod compartilhados |
| `apps/api` | REST Express |
| `apps/web` | Interface Next.js |
