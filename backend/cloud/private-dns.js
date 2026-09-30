const dnsRecords = {
  "api.internal.ap-stream": {
    service: "API",
    address: "10.100.10.10"
  },
  "ai.internal.ap-stream": {
    service: "AI Gateway",
    address: "10.100.10.20"
  },
  "cloud.internal.ap-stream": {
    service: "Cloud Control",
    address: "10.100.10.30"
  },
  "media.internal.ap-stream": {
    service: "Media",
    address: "10.100.10.40"
  },
  "core.internal.ap-stream": {
    service: "Network Core",
    address: "10.100.20.10"
  }
};

function getPrivateDnsStatus() {
  return {
    service: "AP-STREAM Private DNS",
    status: "software-ready",
    namespace: "internal.ap-stream",
    resolver: "application-resolver",
    records: dnsRecords,
    recordCount: Object.keys(dnsRecords).length,
    note: "Logical DNS configuration only; no system DNS changes have been made."
  };
}

module.exports = {
  getPrivateDnsStatus,
  dnsRecords
};
