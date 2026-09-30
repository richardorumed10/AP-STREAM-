const upstreams = [
  {
    id: "UPSTREAM-LAB-001",
    name: "AP-STREAM Global Transit Lab",
    type: "simulated-transit",
    status: "available",
    asn: "AS65001",
    address: "192.0.2.1",
    prefix: "0.0.0.0/0",
    latency_ms: 20
  }
];

function getUpstreams() {
  return upstreams;
}

module.exports = {
  getUpstreams
};
