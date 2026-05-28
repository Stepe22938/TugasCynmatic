import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import router from "./routes";
import { logger } from "./lib/logger";
import { antiDdos, securityHeaders } from "./middlewares/antiDdos";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// CORS — allow all origins (frontend on port 5173, 3000, etc.)
app.use(securityHeaders);
app.use(antiDdos);

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ─── SERVE UPLOADS STATICALLY ──────────────────────────────────────────────
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// ─── AI ROUTES (public, no auth) ──────────────────────────────────────────
// ─── ALL OTHER ROUTES (products, users, orders, etc.) ─────────────────────
app.use("/api", router);

export default app;
