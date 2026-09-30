const { dnsRecords } = require("./private-dns");

function normalizeHostname(hostname) {
  return String(hostname || "")
    .trim()
    .toLowerCase()
    .replace(/\.$/, "");
}

function resolvePrivateDns(hostname) {
  const normalized = normalizeHostname(hostname);
  const record = dnsRecords[normalized];

  if (!record) {
    return {
      hostname: normalized,
      found: false,
      address: null,
      service: null
    };
  }

  return {
    hostname: normalized,
    found: true,
    address: record.address,
    service: record.service
  };
}

function getDnsResolverStatus() {
  return {
    service: "AP-STREAM DNS Resolver",
    status: "online",
    mode: "application-resolver",
    namespace: "internal.ap-stream",
    recordCount: Object.keys(dnsRecords).length,
    records: dnsRecords,
    note: "Resolves AP-STREAM internal records for application services. It is not yet the Android/system DNS resolver."
  };
}

module.exports = {
  resolvePrivateDns,
  getDnsResolverStatus
};
