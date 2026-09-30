const crypto = require("crypto");

const ROUTER_ID =
  process.env.APSTREAM_ROUTER_ID || "APSTREAM-ROUTER-001";

const router = {
  id: ROUTER_ID,
  name: "AP-STREAM Virtual Core Router",
  status: "online",
  mode: "virtual-lab",

  interfaces: {
    wan: {
      status: "ready",
      address: null,
      role: "upstream"
    },

    lan: {
      status: "ready",
      address: "10.100.0.1/24",
      role: "apstream-lan"
    },

    loopback: {
      status: "ready",
      address: "10.255.0.1/32"
    }
  },

  routing: {
    protocol: "static-lab",
    forwarding: false,
    default_route: null,
    routes: [
      {
        destination: "10.100.0.0/24",
        next_hop: "direct",
        interface: "lan"
      }
    ]
  },

  upstreams: [],

  peers: [],

  telemetry: {
    packets: 0,
    bytes: 0,
    last_update: new Date().toISOString()
  },

  router_packet_id: crypto.randomUUID()
};

function getRouterStatus() {
  return {
    ...router,
    telemetry: {
      ...router.telemetry,
      last_update: new Date().toISOString()
    }
  };
}

module.exports = {
  getRouterStatus
};
