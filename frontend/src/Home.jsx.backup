import React from "react";

const cards = [
  { type: "🎵 Music", title: "New music coming soon", creator: "AP Artist" },
  { type: "🎬 Video", title: "Discover AP Stream", creator: "AP Stream" },
  { type: "⚡ Short", title: "Trending Shorts", creator: "Creators" },
  { type: "🔴 Live", title: "Live creators", creator: "AP Stream" },
];

export default function Home() {
  return (
    <div className="ap-home clean-home" id="home">
      <section className="home-header">
        <div>
          <span className="hero-kicker">AP STREAM</span>
          <h1>Welcome to AP Stream</h1>
          <p>Connect, create, stream and discover.</p>
        </div>
      </section>

      <nav className="home-tabs" aria-label="Home feed">
        <button className="active">For You</button>
        <button>Following</button>
        <button>Trending</button>
      </nav>

      <section className="home-quick-actions">
        <button
          type="button"
          className="home-action-button"
          onClick={() => {
            const el = document.querySelector(".create-post textarea");
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
              setTimeout(() => el.focus(), 400);
            }
          }}
        >
          ➕ Create
        </button>
        <button
          type="button"
          className="home-action-button"
          onClick={() => window.dispatchEvent(new CustomEvent("apstream-go-live"))}
        >
          🔴 Go Live
        </button>
        <a className="home-action-button" href="#create">⬆️ Upload</a>
        <a className="home-action-button" href="#music">🎵 Music</a>
        <a className="home-action-button" href="#boda">🏍️ Boda Ride</a>
      </section>

      <section className="home-card-grid">
        {cards.map((card) => (
          <article className="home-card" key={card.title}>
            <div className="home-card-media">{card.type}</div>
            <div className="home-card-content">
              <strong>{card.title}</strong>
              <p>{card.creator}</p>
              <div className="home-card-actions">
                <button aria-label="Like">♡</button>
                <button aria-label="Comment">💬</button>
                <button aria-label="Share">↗</button>
                <button aria-label="Save">🔖</button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="home-media-section">
        <div className="home-section-title">
          <strong>🎵 MUSIC</strong>
          <a href="#music">Open →</a>
        </div>

        <div className="home-player home-player-large">
          <div className="player-art player-art-large">🎵</div>

          <div className="player-main">
            <span className="player-label">NOW PLAYING</span>
            <strong>AP-STREAM MUSIC</strong>
            <p>Stream music from your favorite artists</p>

            <div className="player-progress">
              <span>0:00</span>
              <input type="range" min="0" max="100" defaultValue="0" />
              <span>0:00</span>
            </div>

            <div className="player-controls">
              <button aria-label="Shuffle">🔀</button>
              <button aria-label="Previous">⏮</button>
              <button className="player-play" aria-label="Play">▶</button>
              <button aria-label="Next">⏭</button>
              <button aria-label="Repeat">🔁</button>
            </div>

            <div className="player-tools">
              <button>🎚️ Equalizer</button>
              <button>📋 Queue</button>
              <button>🎵 Playlist</button>
              <button>⬇️ Download</button>
              <button>🔊 Volume</button>
              <button>❤️ Like</button>
              <button>🔖 Save</button>
              <button>↗ Share</button>
            </div>
          </div>
        </div>

      </section>

      <div className="home-admin-entry">
        <button
          type="button"
          onClick={() => window.location.hash = "admin-login"}
        >
          🔐 Admin Dashboard
        </button>

        <button
          type="button"
          onClick={() => window.location.hash = "boda"}
        >
          🏍️ Boda Ride
        </button>
      </div>
    </div>
  );
}
