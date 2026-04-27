import { Router } from "express";
import { outboundsController } from "../modules/outbounds";
import { asyncHandler } from "../utils/asyncHandler";

export const outboundsRouter = Router();

outboundsRouter.get(
  "/",
  asyncHandler(outboundsController.listOutbounds)
);

outboundsRouter.post(
  "/",
  asyncHandler(outboundsController.createOutbound)
);

outboundsRouter.get(
  "/:id",
  asyncHandler(outboundsController.getOutboundById)
);

outboundsRouter.put(
  "/:id",
  asyncHandler(outboundsController.replaceOutbound)
);

outboundsRouter.delete(
  "/:id",
  asyncHandler(outboundsController.deleteOutbound)
);
