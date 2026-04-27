import { Router } from "express";
import { clientsController } from "../modules/clients";
import { asyncHandler } from "../utils/asyncHandler";

export const clientsRouter = Router();

clientsRouter.get(
  "/",
  asyncHandler(clientsController.listClients)
);

clientsRouter.post(
  "/",
  asyncHandler(clientsController.createClient)
);

clientsRouter.get(
  "/:id",
  asyncHandler(clientsController.getClient)
);

clientsRouter.patch(
  "/:id",
  asyncHandler(clientsController.updateClient)
);

clientsRouter.delete(
  "/:id",
  asyncHandler(clientsController.deleteClient)
);
