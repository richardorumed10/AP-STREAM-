const { getRouterStatus } = require("./router");
const { getUpstreams } = require("./upstreams");

function getRouterNetworkStatus() {
  const router = getRouterStatus();
  const upstreams = getUpstreams();

  return {
    network: "AP-STREAM Global Network Lab",

    router: {
      ...router,
      upstreams: upstreams.map((upstream) => ({
        id: upstream.id,
        name: upstream.name,
        status: upstream.status,
        asn: upstream.asn,
        prefix: upstream.prefix,
        connection: "virtual"
      }))
    },

    connectivity: {
      mode: "virtual-lab",
      internet_access: false,
      forwarding: false,
      upstream_count: upstreams.length
    },

    timestamp: new Date().toISOString()
  };
}

module.exports = {
  getRouterNetworkStatus
};
