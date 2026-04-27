import type { Request, Response } from "express";
import * as outboundsService from "./outbounds.service";

export async function listOutbounds(req: Request, res: Response) {
  const data = await outboundsService.listOutbounds({
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
}

export async function createOutbound(req: Request, res: Response) {
  const data = await outboundsService.createOutbound(req.body);
  res.status(201).json(data);
}

export async function getOutboundById(req: Request, res: Response) {
  const row = await outboundsService.getOutboundById(String(req.params.id));
  if (!row) {
    res.status(404).json({ message: "Saída não encontrada" });
    return;
  }
  res.json(row);
}

export async function replaceOutbound(req: Request, res: Response) {
  const data = await outboundsService.replaceOutbound(
    String(req.params.id),
    req.body
  );
  res.json(data);
}

export async function deleteOutbound(req: Request, res: Response) {
  await outboundsService.deleteOutbound(String(req.params.id));
  res.status(204).send();
}
