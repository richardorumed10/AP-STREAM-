import { useEffect, useRef, useState } from "react";

export default function RecordingStudio() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  async function startRecording() {
    setError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone recording is not available in this browser/context.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }

        const newAudioUrl = URL.createObjectURL(blob);
        setAudioUrl(newAudioUrl);

        window.dispatchEvent(
          new CustomEvent("apstream-recording-ready", {
            detail: { audioUrl: newAudioUrl }
          })
        );

        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      recorder.start();
      setSeconds(0);
      setRecording(true);

      timerRef.current = setInterval(() => {
        setSeconds((value) => value + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone error:", err);
      setError("Microphone permission was denied or the microphone could not be opened.");
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (
      recorderRef.current &&
      recorderRef.current.state !== "inactive"
    ) {
      recorderRef.current.stop();
    }

    setRecording(false);
  }

  function deleteRecording() {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioUrl("");
    setSeconds(0);
  }

  function formatTime(value) {
    const minutes = Math.floor(value / 60);
    const remaining = value % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remaining
    ).padStart(2, "0")}`;
  }

  return (
    <section className="recording-studio">
      <div className="recording-header">
        <span>🎙️</span>
        <div>
          <h3>Recording Studio</h3>
          <p>Record vocals, narration or your own audio directly into AP-STREAM.</p>
        </div>
      </div>

      <div className="recording-controls">
        {!recording ? (
          <button onClick={startRecording}>
            🔴 Start Recording
          </button>
        ) : (
          <button onClick={stopRecording}>
            ⏹ Stop Recording
          </button>
        )}

        <strong>{formatTime(seconds)}</strong>
      </div>

      {recording && (
        <div className="recording-status">
          🔴 Recording from your microphone...
        </div>
      )}

      {error && (
        <div className="recording-error">
          ⚠️ {error}
        </div>
      )}

      {audioUrl && !recording && (
        <div className="recording-result">
          <h4>🎧 Your Recording</h4>

          <audio controls src={audioUrl}>
            Your browser does not support audio playback.
          </audio>

          <div className="recording-actions">
            <button onClick={() => setAudioUrl(audioUrl)}>
              🎵 Add to Music Project
            </button>

            <button onClick={() => setAudioUrl(audioUrl)}>
              🎬 Add to Video
            </button>

            <button onClick={deleteRecording}>
              🗑️ Delete
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
