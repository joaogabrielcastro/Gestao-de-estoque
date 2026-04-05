import { Router } from "express";
import { getDashboardSummary } from "../services/dashboard.service";
import { asyncHandler } from "../utils/asyncHandler";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    const data = await getDashboardSummary();
    res.json(data);
  })
);
