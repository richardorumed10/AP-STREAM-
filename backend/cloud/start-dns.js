const { spawn, execSync } = require("child_process");
const path = require("path");

const dnsServer = path.join(__dirname, "dns-server.js");
const port = Number(process.env.APSTREAM_DNS_PORT || 8053);

function getExistingPid() {
  try {
    const output = execSync("pgrep -f 'node cloud/dns-server.js' 2>/dev/null", {
      encoding: "utf8"
    }).trim();

    if (!output) return null;

    const pids = output
      .split(/\s+/)
      .map(Number)
      .filter(Boolean);

    return pids[0] || null;
  } catch {
    return null;
  }
}

const existingPid = getExistingPid();

if (existingPid) {
  console.log(JSON.stringify({
    service: "AP-STREAM DNS",
    status: "already-online",
    pid: existingPid,
    port
  }, null, 2));

  process.exit(0);
}

const child = spawn(process.execPath, [dnsServer], {
  detached: true,
  stdio: "ignore",
  env: process.env
});

child.unref();

console.log(JSON.stringify({
  service: "AP-STREAM DNS",
  status: "started",
  pid: child.pid,
  port
}, null, 2));
