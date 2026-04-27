import { Router } from "express";
import { productsController } from "../modules/products";
import { asyncHandler } from "../utils/asyncHandler";

export const productsRouter = Router();

productsRouter.get(
  "/",
  asyncHandler(productsController.listProducts)
);

productsRouter.post(
  "/",
  asyncHandler(productsController.createProduct)
);

productsRouter.get(
  "/:id",
  asyncHandler(productsController.getProduct)
);

productsRouter.patch(
  "/:id",
  asyncHandler(productsController.updateProduct)
);

productsRouter.delete(
  "/:id",
  asyncHandler(productsController.deleteProduct)
);
