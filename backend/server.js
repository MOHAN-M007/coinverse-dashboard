const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const API_KEY = process.env.API_KEY || "12341";

const DATA_DIR = path.join(__dirname, "data");
const PLAYERS_FILE = path.join(DATA_DIR, "players.json");

app.use(cors());
app.use(express.json({ limit: "1mb" }));

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PLAYERS_FILE)) fs.writeFileSync(PLAYERS_FILE, "{}\n", "utf8");
}

function safeReadPlayers() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(PLAYERS_FILE, "utf8");
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    console.error("[Coinverse] Failed to parse players.json:", err.message);
    return {};
  }
}

let writeQueue = Promise.resolve();
function safeWritePlayers(players) {
  writeQueue = writeQueue
    .then(() => fs.promises.writeFile(PLAYERS_FILE, JSON.stringify(players, null, 2), "utf8"))
    .catch((err) => {
      console.error("[Coinverse] Failed to write players.json:", err.message);
    });
  return writeQueue;
}

function normalizeUsername(input) {
  return String(input || "").trim();
}

function withDefaults(player = {}) {
  return {
    coins: Number.isFinite(Number(player.coins)) ? Number(player.coins) : 0,
    job: player.job ? String(player.job) : "none",
    role: player.role ? String(player.role) : "player",
    status: player.status ? String(player.status) : "pending"
  };
}

function requireApiKey(req, res, next) {
  const key = req.header("x-api-key");
  if (!key || key !== API_KEY) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  return next();
}

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "coinverse-dashboard-backend" });
});

app.use(requireApiKey);

app.post("/player/register", async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  if (!username) return res.status(400).json({ ok: false, error: "username is required" });

  const players = safeReadPlayers();
  if (!players[username]) {
    players[username] = {
      coins: 0,
      job: "none",
      role: "player",
      status: "pending"
    };
    await safeWritePlayers(players);
  }

  return res.json({ ok: true, username, player: withDefaults(players[username]) });
});

app.post("/player/update", async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  if (!username) return res.status(400).json({ ok: false, error: "username is required" });

  const players = safeReadPlayers();
  const current = withDefaults(players[username]);

  const updated = {
    ...current,
    ...(req.body.coins !== undefined ? { coins: Number(req.body.coins) || 0 } : {}),
    ...(req.body.job !== undefined ? { job: String(req.body.job) } : {}),
    ...(req.body.role !== undefined ? { role: String(req.body.role) } : {}),
    ...(req.body.status !== undefined ? { status: String(req.body.status) } : {})
  };

  players[username] = withDefaults(updated);
  await safeWritePlayers(players);

  return res.json({ ok: true, username, player: players[username] });
});

app.get("/player/:username", (req, res) => {
  const username = normalizeUsername(req.params.username);
  const players = safeReadPlayers();
  if (!players[username]) return res.status(404).json({ ok: false, error: "Player not found" });

  return res.json({ ok: true, username, player: withDefaults(players[username]) });
});

app.get("/admin/players", (req, res) => {
  const players = safeReadPlayers();
  return res.json({ ok: true, players });
});

app.post("/admin/approve", async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  if (!username) return res.status(400).json({ ok: false, error: "username is required" });

  const players = safeReadPlayers();
  const current = withDefaults(players[username]);
  players[username] = { ...current, status: "approved" };
  await safeWritePlayers(players);

  return res.json({ ok: true, username, player: players[username] });
});

app.post("/admin/reject", async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  if (!username) return res.status(400).json({ ok: false, error: "username is required" });

  const players = safeReadPlayers();
  const current = withDefaults(players[username]);
  players[username] = { ...current, status: "rejected" };
  await safeWritePlayers(players);

  return res.json({ ok: true, username, player: players[username] });
});

ensureDataFile();
app.listen(PORT, () => {
  console.log(`[Coinverse] Backend listening on port ${PORT}`);
});
