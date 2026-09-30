const REGIONAL_ROUTERS = [
  {
    id: "APSTREAM-UG-CORE-001",
    name: "AP-STREAM Uganda Core",
    region: "East Africa",
    country: "Uganda",
    city: "Kampala",
    role: "regional-core",
    status: "online",
    mode: "virtual-lab",
    asn: "AS65001",
    loopback: "10.255.10.1/32",
    lan: "10.110.0.1/24",
    upstream: "APSTREAM-ROUTER-001",
    peers: []
  },
  {
    id: "APSTREAM-KE-CORE-001",
    name: "AP-STREAM Kenya Core",
    region: "East Africa",
    country: "Kenya",
    city: "Nairobi",
    role: "regional-core",
    status: "planned",
    mode: "virtual-lab",
    asn: "AS65001",
    loopback: "10.255.20.1/32",
    lan: "10.120.0.1/24",
    upstream: "APSTREAM-ROUTER-001",
    peers: ["APSTREAM-UG-CORE-001"]
  },
  {
    id: "APSTREAM-TZ-CORE-001",
    name: "AP-STREAM Tanzania Core",
    region: "East Africa",
    country: "Tanzania",
    city: "Dar es Salaam",
    role: "regional-core",
    status: "planned",
    mode: "virtual-lab",
    asn: "AS65001",
    loopback: "10.255.30.1/32",
    lan: "10.130.0.1/24",
    upstream: "APSTREAM-ROUTER-001",
    peers: ["APSTREAM-KE-CORE-001"]
  },
  {
    id: "APSTREAM-RW-CORE-001",
    name: "AP-STREAM Rwanda Core",
    region: "East Africa",
    country: "Rwanda",
    city: "Kigali",
    role: "regional-core",
    status: "planned",
    mode: "virtual-lab",
    asn: "AS65001",
    loopback: "10.255.40.1/32",
    lan: "10.140.0.1/24",
    upstream: "APSTREAM-ROUTER-001",
    peers: ["APSTREAM-UG-CORE-001"]
  }
];

function getRegionalRouters() {
  return REGIONAL_ROUTERS;
}

function getRegionalNetworkStatus() {
  return {
    network: "AP-STREAM Global Network Lab",
    router_count: REGIONAL_ROUTERS.length,
    online_count: REGIONAL_ROUTERS.filter(r => r.status === "online").length,
    planned_count: REGIONAL_ROUTERS.filter(r => r.status === "planned").length,
    routers: REGIONAL_ROUTERS,
    mode: "virtual-lab",
    internet_access: false,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  getRegionalRouters,
  getRegionalNetworkStatus
};
