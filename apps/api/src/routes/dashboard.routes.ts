import { Router } from "express";
import { getDashboardSummary } from "../services/dashboard.service";
import { asyncHandler } from "../utils/asyncHandler";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const data = await getDashboardSummary(req.query);
    res.json(data);
  })
);
