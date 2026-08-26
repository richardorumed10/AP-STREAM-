import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("AP-STREAM RUNTIME ERROR:", error);
    console.error("COMPONENT STACK:", info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh",
          background: "#071014",
          color: "#fff",
          padding: "30px",
          fontFamily: "Arial, sans-serif"
        }}>
          <h1>AP-STREAM</h1>
          <h2>⚠️ App error detected</h2>
          <p>React loaded, but one component crashed.</p>
          <pre style={{
            whiteSpace: "pre-wrap",
            color: "#ff7777",
            background: "#111",
            padding: "15px",
            borderRadius: "10px"
          }}>
            {String(this.state.error?.stack || this.state.error)}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
