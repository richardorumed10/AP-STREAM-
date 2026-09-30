const { dnsRecords } = require("./private-dns");

function getServiceRegistry() {
  return Object.entries(dnsRecords).reduce((services, [hostname, record]) => {
    const key = hostname.replace(".internal.ap-stream", "");

    services[key] = {
      id: `apstream-${key}`,
      name: record.service,
      hostname,
      address: record.address,
      namespace: "internal.ap-stream",
      status: "registered"
    };

    return services;
  }, {});
}

function getService(serviceName) {
  const services = getServiceRegistry();
  const key = String(serviceName || "")
    .trim()
    .toLowerCase();

  return services[key] || null;
}

function getServiceEndpoint(serviceName, protocol = "http", port = null) {
  const service = getService(serviceName);

  if (!service) {
    return null;
  }

  const endpoint = {
    ...service,
    protocol
  };

  if (port !== null && port !== undefined) {
    endpoint.port = Number(port);
    endpoint.url = `${protocol}://${service.address}:${Number(port)}`;
  }

  return endpoint;
}

function getServiceRegistryStatus() {
  const services = getServiceRegistry();

  return {
    service: "AP-STREAM Service Registry",
    status: "online",
    mode: "dns-backed",
    namespace: "internal.ap-stream",
    serviceCount: Object.keys(services).length,
    services
  };
}

module.exports = {
  getServiceRegistry,
  getService,
  getServiceEndpoint,
  getServiceRegistryStatus
};
