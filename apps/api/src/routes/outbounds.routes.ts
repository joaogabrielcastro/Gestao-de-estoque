import { Router } from "express";
import * as outbound from "../services/outbound.service";
import { asyncHandler } from "../utils/asyncHandler";

export const outboundsRouter = Router();

outboundsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const data = await outbound.listOutbounds({
      clientId: req.query.clientId,
      nf: req.query.nf,
      productId: req.query.productId,
      q: req.query.q,
      from: req.query.from,
      to: req.query.to,
      page: req.query.page,
      pageSize: req.query.pageSize,
    });
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

outboundsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = await outbound.replaceOutbound(String(req.params.id), req.body);
    res.json(data);
  })
);

outboundsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await outbound.deleteOutbound(String(req.params.id));
    res.status(204).send();
  })
);
