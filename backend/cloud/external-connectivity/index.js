const EXTERNAL_SERVICES = [
  {
    id: "google",
    name: "Google",
    category: "web-services",
    status: "available",
    integration: "web-and-api",
    website: "https://www.google.com"
  },
  {
    id: "chrome",
    name: "Google Chrome",
    category: "browser",
    status: "device-dependent",
    integration: "android-browser"
  },
  {
    id: "firefox",
    name: "Mozilla Firefox",
    category: "browser",
    status: "device-dependent",
    integration: "android-browser",
    website: "https://www.mozilla.org/firefox/"
  },
  {
    id: "yahoo",
    name: "Yahoo",
    category: "web-and-mail",
    status: "available",
    integration: "web-and-api",
    website: "https://www.yahoo.com"
  },
  {
    id: "microsoft",
    name: "Microsoft",
    category: "cloud-services",
    status: "available",
    integration: "web-and-api",
    website: "https://www.microsoft.com"
  },
  {
    id: "excel",
    name: "Microsoft Excel",
    category: "productivity",
    status: "available",
    integration: "file-import-export",
    website: "https://www.microsoft.com/microsoft-365/excel"
  }
];

function getExternalServices() {
  return EXTERNAL_SERVICES;
}

function getExternalConnectivityStatus() {
  return {
    system: "AP-STREAM External Connectivity",
    status: "online",
    mode: "integration-layer",
    services: EXTERNAL_SERVICES,
    capabilities: {
      web_access: true,
      api_integrations: true,
      browser_launch: true,
      file_import_export: true,
      android_intents: true
    },
    note: "External services remain independently operated. AP-STREAM provides the integration layer.",
    timestamp: new Date().toISOString()
  };
}

function getExternalService(id) {
  return EXTERNAL_SERVICES.find(service => service.id === String(id).toLowerCase()) || null;
}

module.exports = {
  getExternalServices,
  getExternalConnectivityStatus,
  getExternalService
};
