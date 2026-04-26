import React, { useState } from "react";
import "./SignupForm.css";
import bgImage from "../assets/bg.png";
import { signup } from "../services/api";

function SignupForm({ onBackToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    // Enforce bcrypt 72-byte limit (utf-8 bytes)
    try {
      const pwBytes = new TextEncoder().encode(password).length;
      if (pwBytes > 72) {
        setError("Password too long (max 72 bytes). Use a shorter password.");
        return;
      }
    } catch (e) {
      // If TextEncoder not available, fall back to character length check
      if (password.length > 72) {
        setError("Password too long (max 72 characters). Use a shorter password.");
        return;
      }
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    try {
      setLoading(true);
      await signup(username, password, email);
      alert("✅ Account created successfully! Please log in.");
      onBackToLogin();
    } catch (err) {
      console.error("Signup error:", err);
      // Show backend-provided message when available to aid debugging
      const backendMsg = err.response?.data?.detail || err.response?.data?.message || err.message;
      if (err.response?.status === 400) {
        setError(backendMsg || "Username or email already exists");
      } else {
        setError(backendMsg || "Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-background"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="login-card">
        

        {error && <div className="error-message" style={{ color: "#ff6b6b", marginBottom: "15px", textAlign: "center" }}>{error}</div>}

        <div className="input-box">
          <span className="icon">👤</span>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="input-box">
          <span className="icon">📧</span>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
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
            disabled={loading}
            required
          />
        </div>

        <div className="input-box">
          <span className="icon">🔒</span>
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <button 
          className="login-btn" 
          onClick={handleSignup}
          disabled={loading}
          style={{ opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Creating Account..." : "SIGN UP"}
        </button>

        <p className="switch-text" onClick={onBackToLogin} style={{ cursor: "pointer", marginTop: "15px" }}>
          ← Back to Login
        </p>
      </div>
    </div>
  );
}

export default SignupForm;
