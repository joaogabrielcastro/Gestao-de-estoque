import { Router } from "express";
import * as reports from "../services/reports.service";
import { asyncHandler } from "../utils/asyncHandler";

export const reportsRouter = Router();

reportsRouter.get(
  "/stock.csv",
  asyncHandler(async (_req, res) => {
    const csv = await reports.reportStockCurrentCsv();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="estoque-atual.csv"');
    res.send("\uFEFF" + csv);
  })
);

reportsRouter.get(
  "/movements.csv",
  asyncHandler(async (_req, res) => {
    const csv = await reports.reportMovementsCsv();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="movimentacoes.csv"');
    res.send("\uFEFF" + csv);
  })
);

reportsRouter.get(
  "/stock-by-client.csv",
  asyncHandler(async (_req, res) => {
    const csv = await reports.reportStockByClientCsv();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="estoque-por-cliente.csv"');
    res.send("\uFEFF" + csv);
  })
);
