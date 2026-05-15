import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import aiRouter from "./routes/ai";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

import { migrateData } from "@workspace/db/migrate";

// AI and Database Migration routes are public
app.use("/api", aiRouter);

// Direct migration endpoint
app.post("/api/migrate", async (req, res) => {
  try {
    const { users, products } = req.body;
    if (!users || !products) return res.status(400).json({ error: "Data diperlukan." });
    await migrateData({ users, products });
    res.json({ message: "Migrasi ke VPS MariaDB Berhasil!" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.use("/api", router);

export default app;
