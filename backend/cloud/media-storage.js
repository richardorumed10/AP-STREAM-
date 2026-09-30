const fs = require("fs");
const path = require("path");

const backendRoot = path.resolve(__dirname, "..");

const mediaDirectories = {
  music: path.join(backendRoot, "uploads", "music"),
  shorts: path.join(backendRoot, "uploads", "shorts"),
  videos: path.join(backendRoot, "uploads", "videos")
};

function inspectDirectory(dir) {
  try {
    if (!fs.existsSync(dir)) {
      return {
        exists: false,
        files: 0,
        bytes: 0
      };
    }

    const files = fs.readdirSync(dir, { withFileTypes: true })
      .filter(entry => entry.isFile());

    let bytes = 0;

    for (const file of files) {
      try {
        bytes += fs.statSync(path.join(dir, file.name)).size;
      } catch (_) {}
    }

    return {
      exists: true,
      files: files.length,
      bytes
    };
  } catch (error) {
    return {
      exists: false,
      files: 0,
      bytes: 0,
      error: error.message
    };
  }
}

function formatMB(bytes) {
  return Math.round((bytes / 1024 / 1024) * 100) / 100;
}

function getMediaStorageStatus() {
  const music = inspectDirectory(mediaDirectories.music);
  const shorts = inspectDirectory(mediaDirectories.shorts);
  const videos = inspectDirectory(mediaDirectories.videos);

  const totalFiles = music.files + shorts.files + videos.files;
  const totalBytes = music.bytes + shorts.bytes + videos.bytes;

  return {
    service: "AP-STREAM Media & Storage",
    status: "online",
    media: {
      music,
      shorts,
      videos
    },
    totals: {
      files: totalFiles,
      bytes: totalBytes,
      megabytes: formatMB(totalBytes)
    },
    storage: {
      music: `${music.files} files / ${formatMB(music.bytes)} MB`,
      shorts: `${shorts.files} files / ${formatMB(shorts.bytes)} MB`,
      videos: `${videos.files} files / ${formatMB(videos.bytes)} MB`
    }
  };
}

module.exports = { getMediaStorageStatus };
