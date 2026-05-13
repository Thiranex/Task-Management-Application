import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, CheckSquare, LogOut, Zap, User, Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/tasks", icon: CheckSquare, label: "My Tasks" },
];

export default function Sidebar({ onNewTask }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() || "?";

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Zap size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.9375rem" }}>TaskFlow</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Task Manager</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        <div className="nav-section-label" style={{ marginTop: "1rem" }}>Actions</div>
        <button className="nav-item btn-full" onClick={onNewTask} style={{ border: "none", background: "none" }}>
          <Plus size={18} />
          New Task
        </button>
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="user-chip" style={{ marginBottom: "0.75rem" }}>
          <div className="avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.875rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.full_name || user?.username}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.email}
            </div>
          </div>
        </div>
        <button className="btn btn-secondary btn-full btn-sm" onClick={handleLogout}>
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
