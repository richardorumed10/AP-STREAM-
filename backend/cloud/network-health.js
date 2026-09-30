const { performance } = require("perf_hooks");

async function checkEndpoint(name, url) {
  const started = performance.now();

  try {
    const response = await fetch(url);
    const latencyMs = Math.round((performance.now() - started) * 100) / 100;

    return {
      name,
      status: response.ok ? "online" : "degraded",
      httpStatus: response.status,
      latencyMs
    };
  } catch (error) {
    return {
      name,
      status: "offline",
      httpStatus: null,
      latencyMs: null
    };
  }
}

async function getNetworkHealthStatus() {
  const port = Number(process.env.PORT || 5000);
  const base = `http://127.0.0.1:${port}`;

  const checks = await Promise.all([
    checkEndpoint("Cloud Control", `${base}/api/cloud/status`),
    checkEndpoint("Compute", `${base}/api/cloud/compute`),
    checkEndpoint("Storage", `${base}/api/cloud/storage`),
    checkEndpoint("AI", `${base}/api/cloud/ai-status`),
    checkEndpoint("Security", `${base}/api/cloud/security-status`)
  ]);

  const online = checks.filter(item => item.status === "online").length;

  return {
    service: "AP-STREAM Network Health",
    status: online === checks.length ? "online" : online > 0 ? "degraded" : "offline",
    checks,
    summary: {
      total: checks.length,
      online,
      offline: checks.filter(item => item.status === "offline").length,
      averageLatencyMs: checks.length
        ? Math.round(
            checks
              .filter(item => item.latencyMs !== null)
              .reduce((sum, item) => sum + item.latencyMs, 0) /
            Math.max(checks.filter(item => item.latencyMs !== null).length, 1) * 100
          ) / 100
        : null
    }
  };
}

module.exports = { getNetworkHealthStatus };
