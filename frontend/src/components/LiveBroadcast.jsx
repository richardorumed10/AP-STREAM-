import { useEffect, useRef, useState } from "react";

const STREAM_SERVER =
  import.meta.env.VITE_STREAM_SERVER ||
  `${window.location.protocol}//${window.location.hostname}:8889`;

const PATHS = {
  tv: "apstream-tv",
  radio: "apstream-radio",
};

export default function LiveBroadcast() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const pcRef = useRef(null);
  const resourceUrlRef = useRef(null);

  const [mode, setMode] = useState("tv");
  const [channel, setChannel] = useState("AP-STREAM TV");
  const [cameraFacing, setCameraFacing] = useState("user");
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [viewerCount, setViewerCount] = useState(0);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
    setMicOn(false);
  }

  async function startCamera() {
    stopCamera();

    const constraints =
      mode === "tv"
        ? {
            video: {
              facingMode: { ideal: cameraFacing },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30, max: 30 },
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          }
        : {
            video: false,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          };

    const stream =
      await navigator.mediaDevices.getUserMedia(constraints);

    streamRef.current = stream;

    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();

    setCameraOn(videoTracks.length > 0);
    setMicOn(audioTracks.length > 0);

    if (videoRef.current && videoTracks.length > 0) {
      videoRef.current.srcObject = stream;

      try {
        await videoRef.current.play();
      } catch (error) {
        console.log("Video play:", error);
      }
    }

    return stream;
  }

  async function publishToMediaMTX(stream, path) {
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    pcRef.current = pc;

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await new Promise((resolve) => {
      if (pc.iceGatheringState === "complete") {
        resolve();
        return;
      }

      const timer = setTimeout(resolve, 5000);

      function checkIce() {
        if (pc.iceGatheringState === "complete") {
          clearTimeout(timer);
          pc.removeEventListener(
            "icegatheringstatechange",
            checkIce
          );
          resolve();
        }
      }

      pc.addEventListener(
        "icegatheringstatechange",
        checkIce
      );
    });

    const response = await fetch(
      `${STREAM_SERVER}/${path}/whep`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/sdp",
        },
        body: pc.localDescription.sdp,
      }
    );

    if (!response.ok) {
      throw new Error(
        `MediaMTX returned HTTP ${response.status}`
      );
    }

    const answer = await response.text();

    resourceUrlRef.current =
      response.headers.get("Location");

    await pc.setRemoteDescription({
      type: "answer",
      sdp: answer,
    });

    return pc;
  }

  async function startBroadcast() {
    if (isLive) return;

    if (!channel.trim()) {
      setStatus("⚠️ Enter a channel name");
      return;
    }

    try {
      setStatus(
        mode === "tv"
          ? "📷 Requesting camera and microphone..."
          : "🎙️ Requesting microphone..."
      );

      const stream = await startCamera();

      setStatus("📡 Connecting to MediaMTX...");

      await publishToMediaMTX(
        stream,
        PATHS[mode]
      );

      setIsLive(true);

      setStatus(
        mode === "tv"
          ? "🟢 LIVE — AP-STREAM TV"
          : "🟢 LIVE — AP-STREAM RADIO"
      );
    } catch (error) {
      console.error("Broadcast error:", error);

      setStatus(
        `❌ Broadcast failed: ${
          error?.message || "Unknown error"
        }`
      );

      await stopBroadcast();
    }
  }

  async function stopBroadcast() {
    try {
      if (resourceUrlRef.current) {
        await fetch(resourceUrlRef.current, {
          method: "DELETE",
        }).catch(() => {});
      }
    } catch {}

    resourceUrlRef.current = null;

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    stopCamera();

    setIsLive(false);
    setViewerCount(0);
    setStatus("Broadcast stopped");
  }

  function toggleMic() {
    const stream = streamRef.current;

    if (!stream) return;

    const tracks = stream.getAudioTracks();

    tracks.forEach((track) => {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    });
  }

  function toggleCamera() {
    if (mode !== "tv") return;

    const stream = streamRef.current;

    if (!stream) return;

    const tracks = stream.getVideoTracks();

    tracks.forEach((track) => {
      track.enabled = !track.enabled;
      setCameraOn(track.enabled);
    });
  }

  function switchCamera() {
    if (mode !== "tv") return;

    if (isLive) {
      setStatus(
        "⛔ Stop the broadcast before switching camera"
      );
      return;
    }

    const next =
      cameraFacing === "user"
        ? "environment"
        : "user";

    setCameraFacing(next);

    setStatus(
      next === "user"
        ? "🤳 Front camera selected"
        : "📷 Back camera selected"
    );
  }

  function selectMode(nextMode) {
    if (isLive) return;

    setMode(nextMode);

    if (nextMode === "tv") {
      setChannel("AP-STREAM TV");
      setStatus("📺 TV mode selected");
    } else {
      setChannel("AP-STREAM RADIO");
      setStatus("📻 Radio mode selected");
    }
  }

  useEffect(() => {
    return () => {
      if (pcRef.current) {
        pcRef.current.close();
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <section
      style={{
        width: "100%",
        maxWidth: "1400px",
        margin: "20px auto",
        padding: "16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          padding: "20px",
          boxSizing: "border-box",
          borderRadius: "20px",
          background:
            "linear-gradient(135deg, #e8fff2, #ffeaf4)",
        }}
      >
        <h2>📡 AP-STREAM TV & RADIO</h2>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "15px",
          }}
        >
          <button
            disabled={isLive}
            onClick={() => selectMode("tv")}
          >
            📺 TV
          </button>

          <button
            disabled={isLive}
            onClick={() => selectMode("radio")}
          >
            📻 RADIO
          </button>
        </div>

        <input
          value={channel}
          disabled={isLive}
          onChange={(e) => setChannel(e.target.value)}
          placeholder={
            mode === "tv"
              ? "Enter TV channel name"
              : "Enter radio station name"
          }
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "15px",
            boxSizing: "border-box",
            borderRadius: "12px",
            border: "1px solid #bbb",
            fontSize: "16px",
          }}
        />

        {mode === "tv" ? (
          <div
            style={{
              width: "100%",
              aspectRatio: "16 / 9",
              minHeight: "320px",
              background: "#111",
              borderRadius: "16px",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                objectFit: "cover",
                background: "#111",
              }}
            />

            {!cameraOn && !isLive && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  color: "white",
                  fontSize: "24px",
                  padding: "20px",
                }}
              >
                📺 AP-STREAM TV
                <br />
                Camera preview
              </div>
            )}

            {isLive && (
              <div
                style={{
                  position: "absolute",
                  top: "15px",
                  left: "15px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background: "#d00000",
                  color: "white",
                  fontWeight: "800",
                }}
              >
                🔴 LIVE
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              width: "100%",
              minHeight: "320px",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              fontSize: "30px",
              fontWeight: "800",
              background:
                "linear-gradient(135deg, #e8fff2, #ffeaf4)",
            }}
          >
            📻 AP-STREAM RADIO
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginTop: "15px",
          }}
        >
          {!isLive ? (
            <button
              onClick={startBroadcast}
            >
              ▶️ Start {mode === "tv" ? "TV" : "Radio"}
            </button>
          ) : (
            <button
              onClick={stopBroadcast}
            >
              ⏹️ Stop Broadcast
            </button>
          )}

          {mode === "tv" && (
            <>
              <button
                disabled={!streamRef.current}
                onClick={toggleCamera}
              >
                {cameraOn
                  ? "📷 Camera Off"
                  : "📷 Camera On"}
              </button>

              <button
                disabled={isLive}
                onClick={switchCamera}
              >
                🔄 Switch Front/Back
              </button>
            </>
          )}

          <button
            disabled={!streamRef.current}
            onClick={toggleMic}
          >
            {micOn
              ? "🎙️ Mute Mic"
              : "🔇 Unmute Mic"}
          </button>
        </div>

        <div
          style={{
            marginTop: "18px",
            padding: "15px",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.7)",
            lineHeight: "1.8",
          }}
        >
          <strong>Status:</strong> {status}
          <br />
          <strong>Channel:</strong> {channel}
          <br />
          <strong>Viewers / Listeners:</strong>{" "}
          {viewerCount}
          <br />
          <strong>MediaMTX:</strong>{" "}
          {STREAM_SERVER}
        </div>
      </div>
    </section>
  );
}
