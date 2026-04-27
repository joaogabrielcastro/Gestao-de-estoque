import type { Request, Response } from "express";
import * as inboundsService from "./inbounds.service";

export async function listInbounds(req: Request, res: Response) {
  const data = await inboundsService.listInbounds({
    clientId: req.query.clientId,
    nf: req.query.nf,
    productId: req.query.productId,
    status: req.query.status,
    q: req.query.q,
    page: req.query.page,
    pageSize: req.query.pageSize,
  });
  res.json(data);
}

export async function createInbound(req: Request, res: Response) {
  const data = await inboundsService.createInbound(req.body);
  res.status(201).json(data);
}

export async function getInboundById(req: Request, res: Response) {
  const row = await inboundsService.getInboundById(String(req.params.id));
  if (!row) {
    res.status(404).json({ message: "Entrada não encontrada" });
    return;
  }
  res.json(row);
}

export async function updateInboundStatus(req: Request, res: Response) {
  const row = await inboundsService.updateInboundStatus(
    String(req.params.id),
    req.body
  );
  res.json(row);
}

export async function replaceInbound(req: Request, res: Response) {
  const data = await inboundsService.replaceInbound(String(req.params.id), req.body);
  res.json(data);
}

export async function deleteInbound(req: Request, res: Response) {
  await inboundsService.deleteInbound(String(req.params.id));
  res.status(204).send();
}
