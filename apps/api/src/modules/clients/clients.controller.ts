import type { Request, Response } from "express";
import * as clientsService from "./clients.service";

export async function listClients(req: Request, res: Response) {
  const data = await clientsService.listClients(req.query);
  res.json(data);
}

export async function createClient(req: Request, res: Response) {
  const data = await clientsService.createClient(req.body);
  res.status(201).json(data);
}

export async function getClient(req: Request, res: Response) {
  const row = await clientsService.getClient(String(req.params.id));
  if (!row) {
    res.status(404).json({ message: "Cliente não encontrado" });
    return;
  }
  res.json(row);
}

export async function updateClient(req: Request, res: Response) {
  const row = await clientsService.updateClient(String(req.params.id), req.body);
  res.json(row);
}

export async function deleteClient(req: Request, res: Response) {
  await clientsService.deleteClient(String(req.params.id));
  res.status(204).send();
}
