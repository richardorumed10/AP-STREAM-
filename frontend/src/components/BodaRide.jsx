import { useState } from "react";

export default function BodaRide() {
  const [location, setLocation] = useState("");
  const [destination, setDestination] = useState("");
  const [status, setStatus] = useState("ready");
  const [locating, setLocating] = useState(false);
  const [payment, setPayment] = useState("mobile-money");
  const [showSafety, setShowSafety] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDriver, setShowDriver] = useState(false);
  const [showRider, setShowRider] = useState(false);

  const fare = 10000;
  const platformFee = 1000;
  const driverPayout = fare - platformFee;

  function getLocation() {
    if (!navigator.geolocation) {
      setLocation("GPS is not supported on this device.");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        setLocating(false);
      },
      () => {
        setLocation("Location permission was denied.");
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  function requestRide() {
    if (!location || !destination.trim()) return;
    setStatus("requested");
  }

  function cancelRide() {
    setStatus("ready");
  }

  return (
    <section
      id="boda"
      style={{
        padding: "35px 16px",
        background: "linear-gradient(135deg,#e4f6ea,#f8dfe9)"
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "auto",
          background: "#fff",
          padding: "24px",
          borderRadius: "20px",
          boxShadow: "0 8px 30px rgba(0,0,0,.08)"
        }}
      >
        <h2>🏍️ AP-STREAM Boda Ride</h2>
        <p>Safe, simple and connected ride booking.</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))",
            gap: "8px",
            margin: "18px 0"
          }}
        >
          <button onClick={getLocation}>📍 Pickup</button>
          <button onClick={() => document.getElementById("boda-destination")?.focus()}>
            🏁 Destination
          </button>
          <button onClick={() => setShowDriver(!showDriver)}>👤 Driver</button>
          <button onClick={() => setShowSafety(!showSafety)}>🛡️ Safety</button>
          <button onClick={() => setShowHistory(!showHistory)}>🧾 Trips</button>
          <button onClick={() => setShowRider(!showRider)}>👨‍✈️ Become a Rider</button>
        </div>

        <button
          onClick={getLocation}
          style={{
            padding: "12px 16px",
            border: 0,
            borderRadius: "10px",
            cursor: "pointer",
            marginBottom: "15px"
          }}
        >
          📍 {locating ? "Finding location..." : "Use My Location"}
        </button>

        {location && (
          <div
            style={{
              padding: "12px",
              background: "#f1f1f1",
              borderRadius: "10px",
              marginBottom: "15px"
            }}
          >
            📍 Pickup: {location}
          </div>
        )}

        <input
          id="boda-destination"
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
          placeholder="🏁 Enter destination"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "13px",
            border: "1px solid #ddd",
            borderRadius: "10px",
            marginBottom: "12px"
          }}
        />

        <div
          style={{
            padding: "15px",
            background: "#f8f8f8",
            borderRadius: "12px",
            marginBottom: "12px"
          }}
        >
          <strong>💰 Estimated fare</strong>
          <div style={{ fontSize: "22px", marginTop: "5px" }}>
            UGX {fare.toLocaleString()}
          </div>
          <small>Final fare can be confirmed before a real payment is processed.</small>
        </div>

        <h3>💳 Payment method</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
            gap: "8px",
            marginBottom: "15px"
          }}
        >
          {[
            ["mobile-money", "📱 Mobile Money"],
            ["card", "💳 Card"],
            ["cash", "💵 Cash"]
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setPayment(value)}
              style={{
                padding: "12px",
                borderRadius: "10px",
                border: payment === value ? "2px solid #173b2a" : "1px solid #ddd",
                background: payment === value ? "#e4f6ea" : "#fff",
                cursor: "pointer"
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {payment === "mobile-money" && (
          <div
            style={{
              padding: "14px",
              borderRadius: "12px",
              background: "#fff7fb",
              marginBottom: "15px"
            }}
          >
            <strong>📱 Mobile Money</strong>
            <p style={{ marginBottom: 0 }}>
              Payment integration is currently in test mode. No real money will
              be transferred from this screen.
            </p>
          </div>
        )}

        <button
          onClick={requestRide}
          disabled={!location || !destination.trim()}
          style={{
            width: "100%",
            padding: "14px",
            border: 0,
            borderRadius: "10px",
            background: !location || !destination.trim() ? "#aaa" : "#111",
            color: "#fff",
            cursor: !location || !destination.trim() ? "not-allowed" : "pointer"
          }}
        >
          🏍️ Request Boda Ride
        </button>

        {status === "requested" && (
          <div
            style={{
              marginTop: "18px",
              padding: "16px",
              borderRadius: "12px",
              background: "#e8f7ee"
            }}
          >
            <strong>🚦 Ride Requested</strong>
            <p>Driver matching is currently a demo stage.</p>

            <div style={{ marginTop: "10px" }}>
              <strong>💰 Fare:</strong> UGX {fare.toLocaleString()}
              <br />
              <strong>💳 Payment:</strong>{" "}
              {payment === "mobile-money"
                ? "Mobile Money"
                : payment === "card"
                  ? "Card"
                  : "Cash"}
              <br />
              <strong>🏦 Platform fee:</strong> UGX {platformFee.toLocaleString()}
              <br />
              <strong>🛵 Driver payout:</strong> UGX {driverPayout.toLocaleString()}
            </div>

            <button
              onClick={cancelRide}
              style={{
                marginTop: "12px",
                padding: "10px 14px",
                borderRadius: "9px",
                border: "1px solid #ddd",
                background: "#fff",
                cursor: "pointer"
              }}
            >
              Cancel Request
            </button>
          </div>
        )}

        {showDriver && (
          <div style={{ marginTop: "18px", padding: "16px", background: "#f5f5f5", borderRadius: "12px" }}>
            <h3>👤 Driver & Vehicle</h3>
            <p>Driver verification, profile photo, vehicle identification and trip information will appear here when real driver matching is connected.</p>
          </div>
        )}

        {showSafety && (
          <div style={{ marginTop: "18px", padding: "16px", background: "#fff7fb", borderRadius: "12px" }}>
            <h3>🛡️ Safety Center</h3>
            <p>🚨 Emergency assistance</p>
            <p>📍 Trip sharing</p>
            <p>🪪 Driver verification</p>
            <p>📞 AP-STREAM support</p>
            <button
              onClick={() => alert("Emergency support will be connected when the safety backend is activated.")}
              style={{ padding: "10px 14px", borderRadius: "9px", border: 0, cursor: "pointer" }}
            >
              🚨 SOS
            </button>
          </div>
        )}

        {showHistory && (
          <div style={{ marginTop: "18px", padding: "16px", background: "#f5f5f5", borderRadius: "12px" }}>
            <h3>🧾 Trip History</h3>
            <p>No completed trips yet.</p>
            <p>Receipts and payment records will appear here after completed rides.</p>
          </div>
        )}

        {showRider && (
          <div style={{ marginTop: "18px", padding: "16px", background: "#e8f7ee", borderRadius: "12px" }}>
            <h3>👨‍✈️ Become an AP-STREAM Boda Rider</h3>
            <p>Driver registration, identity verification, vehicle information and approval will be handled here.</p>
            <button
              onClick={() => window.location.hash = "boda-registration"}
              style={{ padding: "11px 15px", borderRadius: "9px", border: 0, cursor: "pointer" }}
            >
              Start Registration
            </button>
          </div>
        )}

        <div
          style={{
            marginTop: "22px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))",
            gap: "8px"
          }}
        >
          <div>🗺️ GPS & Tracking</div>
          <div>🛵 Driver Matching</div>
          <div>🛡️ Safety</div>
          <div>🚨 SOS</div>
          <div>💳 Payments</div>
          <div>📦 Package Delivery</div>
        </div>

        <div
          style={{
            marginTop: "18px",
            padding: "14px",
            background: "#fafafa",
            borderRadius: "12px",
            fontSize: "13px"
          }}
        >
          <strong>ℹ️ Payment transparency</strong>
          <p>
            Example fare: UGX {fare.toLocaleString()} · Example AP-STREAM
            platform fee: UGX {platformFee.toLocaleString()} · Example driver
            payout: UGX {driverPayout.toLocaleString()}.
          </p>
          <p style={{ marginBottom: 0 }}>
            These are demonstration values. Real fees, payouts, payment
            processing and merchant settlement must be configured with the
            approved payment and business systems before going live.
          </p>
        </div>
      </div>
    </section>
  );
}
