import { useState } from "react";

export default function AIAssistantManager() {
  const [open, setOpen] = useState(false);

  const features = [
    ["🎵", "Music", "Discover songs, artists and playlists"],
    ["⚽", "Football", "Fixtures, scores and football information"],
    ["🎮", "Games", "Football challenges, quizzes and games"],
    ["📰", "News", "Uganda, Africa, world and technology news"],
    ["🎤", "Artists", "Discover artists and creators"],
    ["🌍", "Community", "Connect with AP-STREAM users"],
    ["📞", "Calls", "Help with audio and video calls"],
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          right: "20px",
          bottom: "90px",
          zIndex: 9997,
          border: 0,
          borderRadius: "14px",
          padding: "12px 16px",
          background: "#111",
          color: "#fff",
          fontWeight: "700",
          cursor: "pointer",
          boxShadow: "0 8px 25px rgba(0,0,0,.2)"
        }}
      >
        🤖 AI Manager
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(0,0,0,.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "15px"
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "650px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: "20px",
              padding: "22px",
              boxShadow: "0 20px 60px rgba(0,0,0,.3)"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px"
              }}
            >
              <div>
                <h2 style={{ margin: 0 }}>🤖 AI Assistant Manager</h2>
                <p style={{ margin: "5px 0 0", opacity: .65 }}>
                  Manage and explore AP-STREAM AI
                </p>
              </div>

              <button
                onClick={() => setOpen(false)}
                style={{
                  border: 0,
                  background: "#eee",
                  borderRadius: "50%",
                  width: "38px",
                  height: "38px",
                  fontSize: "18px",
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                padding: "18px",
                borderRadius: "16px",
                background: "#f5f5f5",
                marginBottom: "18px"
              }}
            >
              <strong>🟢 Assistant Ready</strong>
              <p style={{ marginBottom: 0 }}>
                AP-STREAM AI can help users navigate music, football, games,
                news, artists, community and calls.
              </p>
            </div>

            <h3>AI Capabilities</h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                gap: "12px"
              }}
            >
              {features.map(([icon, title, description]) => (
                <div
                  key={title}
                  style={{
                    padding: "16px",
                    border: "1px solid #e5e5e5",
                    borderRadius: "14px"
                  }}
                >
                  <div style={{ fontSize: "26px" }}>{icon}</div>
                  <strong>{title}</strong>
                  <p style={{ margin: "6px 0 0", opacity: .7 }}>
                    {description}
                  </p>
                </div>
              ))}
            </div>

            <h3 style={{ marginTop: "24px" }}>Assistant Status</h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: "10px"
              }}
            >
              <div style={{ padding: "14px", background: "#f5f5f5", borderRadius: "12px" }}>
                <strong>🤖</strong>
                <br />
                Ready
              </div>

              <div style={{ padding: "14px", background: "#f5f5f5", borderRadius: "12px" }}>
                <strong>💬</strong>
                <br />
                Chat
              </div>

              <div style={{ padding: "14px", background: "#f5f5f5", borderRadius: "12px" }}>
                <strong>🌍</strong>
                <br />
                AP-STREAM
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              style={{
                width: "100%",
                marginTop: "22px",
                padding: "13px",
                border: 0,
                borderRadius: "12px",
                background: "#111",
                color: "#fff",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              Close Manager
            </button>
          </div>
        </div>
      )}
    </>
  );
}
