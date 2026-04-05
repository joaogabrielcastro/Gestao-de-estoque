import { Router } from "express";
import * as movements from "../services/movements.service";
import { asyncHandler } from "../utils/asyncHandler";

export const movementsRouter = Router();

movementsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const data = await movements.listMovements(req.query);
    res.json(data);
  })
);
