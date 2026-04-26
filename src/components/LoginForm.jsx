import React, { useState } from "react";
import "./LoginForm.css";
import bgImage from "../assets/bg.png";

function LoginForm({ onLogin, onSignup }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    const now = new Date();
    const day = now.getDay();

    // 🔐 Zero Trust Context Payload
    const zeroTrustPayload = {
      username: username,
      password: password,

      // 🕒 Time-based features
      hour: now.getHours(),
      day_of_week: day,
      is_weekend: day === 0 || day === 6 ? 1 : 0,

      // 🌐 Simulated context
      rtt: 120,
      asn: 24560,
      ip_octet1: 192,
      country: "IN",
      browser: "Chrome",
    };

    onLogin(zeroTrustPayload);
  };

  return (
    <div
      className="login-background"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="login-card">
       

        <div className="input-box">
          <span className="icon">👤</span>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="input-box">
          <span className="icon">🔒</span>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="options">
          <label>
            <input type="checkbox" /> Remember Me
          </label>
        </div>

        <button className="login-btn" onClick={handleLogin}>
          LOGIN
        </button>

        {/* 🔹 SIGNUP LINK */}
        <p className="signup-text">
          Don’t have an account?{" "}
          <span className="signup-link" onClick={onSignup}>
            Create Account
          </span>
        </p>
      </div>
    </div>
  );
}

export default LoginForm;