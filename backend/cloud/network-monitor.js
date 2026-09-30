const os = require("os");

const startedAt = Date.now();

function getNetworkMonitorStatus() {
  const memory = process.memoryUsage();

  return {
    service: "AP-STREAM Network & Monitoring",
    status: "online",

    network: {
      api: "online",
      httpPort: Number(process.env.PORT || 5000),
      interfaces: Object.keys(os.networkInterfaces()).length
    },

    monitoring: {
      processUptimeSeconds: Math.floor(process.uptime()),
      cloudUptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      memoryUsedMB: Math.round(memory.rss / 1024 / 1024),
      heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
      loadAverage: os.loadavg()
    },

    services: {
      api: "running",
      cloudControlPlane: "running",
      compute: "running",
      mediaStorage: "running"
    }
  };
}

module.exports = { getNetworkMonitorStatus };
