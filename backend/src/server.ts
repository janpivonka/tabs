import express from "express";
import cors from "cors";
import { createServer } from "http"; // Přidáno
import { Server } from "socket.io";  // Přidáno
import pg from "pg";                 // Přidáno
import tableRoutes from "./modules/table/table.routes.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";

const app = express();

// 1. Vytvoření HTTP serveru pro Socket.io
const httpServer = createServer(app);

// 2. Inicializace Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "*", // V produkci zde uveďte URL vašeho frontendu
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

app.use("/tables", tableRoutes);

app.get("/", (_req, res) => res.send("Backend běží"));
app.get("/health", (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() })
);

app.use(errorHandler);

// 3. Konfigurace Postgres Listeneru
// Používáme connection string, který máš pravděpodobně v environmentálních proměnných
const pgClient = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

async function initDbListener() {
  try {
    await pgClient.connect();
    await pgClient.query('LISTEN table_db_change');
    console.log("📡 Postgres Listener aktivován (kanál: table_db_change)");

    pgClient.on('notification', (msg) => {
      if (msg.channel === 'table_db_change' && msg.payload) {
        const data = JSON.parse(msg.payload);
        console.log("🔔 Zachycena změna v DB:", data);

        // Emise události všem připojeným klientům (frontendu)
        io.emit('db_sync_needed', data);
      }
    });
  } catch (err) {
    console.error("❌ Nepodařilo se připojit k Postgres Listeneru:", err);
  }
}

// Spustíme listener
initDbListener();

const PORT = Number(process.env.PORT) || 4000;

// 4. POZOR: Musíme volat httpServer.listen místo app.listen
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend běží na portu ${PORT}`);
});