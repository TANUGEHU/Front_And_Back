import React from "react";
import safeBg from "../assets/safe.jpeg";
import dangerBg from "../assets/danger.jpeg";
import afterLoginBG from "../assets/afterLoginBG.png";

function ResultScreen({ decision, riskScore }) {
  // 🎨 Select background based on decision
  const backgroundImage =
    decision === "ALLOW"
      ? safeBg
      : decision === "BLOCK"
      ? dangerBg
      : afterLoginBG;

  const getStyle = () => {
    if (decision === "ALLOW") return { color: "#4ade80" };
    if (decision === "BLOCK") return { color: "#ef4444" };
    return { color: "#facc15" };
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={styles.container}>
        <h1 style={{ ...styles.decisionText, ...getStyle() }}>
          {decision}
        </h1>

        <p style={styles.riskText}>
          Risk Score: <strong>{riskScore}</strong>
        </p>

        {decision === "ALLOW" && (
          <p style={styles.statusText}>✅ Access Granted</p>
        )}

        {decision === "BLOCK" && (
          <p style={styles.statusText}>⛔ Access Denied</p>
        )}
      </div>
    </div>
  );
}

export default ResultScreen;

const styles = {
  container: {
    width: "420px",
    padding: "40px",
    borderRadius: "16px",
    background: "rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(14px)",
    boxShadow: "0 0 50px rgba(0, 150, 255, 0.5)",
    textAlign: "center",
    color: "#ffffff",
  },

  decisionText: {
    fontSize: "42px",
    fontWeight: "700",
    marginBottom: "15px",
    letterSpacing: "2px",
  },

  riskText: {
    fontSize: "20px",
    marginBottom: "20px",
    color: "#e5e7eb",
  },

  statusText: {
    fontSize: "24px",
    fontWeight: "600",
  },
};
