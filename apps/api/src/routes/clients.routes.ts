import { Router } from "express";
import * as clients from "../services/clients.service";
import { asyncHandler } from "../utils/asyncHandler";

export const clientsRouter = Router();

clientsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const data = await clients.listClients();
    res.json(data);
  })
);

clientsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = await clients.createClient(req.body);
    res.status(201).json(data);
  })
);

clientsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await clients.getClient(String(req.params.id));
    if (!row) {
      res.status(404).json({ message: "Cliente não encontrado" });
      return;
    }
    res.json(row);
  })
);

clientsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await clients.updateClient(String(req.params.id), req.body);
    res.json(row);
  })
);
