import { useState } from "react";

export default function TVRadioHub() {
  const [mode, setMode] = useState("tv");
  const [tvUrl, setTvUrl] = useState("");
  const [radioUrl, setRadioUrl] = useState("");
  const [tvPlaying, setTvPlaying] = useState(false);
  const [radioPlaying, setRadioPlaying] = useState(false);

  return (
    <section
      id="tv-radio"
      style={{
        padding: "24px 16px",
        margin: "20px 0",
        borderRadius: "18px",
        background: "linear-gradient(135deg, #e9fff3, #ffeaf4)",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "18px" }}>
        <h2>📺 AP-STREAM TV & RADIO</h2>
        <p>Watch live television and listen to radio in one place.</p>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <button onClick={() => setMode("tv")}>
          📺 TV
        </button>

        <button onClick={() => setMode("radio")}>
          📻 Radio
        </button>
      </div>

      {mode === "tv" && (
        <div>
          <h3>🔴 AP-STREAM LIVE TV</h3>

          <div
            style={{
              background: "#111",
              borderRadius: "14px",
              overflow: "hidden",
              minHeight: "220px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "15px",
            }}
          >
            {tvUrl ? (
              <video
                src={tvUrl}
                controls
                autoPlay={tvPlaying}
                style={{ width: "100%", maxHeight: "500px" }}
              />
            ) : (
              <div style={{ color: "white", textAlign: "center", padding: "30px" }}>
                📺
                <br />
                <strong>AP-STREAM TV</strong>
                <br />
                Live channel ready
              </div>
            )}
          </div>

          <input
            type="url"
            placeholder="Paste your TV stream URL"
            value={tvUrl}
            onChange={(e) => setTvUrl(e.target.value)}
            style={{ width: "100%", padding: "12px", boxSizing: "border-box" }}
          />

          <button
            onClick={() => setTvPlaying(true)}
            style={{ marginTop: "10px" }}
          >
            ▶️ Start TV
          </button>
        </div>
      )}

      {mode === "radio" && (
        <div>
          <h3>🔴 AP-STREAM LIVE RADIO</h3>

          <div
            style={{
              padding: "30px 15px",
              textAlign: "center",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.65)",
              marginBottom: "15px",
            }}
          >
            <div style={{ fontSize: "48px" }}>📻</div>
            <h3>AP-STREAM RADIO</h3>
            <p>{radioPlaying ? "🔴 LIVE NOW" : "Ready to play"}</p>

            {radioUrl && (
              <audio
                src={radioUrl}
                controls
                autoPlay={radioPlaying}
                style={{ width: "100%" }}
              />
            )}
          </div>

          <input
            type="url"
            placeholder="Paste your radio stream URL"
            value={radioUrl}
            onChange={(e) => setRadioUrl(e.target.value)}
            style={{ width: "100%", padding: "12px", boxSizing: "border-box" }}
          />

          <button
            onClick={() => setRadioPlaying(true)}
            style={{ marginTop: "10px" }}
          >
            ▶️ Start Radio
          </button>
        </div>
      )}

      <div
        style={{
          marginTop: "22px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "10px",
        }}
      >
        <div>
          📺 <strong>TV Channels</strong>
          <br />
          Live & on-demand
        </div>

        <div>
          📻 <strong>Radio Stations</strong>
          <br />
          Music & talk
        </div>

        <div>
          🔴 <strong>Live</strong>
          <br />
          Broadcast center
        </div>
      </div>
    </section>
  );
}
