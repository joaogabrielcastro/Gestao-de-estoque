import { Router } from "express";
import { getCurrentStockSnapshot } from "../services/movements.service";
import { asyncHandler } from "../utils/asyncHandler";

export const stockRouter = Router();

stockRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const data = await getCurrentStockSnapshot();
    res.json(data);
  })
);
