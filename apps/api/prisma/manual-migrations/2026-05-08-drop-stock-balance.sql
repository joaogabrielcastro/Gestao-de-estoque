-- Migração manual: remove a tabela `StockBalance`.
--
-- Contexto: o saldo agora é DERIVADO de StockMovement (SUM ENTRADA − SUM SAIDA
-- por cliente/produto/setor/unidade). Toda leitura é on-the-fly. Não há mais
-- cache para divergir, e o endpoint POST /stock/recalc também foi removido.
--
-- Em desenvolvimento, basta:
--   npm run db:push -w @gestao/api
-- (Prisma vai dropar a tabela; em DB com seed, o seed atualizado já não usa.)
--
-- Em produção (DB com dados reais), aplique este SQL antes de subir o código novo:

BEGIN;

DROP TABLE IF EXISTS "StockBalance";

COMMIT;
