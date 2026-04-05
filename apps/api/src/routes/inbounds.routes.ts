import { Router } from "express";
import * as inbound from "../services/inbound.service";
import { asyncHandler } from "../utils/asyncHandler";

export const inboundsRouter = Router();

inboundsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const data = await inbound.listInbounds({
      clientId: req.query.clientId as string | undefined,
      nf: req.query.nf as string | undefined,
      productId: req.query.productId as string | undefined,
    });
    res.json(data);
  })
);

inboundsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = await inbound.createInbound(req.body);
    res.status(201).json(data);
  })
);

inboundsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await inbound.getInboundById(String(req.params.id));
    if (!row) {
      res.status(404).json({ message: "Entrada não encontrada" });
      return;
    }
    res.json(row);
  })
);
