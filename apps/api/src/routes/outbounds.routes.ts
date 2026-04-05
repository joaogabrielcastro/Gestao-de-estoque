import { Router } from "express";
import * as outbound from "../services/outbound.service";
import { asyncHandler } from "../utils/asyncHandler";

export const outboundsRouter = Router();

outboundsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const data = await outbound.listOutbounds();
    res.json(data);
  })
);

outboundsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = await outbound.createOutbound(req.body);
    res.status(201).json(data);
  })
);

outboundsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await outbound.getOutboundById(String(req.params.id));
    if (!row) {
      res.status(404).json({ message: "Saída não encontrada" });
      return;
    }
    res.json(row);
  })
);
