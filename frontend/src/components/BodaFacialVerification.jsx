import { useEffect, useRef, useState } from "react";

export default function BodaFacialVerification() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("not_started");

  async function startCamera() {
    if (!consent) {
      setStatus("consent_required");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("camera_unavailable");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user"
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraOn(true);
      setStatus("camera_ready");
    } catch {
      setStatus("camera_denied");
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setCameraOn(false);
  }

  function captureSelfie() {
    if (!cameraOn || !videoRef.current) return;

    setStatus("captured");
  }

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <section
      id="boda-verification"
      style={{
        padding: "50px 20px",
        background: "#f7f7f7"
      }}
    >
      <div
        style={{
          maxWidth: "650px",
          margin: "auto",
          background: "#fff",
          padding: "25px",
          borderRadius: "20px",
          boxShadow: "0 8px 30px rgba(0,0,0,.08)"
        }}
      >
        <h2>📷 Boda Rider Verification</h2>

        <p>
          Take a clear selfie to begin rider identity verification.
          Your camera will only be accessed after you give permission.
        </p>

        <label
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
            padding: "14px",
            background: "#f5f5f5",
            borderRadius: "12px",
            marginBottom: "18px"
          }}
        >
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
          />

          <span>
            I consent to AP-STREAM using my selfie for rider identity
            verification.
          </span>
        </label>

        <div
          style={{
            background: "#111",
            borderRadius: "16px",
            overflow: "hidden",
            aspectRatio: "4 / 3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {cameraOn ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }}
            />
          ) : (
            <div style={{ color: "#fff", textAlign: "center" }}>
              📷
              <br />
              Camera preview
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginTop: "15px"
          }}
        >
          {!cameraOn ? (
            <button
              onClick={startCamera}
              style={buttonStyle}
            >
              📷 Start Camera
            </button>
          ) : (
            <>
              <button
                onClick={captureSelfie}
                style={buttonStyle}
              >
                📸 Capture Selfie
              </button>

              <button
                onClick={stopCamera}
                style={{
                  ...buttonStyle,
                  background: "#eee",
                  color: "#111"
                }}
              >
                Stop
              </button>
            </>
          )}
        </div>

        {status === "consent_required" && (
          <p>⚠️ Please give consent before starting the camera.</p>
        )}

        {status === "camera_denied" && (
          <p>⚠️ Camera permission was not granted.</p>
        )}

        {status === "camera_unavailable" && (
          <p>⚠️ This browser does not support camera access.</p>
        )}

        {status === "captured" && (
          <div
            style={{
              marginTop: "18px",
              padding: "16px",
              borderRadius: "12px",
              background: "#f1f1f1"
            }}
          >
            <strong>📸 Selfie captured</strong>
            <p>
              Your selfie is ready for the verification stage.
              Actual identity matching requires the secure verification
              backend.
            </p>
          </div>
        )}

        <p
          style={{
            marginTop: "20px",
            fontSize: "13px",
            opacity: ".65"
          }}
        >
          🔒 Facial information is sensitive biometric data. AP-STREAM should
          only collect and process it with clear consent and appropriate
          security and retention controls.
        </p>
      </div>
    </section>
  );
}

const buttonStyle = {
  flex: 1,
  padding: "13px",
  border: 0,
  borderRadius: "10px",
  background: "#111",
  color: "#fff",
  fontWeight: "700",
  cursor: "pointer"
};
