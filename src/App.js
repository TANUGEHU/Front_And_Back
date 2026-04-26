import React, { useState } from "react";
import axios from "axios";
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import ResultScreen from "./components/ResultScreen";
import MFAScreen from "./components/MFAScreen";

function App() {
  const [stage, setStage] = useState("LOGIN");
  const [decisionData, setDecisionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (payload) => {
    try {
      setLoading(true);
      setError(null);

      console.log("Sending Zero Trust Payload:", payload);

      // ✅ FASTAPI + ML BACKEND CALL
      const response = await axios.post(
        "http://127.0.0.1:8000/login-risk",
        {
          username: payload.username,
          password: payload.password,
        }
      );

      const backendResponse = response.data;

      console.log("Received ML Response:", backendResponse);

      setDecisionData({
        risk_score: backendResponse.risk_score,
        decision: backendResponse.decision,
        zeroTrustData: payload,
      });

      if (backendResponse.decision === "MFA") {
        setStage("MFA");
      } else {
        setStage("RESULT");
      }
    } catch (err) {
      console.error("Backend error:", err);
      setError("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMFASuccess = () => {
    setStage("RESULT");
    setDecisionData({
      ...decisionData,
      decision: "ALLOW",
    });
  };

  return (
    <div style={{ minHeight: "100vh", width: "100vw" }}>
      {loading && (
        <p style={{ textAlign: "center", color: "white" }}>
          Verifying credentials...
        </p>
      )}

      {error && (
        <p style={{ textAlign: "center", color: "red" }}>
          {error}
        </p>
      )}

      {!loading && stage === "LOGIN" && (
        <LoginForm
          onLogin={handleLogin}
          onSignup={() => setStage("SIGNUP")}
        />
      )}

      {!loading && stage === "SIGNUP" && (
        <SignupForm
          onBackToLogin={() => setStage("LOGIN")}
        />
      )}

      {!loading && stage === "MFA" && (
        <MFAScreen onSuccess={handleMFASuccess} />
      )}

      {!loading && stage === "RESULT" && decisionData && (
        <ResultScreen
          decision={decisionData.decision}
          riskScore={decisionData.risk_score}
        />
      )}
    </div>
  );
}

export default App;
