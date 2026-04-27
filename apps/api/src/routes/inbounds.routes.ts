import { Router } from "express";
import { inboundsController } from "../modules/inbounds";
import { asyncHandler } from "../utils/asyncHandler";

export const inboundsRouter = Router();

inboundsRouter.get(
  "/",
  asyncHandler(inboundsController.listInbounds)
);

inboundsRouter.post(
  "/",
  asyncHandler(inboundsController.createInbound)
);

inboundsRouter.get(
  "/:id",
  asyncHandler(inboundsController.getInboundById)
);

inboundsRouter.patch(
  "/:id/status",
  asyncHandler(inboundsController.updateInboundStatus)
);

inboundsRouter.put(
  "/:id",
  asyncHandler(inboundsController.replaceInbound)
);

inboundsRouter.delete(
  "/:id",
  asyncHandler(inboundsController.deleteInbound)
);
