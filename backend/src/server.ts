import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import pg from "pg";
import tableRoutes from "./modules/table/table.routes.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";

const app = express();

/** -------------------- CORS CONFIGURATION -------------------- */
// Seznam povolených adres, které mohou volat tvůj backend
const allowedOrigins = [
  "http://localhost:5173",
  "https://peony-tabs.vercel.app",
  "https://tabs-pnzn50m56-jan-pivonkas-projects.vercel.app"
];

const corsOptions = {
  origin: (origin, callback) => {
    // Povolíme požadavky bez origin (třeba mobilní aplikace nebo postman)
    // nebo ty, které jsou v našem seznamu
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  optionsSuccessStatus: 200
};

/** -------------------- SERVER INITIALIZATION -------------------- */
const httpServer = createServer(app);

// Inicializace Socket.io s CORS nastavením
const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ["polling", "websocket"]
});

// Aplikace CORS na Express (pro běžné API požadavky přes fetch)
app.use(cors(corsOptions));
app.use(express.json());

/** -------------------- ROUTES -------------------- */
app.use("/tables", tableRoutes);

app.get("/", (_req, res) => res.send("Backend běží 🚀"));
app.get("/health", (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() })
);

// Middleware pro zpracování chyb (musí být až po routách)
app.use(errorHandler);

/** -------------------- POSTGRES LISTENER -------------------- */
const dbUrl = process.env.DATABASE_URL;

const pgClient = new pg.Client({
  connectionString: dbUrl,
  // Pokud neběžíme na localhostu, vyžadujeme SSL (pro Render)
  ssl: dbUrl?.includes("localhost") || !dbUrl
    ? false
    : { rejectUnauthorized: false }
});

async function initDbListener() {
  if (!dbUrl) {
    console.error("❌ Kritická chyba: DATABASE_URL není definována!");
    return;
  }

  try {
    await pgClient.connect();
    // Nasloucháme kanálu 'table_db_change', který musí spouštět Trigger v DB
    await pgClient.query('LISTEN table_db_change');
    console.log("📡 Postgres Listener aktivován (kanál: table_db_change)");

    pgClient.on('notification', (msg) => {
      if (msg.channel === 'table_db_change' && msg.payload) {
        try {
          const data = JSON.parse(msg.payload);
          console.log("🔔 Zachycena změna v DB:", data);
          // Přepošleme info všem připojeným klientům přes Socket.io
          io.emit('db_sync_needed', data);
        } catch (e) {
          console.error("❌ Chyba při parsování JSON payloadu:", e);
        }
      }
    });

    pgClient.on('error', (err) => {
      console.error("❌ Neočekávaná chyba v Postgres Listeneru:", err);
      // Pokus o znovupřipojení při výpadku po 5 sekundách
      setTimeout(initDbListener, 5000);
    });

  } catch (err) {
    console.error("❌ Nepodařilo se připojit k Postgres Listeneru:", err);
  }
}

// Spustíme listener pro real-time aktualizace
initDbListener();

/** -------------------- START SERVER -------------------- */
const PORT = Number(process.env.PORT) || 10000;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend úspěšně spuštěn na portu ${PORT}`);
});