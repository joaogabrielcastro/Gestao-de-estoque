-- Migração manual aplicada quando o schema foi atualizado para:
--   1) StockMovement.referenceType: String -> enum ReferenceType (INBOUND|OUTBOUND)
--   2) Inbound:  index (clientId)              -> index (clientId, createdAt)
--   3) Outbound: index (clientId)              -> index (clientId, withdrawalDate)
--   4) StockMovement: novo index (referenceType, referenceId)
--
-- Em desenvolvimento, basta rodar:
--   npm run db:push -w @gestao/api
-- (Prisma vai aplicar tudo, dropando/recriando o que for necessário; em DBs zerados não importa.)
--
-- Em produção (com dados reais) NÃO rode db:push: aplique este SQL manualmente
-- via psql / cliente do seu provedor. Ele preserva os dados existentes.

BEGIN;

-- 1) Enum novo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'ReferenceType'
  ) THEN
    CREATE TYPE "ReferenceType" AS ENUM ('INBOUND', 'OUTBOUND');
  END IF;
END$$;

-- 2) Converte coluna existente preservando os valores
ALTER TABLE "StockMovement"
  ALTER COLUMN "referenceType" TYPE "ReferenceType"
  USING "referenceType"::"ReferenceType";

-- 3) Índices (drop dos antigos só se existirem; cria os novos só se ainda não existirem)
DROP INDEX IF EXISTS "Inbound_clientId_idx";
CREATE INDEX IF NOT EXISTS "Inbound_clientId_createdAt_idx"
  ON "Inbound" ("clientId", "createdAt");

DROP INDEX IF EXISTS "Outbound_clientId_idx";
CREATE INDEX IF NOT EXISTS "Outbound_clientId_withdrawalDate_idx"
  ON "Outbound" ("clientId", "withdrawalDate");

CREATE INDEX IF NOT EXISTS "StockMovement_referenceType_referenceId_idx"
  ON "StockMovement" ("referenceType", "referenceId");

COMMIT;
