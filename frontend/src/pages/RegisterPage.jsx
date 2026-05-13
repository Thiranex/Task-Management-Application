import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Zap, Mail, Lock, User } from "lucide-react";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
    confirmPassword: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password)
      return toast.error("Please fill all required fields");
    if (form.password !== form.confirmPassword)
      return toast.error("Passwords don't match");
    if (form.password.length < 6)
      return toast.error("Password must be at least 6 characters");

    setLoading(true);
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        full_name: form.full_name || undefined,
      });
      toast.success("Account created! Welcome 🚀");
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.detail || "Registration failed";
      toast.error(typeof msg === "string" ? msg : "Could not create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon">
            <Zap size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ marginBottom: 0 }}>Get Started</h2>
            <p style={{ fontSize: "0.8125rem", marginBottom: 0 }}>Create your free account</p>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-fullname">
              <User size={14} style={{ display: "inline", marginRight: 4 }} />
              Full Name
            </label>
            <input
              id="reg-fullname"
              className="form-control"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="John Doe"
            />
          </div>

          {/* Username */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-username">
              Username *
            </label>
            <input
              id="reg-username"
              className="form-control"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="johndoe"
              autoComplete="username"
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">
              <Mail size={14} style={{ display: "inline", marginRight: 4 }} />
              Email *
            </label>
            <input
              id="reg-email"
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                <Lock size={14} style={{ display: "inline", marginRight: 4 }} />
                Password *
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="reg-password"
                  className="form-control"
                  type={showPass ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••"
                  style={{ paddingRight: "2.5rem" }}
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
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">Confirm *</label>
              <input
                id="reg-confirm"
                className="form-control"
                type={showPass ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={loading}
            id="register-submit"
          >
            {loading ? "Creating account..." : "Create Account →"}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <p style={{ textAlign: "center", fontSize: "0.875rem" }}>
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
