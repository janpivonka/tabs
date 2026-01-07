import express from "express";
import cors from "cors";
import tableRoutes from "./modules/table/table.routes.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/tables", tableRoutes);

app.get("/", (_req, res) => res.send("Backend běží"));
app.get("/health", (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() })
);

app.use(errorHandler);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend běží na http://localhost:${PORT}`);
});
