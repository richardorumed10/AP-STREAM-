const { getExternalConnectivityStatus, getExternalServices, getExternalService } = require("./cloud/external-connectivity");
const { getRouterNetworkStatus } = require("./cloud/network-core/router/router-network");
const { getRegionalNetworkStatus } = require("./cloud/network-core/router/regions");
const { getNetworkCoreStatus } = require("./cloud/network-core");
const { getCloudStorageStatus } = require("./cloud/storage");
const { getNetworkHealthStatus } = require("./cloud/network-health");
require('dotenv').config({ path: __dirname + '/.env' });
const {
  generalAI,
  textAI,
  getOpenAI
} = require("./ai_gateway");

const { generateAI } = require("./apstream_ai_service");

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./db');


const multer = require("multer");
const path = require("path");
const fs = require("fs");

const shortsUploadDir = path.join(__dirname, "uploads", "shorts");
fs.mkdirSync(shortsUploadDir, { recursive: true });

const shortsStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, shortsUploadDir),
  filename: (_req, file, cb) => {
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  }
});


const musicUploadDir = path.join(__dirname, "uploads", "music");
fs.mkdirSync(musicUploadDir, { recursive: true });

const musicStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, musicUploadDir),
  filename: (_req, file, cb) => {
    const safeName = path.basename(file.originalname)
      .replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const musicUpload = multer({
  storage: musicStorage,
  limits: { fileSize: 250 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === "audio" && file.mimetype && file.mimetype.startsWith("audio/")) {
      cb(null, true);
      return;
    }

    if (file.fieldname === "cover" && file.mimetype && file.mimetype.startsWith("image/")) {
      cb(null, true);
      return;
    }

    cb(new Error("Audio must be an audio file and cover must be an image."));
  }
});

const shortsUpload = multer({
  storage: shortsStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed."));
    }
  }
});




const { getCloudStatus } = require("./cloud/cloud-control");
const { getComputeStatus } = require("./cloud/compute");
const { getMediaStorageStatus } = require("./cloud/media-storage");
const { getNetworkMonitorStatus } = require("./cloud/network-monitor");
const { getPrivateNetworkStatus } = require("./cloud/private-network");
const { getPrivateDnsStatus } = require("./cloud/private-dns");
const { getDnsResolverStatus, resolvePrivateDns } = require("./cloud/dns-resolver");
const { getServiceRegistry, getService, getServiceEndpoint, getServiceRegistryStatus } = require("./cloud/service-registry");

const app = express();


app.disable('x-powered-by');
app.use(helmet());

app.locals.db = db;

const allowedOrigins = [
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [])
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
    

app.get("/api/cloud/jobs", (req, res) => {
  try {
    res.json(getJobsStatus());
  } catch (error) {
    console.error("AP-STREAM Cloud Jobs error:", error);
    res.status(500).json({
      service: "AP-STREAM Cloud Jobs",
      status: "error",
      jobs: []
    });
  }
});


app.get("/api/cloud/infrastructure", async (req, res) => {
  const startedAt = Date.now();

  const result = {
    service: "AP-STREAM Infrastructure",
    status: "online",
    timestamp: new Date().toISOString(),
    components: {}
  };

  // API process
  result.components.api = {
    status: "online",
    process: "running"
  };

  // PostgreSQL
  try {
    await db.query("SELECT 1");
    result.components.database = {
      status: "healthy",
      engine: "PostgreSQL"
    };
  } catch (error) {
    result.components.database = {
      status: "unhealthy",
      engine: "PostgreSQL",
      error: error.message
    };
  }

  // Service Registry
  try {
    const registry = getServiceRegistryStatus();
    result.components.serviceRegistry = {
      status: registry.status === "online" ? "healthy" : "unhealthy",
      mode: registry.mode,
      namespace: registry.namespace,
      serviceCount: registry.serviceCount
    };
  } catch (error) {
    result.components.serviceRegistry = {
      status: "unhealthy",
      error: error.message
    };
  }

  // Compute
  try {
    const compute = getComputeStatus();
    result.components.compute = {
      status: compute.status || "unknown",
      runtime: compute.runtime || null
    };
  } catch (error) {
    result.components.compute = {
      status: "unhealthy",
      error: error.message
    };
  }

  // Network
  try {
    const network = getNetworkMonitorStatus();
    result.components.network = {
      status: network.status || "unknown"
    };
  } catch (error) {
    result.components.network = {
      status: "unhealthy",
      error: error.message
    };
  }

  // Private network
  try {
    const privateNetwork = getPrivateNetworkStatus();
    result.components.privateNetwork = {
      status: privateNetwork.status || "unknown"
    };
  } catch (error) {
    result.components.privateNetwork = {
      status: "unhealthy",
      error: error.message
    };
  }

  // DNS
  try {
    const dns = getDnsResolverStatus();
    result.components.dns = {
      status: dns.status || "unknown"
    };
  } catch (error) {
    result.components.dns = {
      status: "unhealthy",
      error: error.message
    };
  }

  result.durationMs = Date.now() - startedAt;

  const failed = Object.values(result.components)
    .filter(component => component.status === "unhealthy");

  if (failed.length > 0) {
    result.status = "degraded";
  }

  res.status(result.status === "online" ? 200 : 503).json(result);
});

app.get("/api/cloud/status", (req, res) => {
  try {
    const cloud = getCloudStatus();
    const compute = getComputeStatus();

    res.json({
      ...cloud,
      compute: {
        status: compute.status,
        runtime: compute.runtime,
        workloads: compute.workloads
      }
    });
  } catch (error) {
    console.error("AP-STREAM Cloud status error:", error);
    res.status(500).json({
      service: "AP-STREAM Cloud",
      status: "error",
      message: "Cloud status unavailable"
    });
  }
});
    
// AP-STREAM COMPUTE




