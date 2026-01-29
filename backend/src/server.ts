import express, { Request, Response } from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import pg from "pg";
import tableRoutes from "./modules/table/table.routes.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";

const app = express();

/** -------------------- CORS CONFIGURATION -------------------- */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://peony-tabs.vercel.app"
];

const corsOptions: cors.CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // 1. Povolíme požadavky bez origin (mobilní aplikace, server-to-server)
    // 2. Povolíme naše fixní adresy (localhost, hlavní doména)
    // 3. Povolíme jakoukoliv subdoménu na vercel.app (dynamické preview odkazy)
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blokováno pro origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  optionsSuccessStatus: 200
};

/** -------------------- SERVER INITIALIZATION -------------------- */
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ["polling", "websocket"]
});

app.use(cors(corsOptions));
app.use(express.json());

/** -------------------- ROUTES -------------------- */
app.use("/tables", tableRoutes);

app.get("/", (_req: Request, res: Response) => res.send("Backend běží 🚀"));
app.get("/health", (_req: Request, res: Response) =>
  res.json({ ok: true, ts: new Date().toISOString() })
);

app.use(errorHandler);

/** -------------------- POSTGRES LISTENER -------------------- */
const dbUrl = process.env.DATABASE_URL;

const pgClient = new pg.Client({
  connectionString: dbUrl,
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
      setTimeout(initDbListener, 5000);
    });

  } catch (err) {
    console.error("❌ Nepodařilo se připojit k Postgres Listeneru:", err);
  }
}

initDbListener();

/** -------------------- START SERVER -------------------- */
const PORT = Number(process.env.PORT) || 10000;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend úspěšně spuštěn na portu ${PORT}`);
});