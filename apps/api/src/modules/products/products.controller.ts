import type { Request, Response } from "express";
import * as productsService from "./products.service";

export async function listProducts(req: Request, res: Response) {
  const data = await productsService.listProducts(req.query);
  res.json(data);
}

export async function createProduct(req: Request, res: Response) {
  const data = await productsService.createProduct(req.body);
  res.status(201).json(data);
}

export async function getProduct(req: Request, res: Response) {
  const row = await productsService.getProduct(String(req.params.id));
  if (!row) {
    res.status(404).json({ message: "Produto não encontrado" });
    return;
  }
  res.json(row);
}

export async function updateProduct(req: Request, res: Response) {
  const row = await productsService.updateProduct(String(req.params.id), req.body);
  res.json(row);
}

export async function deleteProduct(req: Request, res: Response) {
  await productsService.deleteProduct(String(req.params.id));
  res.status(204).send();
}