app.get("/api/cloud/dns-status", (req, res) => {
  try {
    const resolver = getDnsResolverStatus();
    const config = getPrivateDnsStatus();

    res.json({
      service: "AP-STREAM DNS",
      status: "online",
      server: {
        protocol: "DNS over UDP",
        port: Number(process.env.APSTREAM_DNS_PORT || 8053),
        process: "node cloud/dns-server.js"
      },
      resolver,
      configuration: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("DNS status error:", error.message);
    res.status(500).json({
      service: "AP-STREAM DNS",
      status: "error",
      error: error.message
    });
  }
});

app.get("/api/cloud/dns-resolver", (req, res) => {
  try {
    res.json(getDnsResolverStatus());
  } catch (error) {
    console.error("DNS resolver status error:", error.message);
    res.status(500).json({
      service: "AP-STREAM DNS Resolver",
      status: "error",
      message: error.message
    });
  }
});

app.get("/api/cloud/dns-resolve", (req, res) => {
  try {
    const hostname = req.query.hostname || req.query.host || "";
    const result = resolvePrivateDns(hostname);
    res.json(result);
  } catch (error) {
    console.error("DNS resolve error:", error.message);
    res.status(500).json({
      hostname: req.query.host || null,
      found: false,
      error: error.message
    });
  }
});

app.get("/api/cloud/service-registry", (req, res) => {
  try {
    res.json(getServiceRegistryStatus());
  } catch (error) {
    console.error("Service registry status error:", error.message);
    res.status(500).json({
      service: "AP-STREAM Service Registry",
      status: "error",
      message: error.message
    });
  }
});

app.get("/api/cloud/service-endpoint", (req, res) => {
  try {
    const service = req.query.service || req.query.name || "";
    const protocol = req.query.protocol || "http";
    const port = req.query.port !== undefined ? req.query.port : null;

    const result = getServiceEndpoint(service, protocol, port);

    if (!result) {
      return res.status(404).json({
        service,
        found: false
      });
    }

    res.json({
      service,
      found: true,
      result
    });
  } catch (error) {
    console.error("Service endpoint error:", error.message);
    res.status(500).json({
      service: req.query.service || req.query.name || null,
      found: false,
      error: error.message
    });
  }
});

app.get("/api/cloud/service-resolve", (req, res) => {
  try {
    const service = req.query.service || req.query.name || "";
    const result = getService(service);

    if (!result) {
      return res.status(404).json({
        service,
        found: false
      });
    }

    res.json({
      service,
      found: true,
      result
    });
  } catch (error) {
    console.error("Service resolve error:", error.message);
    res.status(500).json({
      service: req.query.service || req.query.name || null,
      found: false,
      error: error.message
    });
  }
});

app.get("/api/cloud/private-dns", (req, res) => {
  try {
    res.json(getPrivateDnsStatus());
  } catch (error) {
    console.error("Private DNS status error:", error.message);
    res.status(500).json({
      service: "AP-STREAM Private DNS",
      status: "error",
      message: error.message
    });
  }
});

app.get("/api/cloud/private-network", (req, res) => {
  try {
    res.json(getPrivateNetworkStatus());
  } catch (error) {
    console.error("Private network status error:", error.message);
    res.status(500).json({
      service: "AP-STREAM Private Network",
      status: "error",
      message: error.message
    });
  }
});

app.get("/api/cloud/network-monitor", (req, res) => {
  try {
    res.json(getNetworkMonitorStatus());
  } catch (error) {
    console.error("AP-STREAM Network & Monitoring error:", error);
    res.status(500).json({
      service: "AP-STREAM Network & Monitoring",
      status: "error",
      error: error.message
    });
  }
});

app.get("/api/cloud/security-status", (req, res) => {
  try {
    const apiKeyConfigured = Boolean(
      String(process.env.APSTREAM_DEVELOPER_ADMIN_SECRET || "").trim()
    );

    const aiSecretConfigured = Boolean(
      String(process.env.APSTREAM_AI_SECRET || "").trim()
    );

    const gatewayConfigured = Boolean(
      String(process.env.APSTREAM_AI_GATEWAY_URL || "").trim()
    );

    res.json({
      service: "AP-STREAM Security & Access Control",
      status: "online",
      accessControl: {
        developerAPI: "protected",
        apiKeySystem: apiKeyConfigured ? "configured" : "not configured",
        gatewayAuthentication: aiSecretConfigured ? "configured" : "not configured"
      },
      security: {
        developerAdminSecretConfigured: apiKeyConfigured,
        aiSecretConfigured,
        externalGatewayConfigured: gatewayConfigured,
        credentialsExposed: false
      },
      protectedServices: {
        developerAPI: "/api/v1",
        aiGateway: "/api/ai/gateway",
        cloudControl: "/api/cloud/*"
      }
    });
  } catch (error) {
    console.error("AP-STREAM Security status error:", error);
    res.status(500).json({
      service: "AP-STREAM Security & Access Control",
      status: "error"
    });
  }
});

app.get("/api/cloud/network-health", async (req, res) => {
  try {
    const result = await getNetworkHealthStatus();
    res.json(result);
  } catch (error) {
    console.error("AP-STREAM Network Health error:", error);
    res.status(500).json({
      service: "AP-STREAM Network Health",
      status: "error"
    });
  }
});

app.get("/api/cloud/storage", (req, res) => {
  try {
    res.json(getCloudStorageStatus());
  } catch (error) {
    console.error("AP-STREAM Cloud Storage error:", error);
    res.status(500).json({
      service: "AP-STREAM Cloud Storage",
      status: "error"
    });
  }
});

app.get("/api/cloud/ai-status", (req, res) => {
  try {
    const gatewayUrl = String(process.env.APSTREAM_AI_GATEWAY_URL || "").trim();
    const localAiUrl = String(process.env.APSTREAM_LOCAL_AI_URL || "").trim();

    res.json({
      service: "AP-STREAM AI",
      status: "online",
      identity: "AP-STREAM AI",
      gateway: {
        status: "running",
        externalGatewayConfigured: Boolean(gatewayUrl)
      },
      localRuntime: {
        configured: Boolean(localAiUrl)
      },
      workloads: {
        generalAI: "ready",
        toolAI: "ready",
        songAI: "ready",
        creativeAI: "ready"
      },
      security: {
        secretConfigured: Boolean(
          String(process.env.APSTREAM_AI_SECRET || "").trim()
        ),
        secretExposed: false
      }
    });
  } catch (error) {
    console.error("AP-STREAM AI Cloud status error:", error);
    res.status(500).json({
      service: "AP-STREAM AI",
      status: "error",
      identity: "AP-STREAM AI"
    });
  }
});

app.get("/api/cloud/media-storage", (req, res) => {
  try {
    res.json(getMediaStorageStatus());
  } catch (error) {
    console.error("AP-STREAM Media & Storage error:", error);
    res.status(500).json({
      service: "AP-STREAM Media & Storage",
      status: "error",
      error: error.message
    });
  }
});

app.get("/api/cloud/compute", (req, res) => {
  try {
    res.json(getComputeStatus());
  } catch (error) {
    console.error("AP-STREAM Compute error:", error);
    res.status(500).json({
      service: "AP-STREAM Compute",
      status: "error",
      error: error.message
    });
  }
});


// AP-STREAM LOCAL AI — llama.cpp / Qwen
app.post('/api/ai/local', async (req, res) => {
  try {
    const query = String(req.body?.query || req.body?.message || '').trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Missing query'
      });
    }

    const response = await fetch('http://127.0.0.1:8081/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are AP-STREAM AI, an independent local AI assistant. Be helpful, concise and accurate.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.7,
        max_tokens: 256
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        error: data
      });
    }

    const answer = data?.choices?.[0]?.message?.content || '';

    res.json({
      success: true,
      type: 'local_ai',
      query,
      answer,
      model: data.model || 'Qwen 2.5 1.5B'
    });

  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Local AI unavailable',
      details: error.message
    });
  }
});


