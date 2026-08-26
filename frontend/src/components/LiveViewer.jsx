import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function LiveViewer({ liveId }) {
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    if (!liveId) return;

    const socket = io(
      `${window.location.protocol}//${window.location.hostname}:5000`
    );

    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("Joining live...");
      socket.emit("live:join", { liveId });
    });

    socket.on("live:joined", () => {
      setStatus("Waiting for video...");
    });

    socket.on("live:signal", async ({ senderId, data }) => {
      try {
        if (data.type === "offer") {
          const peer = new RTCPeerConnection({
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" }
            ]
          });

          peerRef.current = peer;

          peer.ontrack = (event) => {
            if (videoRef.current) {
              videoRef.current.srcObject = event.streams[0];
              setStatus("🔴 LIVE");
            }
          };

          peer.onicecandidate = (event) => {
            if (event.candidate) {
              socket.emit("live:signal", {
                targetId: senderId,
                data: {
                  type: "candidate",
                  candidate: event.candidate
                }
              });
            }
          };

          await peer.setRemoteDescription(
            new RTCSessionDescription(data.offer)
          );

          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);

          socket.emit("live:signal", {
            targetId: senderId,
            data: {
              type: "answer",
              answer
            }
          });
        }

        if (data.type === "candidate" && peerRef.current) {
          await peerRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        }
      } catch (error) {
        console.error("Live viewer error:", error);
        setStatus("Unable to connect to live.");
      }
    });

    socket.on("live:ended", () => {
      setStatus("Live ended");
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    });

    socket.on("live:error", ({ message }) => {
      setStatus(message || "Live unavailable");
    });

    return () => {
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }

      socket.disconnect();
      socketRef.current = null;
    };
  }, [liveId]);

  return (
    <div className="live-viewer">
      <div className="live-viewer-status">{status}</div>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        controls={false}
        className="live-viewer-video"
      />
    </div>
  );
}
