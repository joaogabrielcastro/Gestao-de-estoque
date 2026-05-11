-- Migração idempotente antes de `prisma db push` no Docker:
--   0) Remove tabela legada StockBalance (saldo vem só de StockMovement; evita --accept-data-loss).
--   1) String -> enum ReferenceType em StockMovement.
--   2) Índices Inbound / Outbound / StockMovement alinhados ao schema atual.
-- Em DB novo, DROP/ALTER no-op onde não aplicável.

BEGIN;

-- 0) Tabela removida do Prisma; manter no Postgres faz o db push exigir --accept-data-loss
DROP TABLE IF EXISTS "StockBalance" CASCADE;

-- 1) Enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'ReferenceType'
  ) THEN
    CREATE TYPE "ReferenceType" AS ENUM ('INBOUND', 'OUTBOUND');
  END IF;
END$$;

-- 2) Coluna ainda texto -> converte preservando dados
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'StockMovement'
      AND column_name = 'referenceType'
      AND data_type IN ('character varying', 'text')
  ) THEN
    EXECUTE
      'ALTER TABLE "StockMovement" ALTER COLUMN "referenceType" TYPE "ReferenceType" USING "referenceType"::"ReferenceType"';
  END IF;
END$$;

-- 3) Índices Inbound (só se a tabela existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Inbound'
  ) THEN
    EXECUTE 'DROP INDEX IF EXISTS "Inbound_clientId_idx"';
    EXECUTE
      'CREATE INDEX IF NOT EXISTS "Inbound_clientId_createdAt_idx" ON "Inbound" ("clientId", "createdAt")';
  END IF;
END$$;

-- 4) Índices Outbound
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'Outbound'
  ) THEN
    EXECUTE 'DROP INDEX IF EXISTS "Outbound_clientId_idx"';
    EXECUTE
      'CREATE INDEX IF NOT EXISTS "Outbound_clientId_withdrawalDate_idx" ON "Outbound" ("clientId", "withdrawalDate")';
  END IF;
END$$;

-- 5) Índice StockMovement (só se a tabela existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'StockMovement'
  ) THEN
    EXECUTE
      'CREATE INDEX IF NOT EXISTS "StockMovement_referenceType_referenceId_idx" ON "StockMovement" ("referenceType", "referenceId")';
  END IF;
END$$;

COMMIT;
