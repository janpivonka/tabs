import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import pg from "pg";
import tableRoutes from "./modules/table/table.routes.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";

const app = express();

// 1. Vytvoření HTTP serveru pro Socket.io
const httpServer = createServer(app);

// 2. Inicializace Socket.io se stabilnějším nastavením pro Free Tier
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Zde v produkci doplň URL svého frontendu na Vercelu
    methods: ["GET", "POST"]
  },
  transports: ["polling", "websocket"] // Polling pomáhá udržet spojení na Render Free Tieru
});

app.use(cors());
app.use(express.json());

app.use("/tables", tableRoutes);

app.get("/", (_req, res) => res.send("Backend běží 🚀"));
app.get("/health", (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() })
);

app.use(errorHandler);

// 3. Konfigurace Postgres Listeneru
// Robustnější kontrola DATABASE_URL a SSL
const dbUrl = process.env.DATABASE_URL;

const pgClient = new pg.Client({
  connectionString: dbUrl,
  // Pokud běžíme na Renderu (není localhost), vynutíme SSL
  ssl: dbUrl?.includes("localhost") || !dbUrl
    ? false
    : { rejectUnauthorized: false }
});

async function initDbListener() {
  if (!dbUrl) {
    console.error("❌ Kritická chyba: DATABASE_URL není definována v environment variables!");
    return;
  }

  try {
    await pgClient.connect();
    await pgClient.query('LISTEN table_db_change');
    console.log("📡 Postgres Listener aktivován (kanál: table_db_change)");

    pgClient.on('notification', (msg) => {
      if (msg.channel === 'table_db_change' && msg.payload) {
        try {
          const data = JSON.parse(msg.payload);
          console.log("🔔 Zachycena změna v DB:", data);
          io.emit('db_sync_needed', data);
        } catch (e) {
          console.error("❌ Chyba při parsování JSON payloadu:", e);
        }
      }
    });

    pgClient.on('error', (err) => {
      console.error("❌ Neočekávaná chyba v Postgres Listeneru:", err);
      // Pokus o znovupřipojení při výpadku
      setTimeout(initDbListener, 5000);
    });

  } catch (err) {
    console.error("❌ Nepodařilo se připojit k Postgres Listeneru:", err);
  }
}

// Spustíme listener
initDbListener();

// Render si port přiděluje sám, většinou 10000
const PORT = Number(process.env.PORT) || 10000;

// 4. Spuštění serveru na 0.0.0.0 (nutné pro přístup zvenčí na Renderu)
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend úspěšně spuštěn na portu ${PORT}`);
});