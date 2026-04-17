import { Router } from "express";
import * as products from "../services/products.service";
import { asyncHandler } from "../utils/asyncHandler";

export const productsRouter = Router();

productsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const data = await products.listProducts(req.query);
    res.json(data);
  })
);

productsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = await products.createProduct(req.body);
    res.status(201).json(data);
  })
);

productsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await products.getProduct(String(req.params.id));
    if (!row) {
      res.status(404).json({ message: "Produto não encontrado" });
      return;
    }
    res.json(row);
  })
);

productsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await products.updateProduct(String(req.params.id), req.body);
    res.json(row);
  })
);

productsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await products.deleteProduct(String(req.params.id));
    res.status(204).send();
  })
);
