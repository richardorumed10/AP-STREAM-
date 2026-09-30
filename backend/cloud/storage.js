const fs = require("fs");
const path = require("path");

const storageRoot = path.resolve(__dirname, "..");

function bytesToMB(bytes) {
  return Math.round((bytes / 1024 / 1024) * 100) / 100;
}

function getDirectorySize(dir) {
  if (!fs.existsSync(dir)) return 0;

  let total = 0;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    try {
      if (entry.isFile()) {
        total += fs.statSync(fullPath).size;
      } else if (entry.isDirectory()) {
        total += getDirectorySize(fullPath);
      }
    } catch (_) {}
  }

  return total;
}

function getCloudStorageStatus() {
  return {
    service: "AP-STREAM Cloud Storage",
    status: "online",
    storage: {
      root: storageRoot,
      mediaBytes: getDirectorySize(path.join(storageRoot, "uploads")),
      mediaMB: bytesToMB(
        getDirectorySize(path.join(storageRoot, "uploads"))
      )
    },
    filesystem: {
      available: "local filesystem",
      mode: "active"
    }
  };
}

module.exports = { getCloudStorageStatus };
