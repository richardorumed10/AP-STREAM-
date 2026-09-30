const dgram = require("dgram");
const { dnsRecords } = require("./private-dns");

const HOST = process.env.APSTREAM_DNS_HOST || "0.0.0.0";
const PORT = Number(process.env.APSTREAM_DNS_PORT || 8053);

const server = dgram.createSocket("udp4");

function readDnsName(buffer, offset) {
  const labels = [];
  let pos = offset;

  while (pos < buffer.length) {
    const length = buffer[pos++];

    if (length === 0) {
      return {
        name: labels.join(".").toLowerCase(),
        nextOffset: pos
      };
    }

    if ((length & 0xc0) === 0xc0) {
      if (pos >= buffer.length) return null;

      const pointer = ((length & 0x3f) << 8) | buffer[pos++];
      const pointed = readDnsName(buffer, pointer);

      if (!pointed) return null;

      return {
        name: [...labels, pointed.name].join(".").toLowerCase(),
        nextOffset: pos
      };
    }

    if (length > 63 || pos + length > buffer.length) {
      return null;
    }

    labels.push(buffer.toString("ascii", pos, pos + length));
    pos += length;
  }

  return null;
}

function buildDnsResponse(query) {
  if (query.length < 12) return null;

  const transactionId = query.readUInt16BE(0);
  const question = readDnsName(query, 12);

  if (!question) return null;

  const typeOffset = question.nextOffset;

  if (typeOffset + 4 > query.length) return null;

  const qtype = query.readUInt16BE(typeOffset);
  const qclass = query.readUInt16BE(typeOffset + 2);

  console.log(
    `[AP-STREAM DNS] Query: ${question.name} type=${qtype} class=${qclass}`
  );

  const record = dnsRecords[question.name];

  let flags = 0x8000; // response

  if (!record) {
    flags |= 0x0003; // NXDOMAIN
  }

  const header = Buffer.alloc(12);

  header.writeUInt16BE(transactionId, 0);
  header.writeUInt16BE(flags, 2);
  header.writeUInt16BE(1, 4);
  header.writeUInt16BE(record && qtype === 1 && qclass === 1 ? 1 : 0, 6);
  header.writeUInt16BE(0, 8);
  header.writeUInt16BE(0, 10);

  const questionSection = query.subarray(12, typeOffset + 4);

  if (!record || qtype !== 1 || qclass !== 1) {
    return Buffer.concat([
      header,
      questionSection
    ]);
  }

  const ip = record.address.split(".").map(Number);

  if (
    ip.length !== 4 ||
    ip.some(value => !Number.isInteger(value) || value < 0 || value > 255)
  ) {
    return null;
  }

  const answer = Buffer.alloc(16);

  // NAME pointer to original QNAME
  answer.writeUInt16BE(0xc00c, 0);

  // TYPE A
  answer.writeUInt16BE(1, 2);

  // CLASS IN
  answer.writeUInt16BE(1, 4);

  // TTL
  answer.writeUInt32BE(60, 6);

  // IPv4 length
  answer.writeUInt16BE(4, 10);

  Buffer.from(ip).copy(answer, 12);

  return Buffer.concat([
    header,
    questionSection,
    answer
  ]);
}

server.on("message", (message, rinfo) => {
  console.log(
    `[AP-STREAM DNS] UDP packet received from ${rinfo.address}:${rinfo.port} (${message.length} bytes)`
  );

  try {
    const response = buildDnsResponse(message);

    if (!response) {
      console.log("[AP-STREAM DNS] Invalid DNS packet");
      return;
    }

    server.send(response, rinfo.port, rinfo.address, error => {
      if (error) {
        console.error("[AP-STREAM DNS] Send error:", error.message);
        return;
      }

      console.log(
        `[AP-STREAM DNS] Response sent to ${rinfo.address}:${rinfo.port}`
      );
    });
  } catch (error) {
    console.error("[AP-STREAM DNS] Packet error:", error.message);
  }
});

server.on("listening", () => {
  const address = server.address();

  console.log("=================================");
  console.log(" AP-STREAM DNS SERVER");
  console.log("=================================");
  console.log("Status: ONLINE");
  console.log("Protocol: DNS over UDP");
  console.log(`Host: ${address.address}`);
  console.log(`Port: ${address.port}`);
  console.log("Namespace: internal.ap-stream");
  console.log(`Records: ${Object.keys(dnsRecords).length}`);
  console.log("=================================");
});

server.on("error", error => {
  console.error("[AP-STREAM DNS] Server error:", error.message);
});

server.bind(PORT, HOST);
