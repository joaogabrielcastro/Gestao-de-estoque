import { Router } from "express";
import { getCurrentStockSnapshot } from "../services/movements.service";
import { asyncHandler } from "../utils/asyncHandler";

export const stockRouter = Router();

stockRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const data = await getCurrentStockSnapshot(req.query);
    res.json(data);
  })
);