// AP-STREAM public crawler search
app.get("/api/search", async (req, res) => {
  const q = String(req.query.q || "").trim();

  if (!q) {
    return res.status(400).json({
      success: false,
      error: "Search query required"
    });
  }

  try {
    const pool = require("./db");

    const result = await pool.query(`
      SELECT
        id,
        url,
        canonical_url,
        title,
        description,
        LEFT(content, 500) AS preview,
        language,
        status_code,
        content_type,
        last_crawled_at,
        (
          ts_rank_cd(
            search_vector,
            websearch_to_tsquery('simple', $1)
          )
          + CASE
              WHEN LOWER(title) = LOWER($1) THEN 10
              ELSE 0
            END
          + CASE
              WHEN LOWER(title) LIKE '%' || LOWER($1) || '%' THEN 5
              ELSE 0
            END
          + CASE
              WHEN LOWER(description) LIKE '%' || LOWER($1) || '%' THEN 2
              ELSE 0
            END
          + CASE
              WHEN LOWER(url) LIKE '%' || LOWER($1) || '%' THEN 1
              ELSE 0
            END
        ) AS rank
      FROM ap_search_pages
      WHERE
        search_vector @@ websearch_to_tsquery('simple', $1)
        OR title ILIKE '%' || $1 || '%'
        OR description ILIKE '%' || $1 || '%'
        OR url ILIKE '%' || $1 || '%'
      ORDER BY rank DESC, last_crawled_at DESC NULLS LAST
      LIMIT 100
    `, [q]);

    res.json({
      success: true,
      query: q,
      count: result.rows.length,
      results: result.rows.map(row => ({
        type: "Web",
        id: row.id,
        url: row.url,
        canonical_url: row.canonical_url,
        title: row.title,
        description: row.description,
        preview: row.preview,
        language: row.language,
        status_code: row.status_code,
        content_type: row.content_type,
        last_crawled_at: row.last_crawled_at,
        rank: Number(row.rank || 0)
      }))
    });
  } catch (error) {
    console.error("Public search error:", error.message);

    res.status(500).json({
      success: false,
      error: "Search failed",
      message: error.message
    });
  }
});

const developerApiRouter = require("./developer_api");
app.use("/api/v1", developerApiRouter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message: 'Too many authentication requests. Please try again later.'
  }
});

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/ai/data', require('./routes/ai_data'));
app.use('/api/mail', require('./routes/mail'));



app.get("/api/cloud/network-router", (req, res) => {
  try {
    res.json(getRouterNetworkStatus());
  } catch (error) {
    console.error("Network Router error:", error.message);
    res.status(500).json({
      status: "error",
      error: error.message
    });
app.get("/api/cloud/external-connectivity", (req, res) => {
  try {
    res.json(getExternalConnectivityStatus());
  } catch (error) {
    console.error("External Connectivity error:", error.message);
    res.status(500).json({ status: "error", error: error.message });
  }
});

app.get("/api/cloud/external-services", (req, res) => {
  res.json({ services: getExternalServices() });
});

app.get("/api/cloud/external-services/:id", (req, res) => {
  const service = getExternalService(req.params.id);
  if (!service) return res.status(404).json({ status: "not_found", service: req.params.id });
  res.json(service);
});

  }
});

app.get("/api/cloud/network-regions", (req, res) => {
  try {
    res.json(getRegionalNetworkStatus());
  } catch (error) {
    console.error("Regional Network error:", error.message);
    res.status(500).json({ status: "error", error: error.message });
  }
});

