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

// Railway přiděluje port dynamicky, pokud není k dispozici, použije se 4000
const PORT = process.env.PORT || 4000;

// Host '0.0.0.0' je nutný pro přístup z vnějšího světa v Docker/Cloud prostředí
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend běží na portu ${PORT}`);
});