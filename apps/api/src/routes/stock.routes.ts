import { Router } from "express";
import { getStockSnapshot } from "../services/stock.service";
import { asyncHandler } from "../utils/asyncHandler";

export const stockRouter = Router();

stockRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const data = await getStockSnapshot(req.query);
    res.json(data);
  })
);
