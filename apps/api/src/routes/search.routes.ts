import { Router } from "express";
import { globalSearch } from "../services/search.service";
import { asyncHandler } from "../utils/asyncHandler";

export const searchRouter = Router();

searchRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const data = await globalSearch(req.query);
    res.json(data);
  })
);
