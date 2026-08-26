import { useState } from "react";

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "👋 Hi! I'm the AP-STREAM AI Assistant. I can help you explore music, football, games, news and community features.",
    },
  ]);

  function askAssistant() {
    const text = message.trim();
    if (!text) return;

    const lower = text.toLowerCase();

    let reply =
      "🤖 I'm still learning AP-STREAM. Try asking about music, football, games, news, artists or calls.";

    if (lower.includes("football")) {
      reply =
        "⚽ AP-STREAM Football includes live matches, virtual gameplay, teams, scores, fixtures and commentary.";
    } else if (lower.includes("game")) {
      reply =
        "🎮 AP-STREAM Games lets you play football challenges, African quizzes and quick challenges.";
    } else if (lower.includes("music")) {
      reply =
        "🎵 You can discover and play music from AP-STREAM artists in the Music section.";
    } else if (lower.includes("news")) {
      reply =
        "📰 AP-STREAM News brings together Uganda, Africa, world, technology and entertainment news.";
    } else if (lower.includes("artist")) {
      reply =
        "🎤 The Artists section is designed for discovering AP-STREAM artists and creators.";
    } else if (lower.includes("call")) {
      reply =
        "📞 AP-STREAM supports audio and HD video calling with microphone and camera controls.";
    } else if (
      lower.includes("hello") ||
      lower.includes("hi") ||
      lower.includes("hey")
    ) {
      reply = "👋 Hello! Welcome to AP-STREAM. What would you like to explore?";
    }

    setMessages((current) => [
      ...current,
      { role: "user", text },
      { role: "assistant", text: reply },
    ]);

    setMessage("");
  }

  return (
    <>
      <button
        className="ai-floating-button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open AP-STREAM AI Assistant"
      >
        🤖
      </button>

      {open && (
        <div className="ai-assistant">
          <div className="ai-header">
            <div>
              <strong>🤖 AP-STREAM AI</strong>
              <small>Assistant</small>
            </div>

            <button onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="ai-messages">
            {messages.map((item, index) => (
              <div
                key={index}
                className={`ai-message ${
                  item.role === "user" ? "ai-user" : "ai-bot"
                }`}
              >
                {item.text}
              </div>
            ))}
          </div>

          <div className="ai-input">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") askAssistant();
              }}
              placeholder="Ask AP-STREAM AI..."
            />

            <button onClick={askAssistant}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}
