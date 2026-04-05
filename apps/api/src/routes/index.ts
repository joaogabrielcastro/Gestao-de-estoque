import { Router } from "express";
import { clientsRouter } from "./clients.routes";
import { dashboardRouter } from "./dashboard.routes";
import { inboundsRouter } from "./inbounds.routes";
import { movementsRouter } from "./movements.routes";
import { outboundsRouter } from "./outbounds.routes";
import { productsRouter } from "./products.routes";
import { reportsRouter } from "./reports.routes";
import { stockRouter } from "./stock.routes";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true });
});

apiRouter.use("/clients", clientsRouter);
apiRouter.use("/products", productsRouter);
apiRouter.use("/inbounds", inboundsRouter);
apiRouter.use("/outbounds", outboundsRouter);
apiRouter.use("/stock", stockRouter);
apiRouter.use("/movements", movementsRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/reports", reportsRouter);
