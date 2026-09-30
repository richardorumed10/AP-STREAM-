const os = require("os");

function getComputeStatus() {
  const cpus = os.cpus() || [];
  const memory = process.memoryUsage();

  return {
    service: "AP-STREAM Compute",
    status: "online",
    runtime: {
      platform: process.platform,
      architecture: process.arch,
      cpuCores: Math.max(cpus.length, 1),
      loadAverage: os.loadavg(),
      nodeUptimeSeconds: Math.floor(process.uptime()),
      memoryUsedMB: Math.round(memory.rss / 1024 / 1024),
      memoryHeapUsedMB: Math.round(memory.heapUsed / 1024 / 1024)
    },
    workloads: {
      api: "running",
      cloudControlPlane: "running"
    }
  };
}

module.exports = { getComputeStatus };
