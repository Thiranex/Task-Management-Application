import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckSquare, Clock, AlertTriangle, TrendingUp, Plus, ArrowRight
} from "lucide-react";
import { tasksAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";

const STAT_CONFIGS = [
  {
    key: "total",
    label: "Total Tasks",
    icon: CheckSquare,
    color: "var(--accent)",
    bg: "rgba(99,102,241,0.12)",
  },
  {
    key: "in_progress",
    label: "In Progress",
    icon: TrendingUp,
    color: "var(--info)",
    bg: "var(--info-bg)",
    fromStatus: true,
  },
  {
    key: "done",
    label: "Completed",
    icon: CheckSquare,
    color: "var(--success)",
    bg: "var(--success-bg)",
    fromStatus: true,
  },
  {
    key: "overdue",
    label: "Overdue",
    icon: AlertTriangle,
    color: "var(--danger)",
    bg: "var(--danger-bg)",
  },
];

export default function DashboardPage({ onNewTask }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [editTask, setEditTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, tasksRes] = await Promise.all([
        tasksAPI.stats(),
        tasksAPI.list({ page: 1, page_size: 6 }),
      ]);
      setStats(statsRes.data);
      setRecentTasks(tasksRes.data.tasks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaved = () => fetchData();

  const handleStatusToggle = (id, newStatus) => {
    setRecentTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
  };

  const handleDeleted = (id) => {
    setRecentTasks((prev) => prev.filter((t) => t.id !== id));
    fetchData();
  };

  const getStatValue = (conf) => {
    if (!stats) return "—";
    if (conf.fromStatus) return stats.by_status?.[conf.key] ?? 0;
    return stats[conf.key] ?? 0;
  };

  // Completion rate
  const completionRate = stats
    ? stats.total > 0
      ? Math.round(((stats.by_status?.done ?? 0) / stats.total) * 100)
      : 0
    : 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: "4rem" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>{greeting()}, {user?.full_name?.split(" ")[0] || user?.username} 👋</h1>
          <p>Here's what's happening with your tasks today.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowModal(true); }}>
          <Plus size={16} />
          New Task
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {STAT_CONFIGS.map((conf) => {
          const Icon = conf.icon;
          const value = getStatValue(conf);
          return (
            <div key={conf.key} className="card stat-card">
              <div className="stat-icon" style={{ background: conf.bg }}>
                <Icon size={18} style={{ color: conf.color }} />
              </div>
              <div className="stat-number" style={{ color: conf.color }}>{value}</div>
              <div className="stat-label">{conf.label}</div>
            </div>
          );
        })}
      </div>

      {/* Completion progress */}
      {stats?.total > 0 && (
        <div className="card card-padding" style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ fontWeight: 600 }}>Overall Completion</span>
            <span style={{ color: "var(--accent-light)", fontWeight: 700 }}>{completionRate}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${completionRate}%` }} />
          </div>
        </div>
      )}

      {/* Recent Tasks */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3>Recent Tasks</h3>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate("/tasks")}
        >
          View All <ArrowRight size={13} />
        </button>
      </div>

      {recentTasks.length === 0 ? (
        <div className="card card-padding tasks-empty">
          <CheckSquare size={40} style={{ color: "var(--text-muted)", marginBottom: "1rem" }} />
          <h3 style={{ color: "var(--text-muted)" }}>No tasks yet</h3>
          <p style={{ marginTop: "0.5rem" }}>Create your first task to get started</p>
          <button className="btn btn-primary" style={{ marginTop: "1.5rem" }} onClick={() => { setEditTask(null); setShowModal(true); }}>
            <Plus size={16} /> Create Task
          </button>
        </div>
      ) : (
        <div className="tasks-grid">
          {recentTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={(t) => { setEditTask(t); setShowModal(true); }}
              onDeleted={handleDeleted}
              onStatusToggle={handleStatusToggle}
            />
          ))}
        </div>
      )}

      {showModal && (
        <TaskModal
          task={editTask}
          onClose={() => { setShowModal(false); setEditTask(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
