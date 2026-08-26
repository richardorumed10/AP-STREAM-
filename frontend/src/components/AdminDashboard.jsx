import React, { useState } from "react";

export default function AdminDashboard() {
  const [contentType, setContentType] = useState("music");
  const [published, setPublished] = useState([]);

  function publishContent(event) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const item = {
      id: Date.now(),
      type: contentType,
      title: form.get("title"),
      description: form.get("description"),
      artist: form.get("artist") || "AP-STREAM Official",
      genre: form.get("genre") || "",
      featured: form.get("featured") === "on",
      official: true,
    };

    if (!item.title) return;

    setPublished((current) => [item, ...current]);
    event.currentTarget.reset();
  }

  function removeContent(id) {
    setPublished((current) => current.filter((item) => item.id !== id));
  }

  return (
    <section id="admin" className="admin-dashboard">
      <div className="admin-header">
        <div>
          <span className="eyebrow">AP-STREAM ADMIN</span>
          <h2>🛠️ Administrative Dashboard</h2>
          <p>Manage official AP-STREAM content and activity.</p>
        </div>

        <span className="official-badge">✓ AP-STREAM Official</span>
      </div>

      <div className="admin-stats">
        <div><strong>{published.length}</strong><span>Uploads</span></div>
        <div><strong>0</strong><span>Plays</span></div>
        <div><strong>0</strong><span>Views</span></div>
        <div><strong>0</strong><span>Likes</span></div>
        <div><strong>0</strong><span>Shares</span></div>
      </div>

      <div className="admin-content">
        <div className="admin-upload-card">
          <h3>📤 Upload Official Content</h3>

          <div className="admin-type-menu">
            <button onClick={() => setContentType("music")}>🎵 Music</button>
            <button onClick={() => setContentType("video")}>🎬 Videos</button>
            <button onClick={() => setContentType("short")}>⚡ Shorts</button>
            <button onClick={() => setContentType("announcement")}>📢 Announcement</button>
          </div>

          <form onSubmit={publishContent}>
            <input
              name="title"
              placeholder={
                contentType === "music"
                  ? "Song title"
                  : "Content title"
              }
              required
            />

            {contentType === "music" && (
              <>
                <input name="artist" placeholder="Artist name" />
                <input name="genre" placeholder="Genre" />
                <label>🎵 Music file <input type="file" accept="audio/*" /></label>
                <label>🖼️ Cover artwork <input type="file" accept="image/*" /></label>
              </>
            )}

            {(contentType === "video" || contentType === "short") && (
              <>
                <label>
                  🎬 Video file
                  <input type="file" accept="video/*" />
                </label>
                <label>
                  🖼️ Thumbnail
                  <input type="file" accept="image/*" />
                </label>
              </>
            )}

            <textarea
              name="description"
              placeholder="Description"
              rows="4"
            />

            <label className="admin-checkbox">
              <input type="checkbox" name="featured" />
              ⭐ Feature this content on Home
            </label>

            <button className="admin-publish-button" type="submit">
              🚀 Publish as AP-STREAM Official
            </button>
          </form>
        </div>

        <div className="admin-manage-card">
          <h3>📋 Manage Uploads</h3>

          {published.length === 0 ? (
            <p className="admin-empty">
              No official uploads yet.
            </p>
          ) : (
            <div className="admin-upload-list">
              {published.map((item) => (
                <article className="admin-upload-item" key={item.id}>
                  <div>
                    <span>{item.type}</span>
                    <strong>{item.title}</strong>
                    <small>
                      {item.official ? "✓ AP-STREAM Official" : ""}
                      {item.featured ? " • ⭐ Featured" : ""}
                    </small>
                  </div>

                  <button onClick={() => removeContent(item.id)}>
                    🗑️ Remove
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="admin-artists-card">
          <div className="admin-artists-header">
            <div>
              <span className="eyebrow">ARTIST MANAGEMENT</span>
              <h3>🎤 Manage Artists</h3>
              <p>Review, verify, feature and manage AP-STREAM artists and creators.</p>
            </div>
            <span className="official-badge">Private Admin</span>
          </div>

          <div className="artist-management-actions">
            <button>👤 All Artists</button>
            <button>🔎 Search Artists</button>
            <button>✅ Verification</button>
            <button>⭐ Featured Artists</button>
            <button>💰 Monetization Review</button>
            <button>📊 Artist Performance</button>
          </div>

          <div className="artist-management-empty">
            <strong>No artist accounts to manage yet.</strong>
            <p>
              Artist accounts will appear here when creators join AP-STREAM.
            </p>
          </div>
        </div>

        
      </div>
    </section>
  );
}