app.get("/api/cloud/network-core", (req, res) => {
  try {
    res.json(getNetworkCoreStatus());
  } catch (error) {
    console.error("Network Core error:", error.message);
    res.status(500).json({
      status: "error",
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

const liveRooms = new Map();
const { getJobsStatus, createJob, updateJob } = require("./cloud/jobs");

io.on("connection", (socket) => {
  console.log("Live client connected:", socket.id);

  socket.on("live:create", ({ liveId }) => {
    if (!liveId) return;

    liveRooms.set(liveId, {
      host: socket.id,
      viewers: new Set()
    });

    socket.join(liveId);
    socket.emit("live:created", { liveId });

    console.log("Live created:", liveId);
  });

  socket.on("live:join", ({ liveId }) => {
    const live = liveRooms.get(liveId);

    if (!live) {
      socket.emit("live:error", {
        message: "Live stream not found."
      });
      return;
    }

    live.viewers.add(socket.id);
    socket.join(liveId);

    socket.to(live.host).emit("live:viewer-joined", {
      viewerId: socket.id
    });

    socket.emit("live:joined", {
      liveId,
      hostId: live.host,
      viewerCount: live.viewers.size
    });
  });

  socket.on("live:signal", ({ targetId, data }) => {
    if (!targetId || !data) return;

    io.to(targetId).emit("live:signal", {
      senderId: socket.id,
      data
    });
  });

  socket.on("live:end", ({ liveId }) => {
    const live = liveRooms.get(liveId);

    if (!live || live.host !== socket.id) return;

    io.to(liveId).emit("live:ended");
    liveRooms.delete(liveId);

    console.log("Live ended:", liveId);
  });

  // AP-STREAM 1-to-1 audio/video call signaling
  socket.on("call:offer", ({ targetId, offer }) => {
    if (!targetId || !offer) return;
    io.to(targetId).emit("call:offer", {
      callerId: socket.id,
      offer,
    });
  });

  socket.on("call:answer", ({ targetId, answer }) => {
    if (!targetId || !answer) return;
    io.to(targetId).emit("call:answer", {
      answererId: socket.id,
      answer,
    });
  });

  socket.on("call:ice-candidate", ({ targetId, candidate }) => {
    if (!targetId || !candidate) return;
    io.to(targetId).emit("call:ice-candidate", {
      senderId: socket.id,
      candidate,
    });
  });

  socket.on("call:end", ({ targetId }) => {
    if (!targetId) return;
    io.to(targetId).emit("call:end", {
      callerId: socket.id,
    });
  });

  // ============================================================
  // AP-STREAM CONFERENCE ROOMS
  // Separate from the existing 1-to-1 call signaling.
  // ============================================================

  if (!global.apStreamConferenceRooms) {
    global.apStreamConferenceRooms = new Map();
  }

  const conferenceRooms = global.apStreamConferenceRooms;

  socket.on("conference:create", ({ roomId, name } = {}) => {
    const id =
      String(roomId || "")
        .trim()
        .toUpperCase() ||
      ("AP-" + Math.random().toString(36).slice(2, 8).toUpperCase());

    if (!conferenceRooms.has(id)) {
      conferenceRooms.set(id, {
        id,
        name: String(name || "AP-STREAM Conference").trim(),
        host: socket.id,
        participants: new Set([socket.id]),
        createdAt: Date.now()
      });
    }

    const room = conferenceRooms.get(id);

    socket.join("conference:" + id);

    socket.emit("conference:created", {
      roomId: id,
      name: room.name,
      hostId: room.host
    });
  });

  socket.on("conference:join", ({ roomId } = {}) => {
    const id = String(roomId || "").trim().toUpperCase();
    const room = conferenceRooms.get(id);

    if (!room) {
      socket.emit("conference:error", {
        message: "Conference room not found."
      });
      return;
    }

    if (room.participants.size >= 8) {
      socket.emit("conference:error", {
        message: "This conference room is full."
      });
      return;
    }

    const existingParticipants = [...room.participants];

    room.participants.add(socket.id);
    socket.join("conference:" + id);

    socket.emit("conference:joined", {
      roomId: id,
      hostId: room.host,
      participants: existingParticipants
    });

    socket.to("conference:" + id).emit("conference:participant-joined", {
      participantId: socket.id
    });
  });

  socket.on("conference:offer", ({ targetId, roomId, offer } = {}) => {
    if (!targetId || !roomId || !offer) return;

    io.to(targetId).emit("conference:offer", {
      senderId: socket.id,
      roomId,
      offer
    });
  });

  socket.on("conference:answer", ({ targetId, roomId, answer } = {}) => {
    if (!targetId || !roomId || !answer) return;

    io.to(targetId).emit("conference:answer", {
      senderId: socket.id,
      roomId,
      answer
    });
  });

  socket.on("conference:ice-candidate", ({
    targetId,
    roomId,
    candidate
  } = {}) => {
    if (!targetId || !roomId || !candidate) return;

    io.to(targetId).emit("conference:ice-candidate", {
      senderId: socket.id,
      roomId,
      candidate
    });
  });

  socket.on("conference:leave", ({ roomId } = {}) => {
    const id = String(roomId || "").trim().toUpperCase();
    const room = conferenceRooms.get(id);

    if (!room) return;

    room.participants.delete(socket.id);
    socket.leave("conference:" + id);

    io.to("conference:" + id).emit("conference:participant-left", {
      participantId: socket.id
    });

    if (room.host === socket.id) {
      io.to("conference:" + id).emit("conference:ended");

      conferenceRooms.delete(id);
    } else if (room.participants.size === 0) {
      conferenceRooms.delete(id);
    }
  });

  socket.on("disconnect", () => {
    for (const [liveId, live] of liveRooms.entries()) {
      if (live.host === socket.id) {
        io.to(liveId).emit("live:ended");
        liveRooms.delete(liveId);
      } else if (live.viewers.delete(socket.id)) {
        io.to(live.host).emit("live:viewer-left", {
          viewerId: socket.id
        });
      }
    }

    console.log("Live client disconnected:", socket.id);
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'AP Stream backend is running',
    status: 'OK'
  });
});

app.post("/api/songs/upload", musicUpload.fields([
  { name: "audio", maxCount: 1 },
  { name: "cover", maxCount: 1 }
]), async (req, res) => {
  try {
    const title = String(req.body?.title || "").trim();
    const artistIdRaw = String(req.body?.artist_id || "").trim();

    if (!title) {
      return res.status(400).json({
        success: false,
        error: "Song title is required."
      });
    }

    const audioFile = req.files?.audio?.[0];

    if (!audioFile) {
      return res.status(400).json({
        success: false,
        error: "Audio file is required."
      });
    }

    if (!audioFile.size || audioFile.size <= 0) {
      try { fs.unlinkSync(audioFile.path); } catch (_) {}
      return res.status(400).json({
        success: false,
        error: "The audio file is empty."
      });
    }

    let artistId = null;

    if (artistIdRaw) {
      const parsed = Number.parseInt(artistIdRaw, 10);
      if (Number.isInteger(parsed)) {
        artistId = parsed;
      }
    }

    const audioUrl = `/uploads/music/${audioFile.filename}`;
    const coverFile = req.files?.cover?.[0];
    const coverUrl = coverFile
      ? `/uploads/music/${coverFile.filename}`
      : null;

    const result = await db.query(
      `INSERT INTO songs
        (artist_id, title, audio_url, cover_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, artist_id, title, audio_url, cover_url,
                 duration_seconds, created_at`,
      [artistId, title, audioUrl, coverUrl]
    );

    const cloudJob = createJob({
      type: "media-upload",
      name: `Music upload: ${title}`,
      status: "completed",
      metadata: {
        songId: result.rows[0]?.id ?? null,
        title,
        fileSizeBytes: audioFile.size || 0
      }
    });

    res.status(201).json({
      success: true,
      message: "Music uploaded successfully.",
      song: result.rows[0],
      cloudJob: {
        id: cloudJob.id,
        type: cloudJob.type,
        status: cloudJob.status
      }
    });
  } catch (error) {
    console.error("Music upload error:", error);

    res.status(500).json({
      success: false,
      error: "Could not upload music."
    });
  }
});


app.get('/api/artists', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM artists ORDER BY id DESC'
    );

    res.json({
      status: 'OK',
      artists: result.rows
    });
  } catch (error) {
    console.error('Artists error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Could not load artists'
    });
  }
});


app.use('/uploads/videos', require('express').static(require('path').join(__dirname, 'uploads', 'videos')));
app.post('/api/videos/upload', async (req, res) => {
  const multer = require('multer');
  const fs = require('fs');
  const path = require('path');

  const uploadDir = path.join(__dirname, 'uploads', 'videos');
  fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase() || '.mp4';
      const safeBase = path
        .basename(file.originalname || 'video', ext)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 80) || 'video';

      cb(null, `${Date.now()}-${safeBase}${ext}`);
    }
  });

  const upload = multer({
    storage,
    limits: {
      fileSize: 500 * 1024 * 1024
    },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype && file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed.'));
      }
    }
  }).single('video');

  upload(req, res, async (uploadError) => {
    if (uploadError) {
      console.error('Video upload error:', uploadError);
      return res.status(400).json({
        status: 'ERROR',
        message: uploadError.message || 'Could not upload video'
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          status: 'ERROR',
          message: 'No video uploaded'
        });
      }

      const title =
        String(req.body.title || req.file.originalname || 'AP-STREAM Video')
          .replace(/\.[^/.]+$/, '')
          .trim()
          .slice(0, 200) || 'AP-STREAM Video';

      const videoUrl = `/uploads/videos/${req.file.filename}`;

      const result = await db.query(
        `INSERT INTO videos
          (artist_id, title, video_url, thumbnail_url, duration_seconds)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          null,
          title,
          videoUrl,
          null,
          null
        ]
      );

      const cloudJob = createJob({
        type: "video-upload",
        name: `Video upload: ${title}`,
        status: "completed",
        metadata: {
          videoId: result.rows[0]?.id ?? null,
          title,
          fileSizeBytes: req.file.size || 0
        }
      });

      res.status(201).json({
        status: 'OK',
        success: true,
        video: result.rows[0],
        cloudJob: {
          id: cloudJob.id,
          type: cloudJob.type,
          status: cloudJob.status
        }
      });
    } catch (error) {
      console.error('Video database error:', error);

      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
      }

      res.status(500).json({
        status: 'ERROR',
        message: error.message || 'Could not save video'
      });
    }
  });
});

app.get('/api/videos', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM videos ORDER BY id DESC'
    );

    res.json({
      status: 'OK',
      videos: result.rows
    });
  } catch (error) {
    console.error('Videos error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Could not load videos'
    });
  }
});

app.get('/api/songs', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM songs ORDER BY id DESC'
    );

    res.json({
      status: 'OK',
      songs: result.rows
    });
  } catch (error) {
    console.error('Songs error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Could not load songs'
    });
  }
});





app.post("/api/ai/kids-cartoon-visual", async (req, res) => {
  try {
    const {
      character = "a friendly cartoon character",
      scene = "a bright, fun cartoon scene",
      language = "English"
    } = req.body || {};

    const response = await textAI({
      model: "Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M",
      input: `
Create an original, child-friendly visual production prompt for a cartoon.

Character:
${character}

Scene:
${scene}

Language:
${language}

Return:
1. Character appearance
2. Environment/background
3. Character action
4. Camera framing
5. Lighting/mood
6. Complete image-generation prompt

Use a colorful, friendly animated-cartoon style.
Keep it suitable for children.
Do not use copyrighted characters or existing franchises.
Avoid frightening horror, graphic violence, sexual content, hateful content,
or dangerous instructions.
      `
    });

    res.json({
      success: true,
      result: response.output_text
    });
  } catch (error) {
    console.error("Kids cartoon visual error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Could not create visual prompt."
    });
  }
});

app.post("/api/ai/kids-cartoon-scenes", async (req, res) => {
  try {
    const {
      character = "a friendly cartoon character",
      story = "a fun adventure",
      language = "English",
      type = "Adventure",
      duration = "3 minutes",
      characters = []
    } = req.body || {};

    const response = await textAI({
      model: "Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M",
      input: `
Create a child-friendly cartoon production plan for AP-STREAM.

Character: ${character}
Story: ${story}
Language: ${language}
Type: ${type}
Duration: ${duration}

Use the following saved characters throughout the episode when appropriate.
Keep each character's name, role, personality, and visual appearance consistent.

Saved characters:
${JSON.stringify(characters, null, 2)}

Create exactly 5 scenes.

For every scene provide:
- Scene number
- Scene title
- What happens
- Character actions
- Short narrator line
- Short dialogue
- Safe visual description for an image generator

Keep the story original and suitable for children.
Do not use copyrighted characters or existing franchises.
Avoid sexual content, graphic violence, frightening horror, hateful content,
or dangerous instructions.

Return the result in clear JSON with:
title, characters, scenes, lesson
      `
    });

    res.json({
      success: true,
      result: response.output_text
    });
  } catch (error) {
    console.error("Kids cartoon scenes error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Could not create cartoon scenes."
    });
  }
});

app.post("/api/ai/kids-cartoon", async (req, res) => {
  try {
    const {
      character = "a friendly cartoon character",
      story = "a fun adventure",
      language = "English",
      type = "Adventure",
      duration = "3 minutes"
    } = req.body || {};

    const prompt = `
Create an original, child-friendly cartoon episode for AP-STREAM.

Character: ${character}
Story idea: ${story}
Language: ${language}
Story type: ${type}
Duration: ${duration}

Return:
1. Episode title
2. Short description
3. Main characters
4. 5 numbered scenes
5. Narrator lines for each scene
6. Simple character dialogue
7. A positive lesson at the end

Keep it suitable for children. Avoid sexual content, graphic violence,
dangerous instructions, frightening horror, hateful content, or copyrighted
characters and stories.
`;

    const response = await textAI({
      model: "Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M",
      input: prompt
    });

    res.json({
      success: true,
      mode: "ap-stream-local-qwen",
      result: response.output_text
    });
  } catch (error) {
    console.error("Kids cartoon AI error:", error);

    res.status(500).json({
      success: false,
      error: error.message || "Could not generate kids cartoon."
    });
  }
});



app.post("/api/ai/search", async (req, res) => {
  try {
    const { query, context } = req.body || {};
    const cleanQuery = String(query || "").trim();

    if (!cleanQuery) {
      return res.status(400).json({
        success: false,
        message: "Search query is required."
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: "AI search is not configured."
      });
    }

    const safeContext = Array.isArray(context)
      ? context.slice(0, 30).map((item) => ({
          type: String(item?.type || "").slice(0, 40),
          title: String(item?.title || "").slice(0, 180),
          text: String(item?.text || "").slice(0, 500),
          url: String(item?.url || "").slice(0, 500)
        }))
      : [];

    const contextText = safeContext.length
      ? safeContext.map((item, index) =>
          `${index + 1}. [${item.type}] ${item.title}
${item.text}${item.url ? `
URL: ${item.url}` : ""}`
          ).join("\\n\\n")
      : "No matching AP-STREAM content was found.";

    const response = await textAI({
      model: "Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M",
      input: [
        {
          role: "system",
          content: [{
            type: "input_text",
            text:
              "You are AP-STREAM AI Search. Answer questions using the supplied AP-STREAM search results. " +
              "Do not invent AP-STREAM content, URLs, artists, songs, stations, videos, or facts. " +
              "If the supplied results are insufficient, clearly say so. " +
              "Give a concise, useful answer and mention relevant result titles when appropriate. " +
              "AP-STREAM is a music, social, video, TV and radio platform focused especially on African and Ugandan content."
          }]
        },
        {
          role: "user",
          content: [{
            type: "input_text",
            text: `User search:
${cleanQuery}

AP-STREAM search results:
${contextText}`
          }]
        }
      ]
    });

    const answer = String(response.output_text || "").trim();

    return res.json({
      success: true,
      type: "ai_search",
      query: cleanQuery,
      answer: answer || "I couldn't generate an answer from the available AP-STREAM results.",
      sources: safeContext.slice(0, 10)
    });
  } catch (error) {
    console.error("AI Search error:", error);

    return res.status(500).json({
      success: false,
      message: "AI search temporarily unavailable."
    });
  }
});


app.post("/api/ai/gateway", async (req, res) => {
  const configuredSecret = String(
    process.env.APSTREAM_AI_SECRET || ""
  ).trim();

  const authHeader = String(
    req.headers.authorization || ""
  ).trim();

  const providedSecret = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : String(req.headers["x-apstream-ai-secret"] || "").trim();

  if (!configuredSecret || providedSecret !== configuredSecret) {
    return res.status(401).json({
      status: "ERROR",
      gateway: "AP-STREAM AI Gateway",
      message: "AP-STREAM AI gateway authentication required."
    });
  }

  const { input, instructions, model } = req.body || {};

  if (!input || typeof input !== "string") {
    return res.status(400).json({
      status: "ERROR",
      message: "AI input is required."
    });
  }

  try {
    const response = await generateAI({
      input,
      instructions,
      model
    });

    return res.json({
      status: "OK",
      gateway: "AP-STREAM AI Gateway",
      result: response.output_text || ""
    });
  } catch (error) {
    console.error("AP-STREAM gateway error:", error);

    return res.status(503).json({
      status: "ERROR",
      gateway: "AP-STREAM AI Gateway",
      message: error?.message || "AI provider unavailable."
    });
  }
});

app.get("/api/ai/gateway-status", (req, res) => {
  res.json({
    status: "OK",
    gateway: "AP-STREAM AI Gateway",
    externalGatewayConfigured: Boolean(
      String(process.env.APSTREAM_AI_GATEWAY_URL || "").trim()
    )
  });
});

app.post("/api/ai/general", async (req, res) => {
  const { message, messages, history } = req.body || {};

  try {
    const response = await generalAI({
      message,
      messages,
      history
    });

    const cloudJob = createJob({
      type: "ai-general",
      name: "AP-STREAM AI General Request",
      status: "completed",
      metadata: {
        messageLength: typeof message === "string" ? message.length : 0,
        historyMessages: Array.isArray(history) ? history.length : 0,
        responseGenerated: Boolean(response?.output_text)
      }
    });

    return res.json({
      status: "OK",
      result: response.output_text || "I couldn't generate a response.",
      cloudJob: {
        id: cloudJob.id,
        type: cloudJob.type,
        status: cloudJob.status
      }
    });
  } catch (error) {
    console.error("General AI gateway error:", error);

    return res.status(500).json({
      status: "ERROR",
      message: "General AI could not respond right now.",
      debug: {
        provider: "ap-stream-gateway",
        message: error?.message || "Unknown AI gateway error"
      }
    });
  }
});

app.post("/api/ai/tool", async (req, res) => {
  try {
    const { tool, topic, language = "English", musicStyle = "Afrobeat", duration = "60 seconds" } = req.body || {};

    if (!tool || !String(tool).trim()) {
      return res.status(400).json({
        status: "ERROR",
        message: "Please choose an AI tool."
      });
    }

    const idea = String(topic || "Create something useful for AP-STREAM creators.").slice(0, 6000);

    const toolInstructions = {
      writer:
        "Act as an AI writer. Create polished original content from the user's idea. Include a strong opening, useful main content and a clear ending.",
      video:
        "Act as an AI video planner. Create a production-ready plan with a hook, script, scene-by-scene visual direction, narration, dialogue where useful, and ending.",
      music:
        "Act as a music production assistant. Develop an original song concept including theme, mood, structure, chorus direction, instrumentation and production ideas. Do not copy existing songs.",
      image:
        "Act as an image-prompt specialist. Create detailed original prompts for thumbnails, artwork or visual scenes. Include subject, composition, setting, lighting, mood and style.",
      voice:
        "Act as a voice-over script writer. Create a natural, engaging narration script with an attention-grabbing opening and memorable ending.",
      social:
        "Act as a social media assistant. Create original captions, hooks, post ideas and calls to action suitable for AP-STREAM.",
      study:
        "Act as a friendly study assistant. Explain the requested topic clearly, step by step, with simple examples and a short recap.",
      business:
        "Act as a creator-business assistant. Turn the idea into a practical project plan including audience, value proposition, content, growth ideas and next steps.",
      ebook:
        "Act as an original eBook writing assistant. Create a strong title, subtitle, book concept, chapter outline and well-structured chapters based on the user's idea. Keep the writing original and coherent. Do not copy existing books or copyrighted works."
    };

    const instructions =
      toolInstructions[tool] ||
      "Act as a helpful AP-STREAM creative assistant and produce an original useful response.";

    const response = await textAI({
      model: "Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M",
      instructions:
        `You are an AP-STREAM AI specialist.
${instructions}
` +
        `Language: ${language}.
Music style: ${musicStyle}.
Duration: ${duration}.
` +
        "Keep content original, useful, age-appropriate and safe.",
      input: idea
    });

    const cloudJob = createJob({
      type: "ai-tool",
      name: `AP-STREAM AI Tool: ${tool}`,
      status: "completed",
      metadata: {
        tool,
        topicLength: idea.length,
        language,
        musicStyle,
        duration,
        responseGenerated: Boolean(response?.output_text)
      }
    });

    return res.json({
      status: "OK",
      tool,
      result: response.output_text || "No result was generated.",
      cloudJob: {
        id: cloudJob.id,
        type: cloudJob.type,
        status: cloudJob.status
      }
    });
  } catch (error) {
    console.error("AP-STREAM AI Tool error:", error);

    return res.status(500).json({
      status: "ERROR",
      message:
        error?.status === 429
          ? "AI service is currently unavailable or has no available credits."
          : "AP-STREAM AI could not generate this content right now."
    });
  }
});

app.post("/api/ai/song", async (req, res) => {
  try {
    const { topic, musicStyle } = req.body || {};

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        status: "ERROR",
        message: "Song idea is required."
      });
    }

    const response = await textAI({
      model: "Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M",
      input: `Create completely original song lyrics.

Song idea: ${topic.trim()}
Music style: ${musicStyle || "Afrobeat"}

Return JSON with:
verse1
chorus
verse2
bridge

Do not copy or imitate existing songs.`
    });

    let lyrics;

    try {
      lyrics = JSON.parse(response.output_text);
    } catch {
      lyrics = {
        verse1: response.output_text,
        chorus: "",
        verse2: "",
        bridge: ""
      };
    }
    const cloudJob = createJob({
      type: "ai-song",
      name: "AP-STREAM AI Song Generation",
      status: "completed",
      metadata: {
        topicLength: topic.trim().length,
        musicStyle: musicStyle || "Afrobeat",
        responseGenerated: Boolean(response?.output_text)
      }
    });

    res.json({
      status: "OK",
      lyrics,
      cloudJob: {
        id: cloudJob.id,
        type: cloudJob.type,
        status: cloudJob.status
      }
    });
  } catch (error) {
    console.error("AI Song error:", error);

    res.status(500).json({
      status: "ERROR",
      message: "Could not generate the song."
    });
  }
});

 
app.post("/api/ai/creative", async (req, res) => {
  try {
    const { tool, topic, musicStyle, duration, language } = req.body || {};

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        status: "ERROR",
        message: "An idea is required."
      });
    }

    const idea = topic.trim();
    const style = musicStyle || "Afrobeat";
    const length = duration || "60 seconds";
    const selectedLanguage = language || "English";

    const lang = selectedLanguage.toLowerCase();

    const isSwahili = lang.includes("kiswahili") || lang.includes("swahili");
    const isLuganda = lang.includes("luganda");
    const isAteso = lang.includes("ateso");

    const labels = isSwahili ? {
      social: "CHAPISHO YA AP-STREAM",
      story: "HADITHI / SCRIPT YA AP-STREAM",
      voice: "SCRIPT YA SAUTI YA AP-STREAM",
      thumbnail: "WAZO LA THUMBNAIL LA AP-STREAM",
      cover: "JALADA LA AP-STREAM"
    } : isLuganda ? {
      social: "POSTI YA AP-STREAM",
      story: "MUGENDO / SCRIPT YA AP-STREAM",
      voice: "SCRIPT Y'OKWOGERA YA AP-STREAM",
      thumbnail: "EKIFANANYI KYA THUMBNAIL YA AP-STREAM",
      cover: "JALADA LYA AP-STREAM"
    } : isAteso ? {
      social: "AP-STREAM SOCIAL POST",
      story: "AP-STREAM STORY / SCRIPT",
      voice: "AP-STREAM VOICE SCRIPT",
      thumbnail: "AP-STREAM THUMBNAIL",
      cover: "AP-STREAM COVER ART"
    } : {
      social: "AP-STREAM SOCIAL POST",
      story: "AP-STREAM SHORT STORY / SCRIPT",
      voice: "AP-STREAM VOICE SCRIPT",
      thumbnail: "AP-STREAM THUMBNAIL CONCEPT",
      cover: "AP-STREAM COVER ART CONCEPT"
    };

    if (tool === "ai_idea") {
      const response = await textAI({
        model: "Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M",
        input: `Create one original and practical creative concept for AP-STREAM.

Idea: ${idea}
Music style: ${style}
Video duration: ${length}
Language: ${selectedLanguage}

Return JSON with exactly these fields:
title
concept
hook
audience
nextStep

Make the concept fresh, creator-friendly and suitable for a music, video,
social or community platform. Do not copy existing songs, scripts, brands,
or copyrighted creative works.`
      });

      let result;

      try {
        result = JSON.parse(response.output_text);
      } catch {
        result = {
          title: "AP-STREAM Creative Idea",
          concept: response.output_text,
          hook: "",
          audience: "",
          nextStep: ""
        };
      }

      const cloudJob = createJob({
        type: "ai-creative",
        name: "AP-STREAM AI Creative: ai_idea",
        status: "completed",
        metadata: {
          tool: "ai_idea",
          topicLength: idea.length,
          musicStyle: style,
          duration: length,
          language: selectedLanguage,
          responseGenerated: Boolean(response?.output_text)
        }
      });

      return res.json({
        status: "OK",
        mode: "ap-stream-local-qwen",
        tool: "ai_idea",
        result,
        cloudJob: {
          id: cloudJob.id,
          type: cloudJob.type,
          status: cloudJob.status
        }
      });
    }

    const creativeTool = tool || "social";

    const creativePrompts = {
      social: `Create an original AP-STREAM social media post.

Idea: ${idea}
Music style: ${style}
Duration: ${length}
Language: ${selectedLanguage}

Write a concise, engaging social post suitable for AP-STREAM.
Include a strong hook, useful body text, and a short call to action.
Use the requested language.
Do not copy existing posts, songs, scripts, brands, or copyrighted text.`,

      story: `Create an original short video story/script for AP-STREAM.

Idea: ${idea}
Music style: ${style}
Duration: ${length}
Language: ${selectedLanguage}

Structure it as:
TITLE
OPENING
SCENE 1
SCENE 2
SCENE 3
ENDING

Make the scenes practical for a creator to film.
Use the requested language.
Do not copy existing stories or copyrighted scripts.`,

      voice: `Create an original voice-over script for an AP-STREAM creator video.

Idea: ${idea}
Music style: ${style}
Duration: ${length}
Language: ${selectedLanguage}

Write natural spoken narration with a strong opening,
clear middle section, and short ending call to action.
Keep it suitable for the requested duration.
Use the requested language.`,

      thumbnail: `Create a professional thumbnail concept for an AP-STREAM video.

Idea: ${idea}
Language: ${selectedLanguage}

Return:
TITLE
MAIN SUBJECT
VISUAL DIRECTION
HEADLINE
SECONDARY TEXT
COMPOSITION

Make it visually clear, modern, creator-friendly and suitable
for an African-focused digital media platform.
This is a thumbnail DESIGN PROMPT, not an actual image.`,

      cover: `Create a professional album-cover concept for AP-STREAM.

Title: ${idea}
Music style: ${style}
Language: ${selectedLanguage}

Return:
TITLE
ART DIRECTION
MAIN SUBJECT
COLOR/MOOD
TYPOGRAPHY
COMPOSITION

Make it original, modern and suitable for an African music platform.
This is a COVER ART DESIGN PROMPT, not an actual image.`
    };

    const prompt =
      creativePrompts[creativeTool] || creativePrompts.social;

    const response = await textAI({
      model: "Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M",
      input: prompt
    });

    const result = String(response?.output_text || "").trim();

    if (!result) {
      throw new Error("AP-STREAM AI returned an empty creative result.");
    }

    const cloudJob = createJob({
      type: "ai-creative",
      name: `AP-STREAM AI Creative: ${tool || "social"}`,
      status: "completed",
      metadata: {
        tool: tool || "social",
        topicLength: idea.length,
        musicStyle: style,
        duration: length,
        language: selectedLanguage,
        responseGenerated: Boolean(result)
      }
    });

    res.json({
      status: "OK",
      mode: "ap-stream-local-qwen",
      tool: tool || "social",
      result,
      cloudJob: {
        id: cloudJob.id,
        type: cloudJob.type,
        status: cloudJob.status
      }
    });

  } catch (error) {
    console.error("Local AI Creative error:", error);

    res.status(500).json({
      status: "ERROR",
      message: error.message || "Could not create the creative content."
    });
  }
});

app.use('/api/hub', require('./routes/hub'));
app.use('/api/places', require('./routes/places'));
app.use('/api/businesses', require('./routes/businesses'));
app.use('/api', require('./routes/reviews'));
app.use('/api', require('./routes/business_items'));
app.use('/api', require('./routes/search'));
app.use('/api', require('./routes/cloud'));
app.use('/api', require('./routes/cloud_upload'));
app.use('/api/artists', require('./routes/artist'));
app.use('/api/shorts', require('./routes/shorts'));
app.use('/api', require('./routes/social'));
app.use('/api', require('./routes/messages'));
app.use('/uploads/music', express.static(musicUploadDir));
app.use('/uploads/cloud', express.static(path.join(__dirname, 'uploads', 'cloud')));
app.use('/uploads/shorts', require('express').static(require('path').join(__dirname, 'uploads', 'shorts')));

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`AP Stream backend running on port ${PORT}`);
});

