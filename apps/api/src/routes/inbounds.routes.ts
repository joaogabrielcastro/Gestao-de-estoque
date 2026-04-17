import { Router } from "express";
import * as inbound from "../services/inbound.service";
import { asyncHandler } from "../utils/asyncHandler";

export const inboundsRouter = Router();

inboundsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const data = await inbound.listInbounds({
      clientId: req.query.clientId,
      nf: req.query.nf,
      productId: req.query.productId,
      status: req.query.status,
      q: req.query.q,
      page: req.query.page,
      pageSize: req.query.pageSize,
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

inboundsRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const row = await inbound.updateInboundStatus(String(req.params.id), req.body);
    res.json(row);
  })
);

inboundsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = await inbound.replaceInbound(String(req.params.id), req.body);
    res.json(data);
  })
);

inboundsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await inbound.deleteInbound(String(req.params.id));
    res.status(204).send();
  })
);
