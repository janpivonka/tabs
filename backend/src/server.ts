import expressPkg from "express";
const { json } = expressPkg;
import cors from "cors";
import tablesRoutes from "./routes/tables.ts";
import { errorHandler } from "./middleware/errorHandler.ts";

const app = expressPkg();
app.use(cors());
app.use(json());

const PORT = 4000;

app.use("/tables", tablesRoutes);

app.get("/", (_req, res) => res.send("Backend běží 👍"));
app.get("/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// Error handling middleware musí být až nakonec
app.use(errorHandler);

app.listen(PORT, () => console.log(`Backend běží na http://localhost:${PORT}`));
