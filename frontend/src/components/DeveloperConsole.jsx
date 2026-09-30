import React, { useEffect, useState } from "react";

const API_BASE = "/api";

export default function DeveloperConsole() {
  const [apiKey, setApiKey] = useState("");
  const [keys, setKeys] = useState([]);
  const [endpoint, setEndpoint] = useState("/api/v1/music");
  const [method, setMethod] = useState("GET");
  const [response, setResponse] = useState(null);
  const [status, setStatus] = useState("Ready");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("tester");
  const [copied, setCopied] = useState("");

  const loadKeys = async () => {
    try {
      const res = await fetch("/api/developer/keys");
      const data = await res.json();
      if (data?.keys) setKeys(data.keys);
    } catch {
      setKeys([]);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const createKey = async () => {
    const name = prompt("Developer key name:", "AP-STREAM Developer");
    if (!name) return;

    try {
      const res = await fetch("/api/developer/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });

      const data = await res.json();

      if (data?.key) {
        setApiKey(data.key);
        await loadKeys();
        setStatus("API key created");
      } else {
        setStatus(data?.message || "Unable to create key");
      }
    } catch (err) {
      setStatus(err.message);
    }
  };

  const revokeKey = async (id) => {
    if (!confirm("Revoke this API key?")) return;

    try {
      const res = await fetch(`/api/developer/keys/${id}`, {
        method: "DELETE"
      });

      const data = await res.json();
      setStatus(data?.message || "Key revoked");
      await loadKeys();
    } catch (err) {
      setStatus(err.message);
    }
  };

  const testEndpoint = async () => {
    setLoading(true);
    setStatus("Sending request...");
    setResponse(null);

    const started = performance.now();

    try {
      const headers = {
        Accept: "application/json"
      };

      if (apiKey.trim()) {
        headers["X-API-Key"] = apiKey.trim();
      }

      const res = await fetch(endpoint, {
        method,
        headers
      });

      const elapsed = Math.round(performance.now() - started);
      const text = await res.text();

      let body;
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }

      setResponse({
        httpStatus: res.status,
        statusText: res.statusText,
        time: elapsed,
        body
      });

      setStatus(res.ok ? "Request successful" : "Request failed");
    } catch (err) {
      setResponse({
        error: err.message
      });
      setStatus("Request error");
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text, label) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1500);
  };

  const curlExample = `curl -H "X-API-Key: YOUR_API_KEY" ${window.location.origin}/api/v1/music`;

  return (
    <div className="developer-console">
      <div className="developer-header">
        <div>
          <div className="developer-badge">AP-STREAM API</div>
          <h1>Developer Console</h1>
          <p>Build, test and manage integrations with AP-STREAM.</p>
        </div>

        <div className="api-status">
          <span className="status-dot"></span>
          API v1 Online
        </div>
      </div>

      <div className="developer-tabs">
        <button
          className={activeTab === "tester" ? "active" : ""}
          onClick={() => setActiveTab("tester")}
        >
          🧪 API Tester
        </button>

        <button
          className={activeTab === "keys" ? "active" : ""}
          onClick={() => setActiveTab("keys")}
        >
          🔑 API Keys
        </button>

        <button
          className={activeTab === "docs" ? "active" : ""}
          onClick={() => setActiveTab("docs")}
        >
          📚 Documentation
        </button>
      </div>

      {activeTab === "tester" && (
        <section className="developer-grid">
          <div className="developer-card tester-card">
            <div className="card-title">
              <div>
                <h2>Endpoint Tester</h2>
                <span>Send authenticated API requests</span>
              </div>
            </div>

            <label>API Key</label>
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your X-API-Key"
              type="password"
            />

            <div className="endpoint-row">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>DELETE</option>
              </select>

              <input
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="/api/v1/music"
              />

              <button onClick={testEndpoint} disabled={loading}>
                {loading ? "Testing..." : "Send"}
              </button>
            </div>

            <div className="quick-endpoints">
              <button onClick={() => setEndpoint("/api/v1")}>
                Health
              </button>
              <button onClick={() => setEndpoint("/api/v1/music")}>
                Music
              </button>
            </div>

            <div className="request-status">
              {status}
            </div>
          </div>

          <div className="developer-card response-card">
            <div className="card-title">
              <div>
                <h2>Response</h2>
                <span>Live API response</span>
              </div>

              {response && (
                <button
                  className="small-button"
                  onClick={() =>
                    copyText(
                      JSON.stringify(response.body, null, 2),
                      "response"
                    )
                  }
                >
                  {copied === "response" ? "Copied" : "Copy"}
                </button>
              )}
            </div>

            {response ? (
              <>
                <div className="response-meta">
                  <span>HTTP {response.httpStatus || "ERROR"}</span>
                  {response.time !== undefined && (
                    <span>{response.time} ms</span>
                  )}
                </div>

                <pre className="response-box">
                  {JSON.stringify(
                    response.body || response.error,
                    null,
                    2
                  )}
                </pre>
              </>
            ) : (
              <div className="empty-response">
                Run an endpoint to see the response here.
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === "keys" && (
        <section className="developer-card">
          <div className="card-title">
            <div>
              <h2>API Keys</h2>
              <span>Manage access to the AP-STREAM Developer API</span>
            </div>

            <button onClick={createKey} className="primary-button">
              + Create API Key
            </button>
          </div>

          {apiKey && (
            <div className="new-key">
              <strong>New API key</strong>
              <div className="key-display">
                <code>{apiKey}</code>
                <button
                  onClick={() => copyText(apiKey, "key")}
                >
                  {copied === "key" ? "Copied" : "Copy"}
                </button>
              </div>
              <small>
                Store this key securely. Do not publish it in client-side
                code.
              </small>
            </div>
          )}

          <div className="key-list">
            {keys.length === 0 ? (
              <div className="empty-response">
                No developer keys found.
              </div>
            ) : (
              keys.map((key) => (
                <div className="key-item" key={key.id || key._id}>
                  <div>
                    <strong>{key.name || "Developer Key"}</strong>
                    <span>
                      {key.active === false ? "Revoked" : "Active"}
                    </span>
                  </div>

                  <button
                    className="danger-button"
                    onClick={() => revokeKey(key.id || key._id)}
                  >
                    Revoke
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {activeTab === "docs" && (
        <section className="developer-card docs-card">
          <div className="card-title">
            <div>
              <h2>API Documentation</h2>
              <span>AP-STREAM Developer API v1</span>
            </div>
          </div>

          <div className="doc-section">
            <h3>Base URL</h3>
            <code>{window.location.origin}/api/v1</code>
          </div>

          <div className="doc-section">
            <h3>Authentication</h3>
            <p>
              Send your developer key using the X-API-Key request header.
            </p>

            <pre>{`X-API-Key: YOUR_API_KEY`}</pre>
          </div>

          <div className="doc-section">
            <h3>Health</h3>
            <div className="endpoint-doc">
              <strong>GET</strong>
              <code>/api/v1</code>
            </div>

            <pre>{`curl ${window.location.origin}/api/v1`}</pre>
          </div>

          <div className="doc-section">
            <h3>Music</h3>
            <div className="endpoint-doc">
              <strong>GET</strong>
              <code>/api/v1/music</code>
            </div>

            <pre>{curlExample}</pre>

            <button
              className="small-button"
              onClick={() => copyText(curlExample, "curl")}
            >
              {copied === "curl" ? "Copied" : "Copy cURL"}
            </button>
          </div>

          <div className="doc-section">
            <h3>Example Response</h3>
            <pre>{`{
  "success": true,
  "type": "music",
  "data": []
}`}</pre>
          </div>

          <div className="doc-section">
            <h3>JavaScript Example</h3>
            <pre>{`fetch("/api/v1/music", {
  headers: {
    "X-API-Key": "YOUR_API_KEY"
  }
})
.then(res => res.json())
.then(data => console.log(data));`}</pre>
          </div>
        </section>
      )}
    </div>
  );
}
