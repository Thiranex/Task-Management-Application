import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, CheckSquare, LogOut, Zap, Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function MobileNav({ onNewTask }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/login");
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() || "?";

  return (
    <>
      {/* Top bar */}
      <div className="mobile-top-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div className="logo-icon" style={{ width: 28, height: 28 }}>
            <Zap size={14} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: "0.9375rem" }}>TaskFlow</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button className="btn btn-primary btn-sm btn-icon" onClick={onNewTask} title="New Task">
            <Plus size={16} />
          </button>
          <div className="avatar" style={{ width: 30, height: 30, fontSize: "0.75rem" }}>{initials}</div>
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="mobile-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} style={{ flexDirection: "column", gap: "0.25rem", padding: "0.375rem 0.75rem" }}>
          <LayoutDashboard size={20} />
          <span style={{ fontSize: "0.6875rem" }}>Dashboard</span>
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} style={{ flexDirection: "column", gap: "0.25rem", padding: "0.375rem 0.75rem" }}>
          <CheckSquare size={20} />
          <span style={{ fontSize: "0.6875rem" }}>Tasks</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="nav-item"
          style={{ flexDirection: "column", gap: "0.25rem", padding: "0.375rem 0.75rem", border: "none", background: "none", cursor: "pointer" }}
        >
          <LogOut size={20} />
          <span style={{ fontSize: "0.6875rem" }}>Logout</span>
        </button>
      </nav>
    </>
  );
}
