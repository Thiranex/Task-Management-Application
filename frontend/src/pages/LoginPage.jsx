import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Zap, Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error("Please fill all fields");
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back! 🎉");
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.detail || "Login failed";
      toast.error(typeof msg === "string" ? msg : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background orbs */}
      <div className="auth-bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="logo-icon">
            <Zap size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ marginBottom: 0 }}>TaskFlow</h2>
            <p style={{ fontSize: "0.8125rem", marginBottom: 0 }}>Sign in to your workspace</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              <Mail size={14} style={{ display: "inline", marginRight: 4 }} />
              Email Address
            </label>
            <input
              id="login-email"
              className="form-control"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              <Lock size={14} style={{ display: "inline", marginRight: 4 }} />
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="login-password"
                className="form-control"
                type={showPass ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ paddingRight: "3rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                style={{
                  position: "absolute", right: "0.75rem", top: "50%",
                  transform: "translateY(-50%)", background: "none",
                  border: "none", color: "var(--text-muted)", cursor: "pointer",
                  display: "flex", alignItems: "center",
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={loading}
            id="login-submit"
          >
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <p style={{ textAlign: "center", fontSize: "0.875rem" }}>
          Don't have an account?{" "}
          <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
