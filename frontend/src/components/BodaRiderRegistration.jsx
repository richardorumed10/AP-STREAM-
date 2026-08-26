import { useState } from "react";

export default function BodaRiderRegistration() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section
      id="boda-rider"
      style={{
        padding: "50px 20px",
        background: "#fff"
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "auto",
          padding: "25px",
          borderRadius: "20px",
          background: "#f7f7f7",
          boxShadow: "0 8px 30px rgba(0,0,0,.08)"
        }}
      >
        <h2>🛵 Register as a Boda Rider</h2>
        <p>Join AP-STREAM Boda and receive ride requests from passengers.</p>

        {submitted ? (
          <div
            style={{
              padding: "18px",
              borderRadius: "12px",
              background: "#eaf7ea"
            }}
          >
            <h3>✅ Registration Submitted</h3>
            <p>
              Your rider application has been received. Verification will be
              required before you can accept rides.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              required
              placeholder="👤 Full name"
              style={inputStyle}
            />

            <input
              required
              type="tel"
              placeholder="📱 Phone number"
              style={inputStyle}
            />

            <input
              required
              placeholder="🪪 National ID / ID number"
              style={inputStyle}
            />

            <input
              required
              placeholder="🛵 Motorcycle registration number"
              style={inputStyle}
            />

            <input
              required
              placeholder="📍 Operating area"
              style={inputStyle}
            />

            <label style={labelStyle}>
              📷 Profile photo
              <input type="file" accept="image/*" />
            </label>

            <label style={labelStyle}>
              🪪 Rider licence/document
              <input type="file" accept="image/*,.pdf" />
            </label>

            <label style={labelStyle}>
              📄 Motorcycle document
              <input type="file" accept="image/*,.pdf" />
            </label>

            <input
              required
              type="password"
              placeholder="🔐 Create password"
              style={inputStyle}
            />

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "14px",
                border: 0,
                borderRadius: "10px",
                background: "#111",
                color: "#fff",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              🛵 Register as Boda Rider
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px",
  marginBottom: "12px",
  border: "1px solid #ddd",
  borderRadius: "10px"
};

const labelStyle = {
  display: "block",
  padding: "14px",
  marginBottom: "12px",
  background: "#fff",
  borderRadius: "10px",
  border: "1px solid #ddd"
};
