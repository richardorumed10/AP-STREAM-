const os = require("os");
const crypto = require("crypto");

const CORE_ID =
  process.env.APSTREAM_NETWORK_CORE_ID || "APSTREAM-NETCORE-001";

function getInterfaces() {
  const interfaces = os.networkInterfaces();
  const result = [];

  for (const [name, addresses] of Object.entries(interfaces)) {
    for (const address of addresses || []) {
      result.push({
        name,
        address: address.address,
        family: address.family,
        internal: address.internal,
        cidr: address.cidr
      });
    }
  }

  return result;
}

function getNetworkCoreStatus() {
  return {
    network_core: {
      id: CORE_ID,
      status: "online",
      role: "software-network-core",
      platform: process.platform,
      architecture: process.arch,
      hostname: os.hostname(),
      uptime_seconds: Math.floor(os.uptime()),
      interfaces: getInterfaces()
    },

    routing: {
      status: "ready",
      mode: "local-control",
      upstream: "not-configured",
      peering: "not-configured"
    },

    services: {
      dns: "managed-by-ap-stream",
      service_registry: "available",
      network_health: "available",
      telemetry: "available",
      monitoring: "available"
    },

    security: {
      control_plane: "enabled",
      external_routing: false,
      forwarding: false
    },

    packet_id: crypto.randomUUID(),
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  getNetworkCoreStatus
};
