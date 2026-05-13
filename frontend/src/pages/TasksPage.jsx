import { useEffect, useState, useCallback } from "react";
import { Search, Plus, SlidersHorizontal, CheckSquare } from "lucide-react";
import { tasksAPI } from "../api";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";
import toast from "react-hot-toast";
import { useTaskSocket } from "../hooks/useTaskSocket";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
];

const PRIORITY_FILTERS = [
  { value: "", label: "All Priorities" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    search: "",
  });
  const [searchInput, setSearchInput] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 12 };
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;

      const res = await tasksAPI.list(params);
      setTasks(res.data.tasks);
      setTotal(res.data.total);
      setTotalPages(res.data.total_pages);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // WebSocket real-time updates
  const handleWsMessage = useCallback(
    (msg) => {
      if (["task_created", "task_updated", "task_deleted"].includes(msg.type)) {
        fetchTasks();
      }
    },
    [fetchTasks]
  );
  useTaskSocket(handleWsMessage);

  const handleSaved = () => fetchTasks();

  const handleStatusToggle = (id, newStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
  };

  const handleDeleted = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));
  };

  const setStatusFilter = (val) => {
    setFilters((prev) => ({ ...prev, status: val }));
    setPage(1);
  };

  const setPriorityFilter = (val) => {
    setFilters((prev) => ({ ...prev, priority: val }));
    setPage(1);
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>My Tasks</h1>
          <p>{total} task{total !== 1 ? "s" : ""} total</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setEditTask(null); setShowModal(true); }}
          id="new-task-btn"
        >
          <Plus size={16} />
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        {/* Search */}
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input
            id="task-search"
            className="form-control"
            placeholder="Search tasks..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {/* Status chips */}
        <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              className={`filter-chip ${filters.status === f.value ? "active" : ""}`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Priority select */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <SlidersHorizontal size={14} style={{ color: "var(--text-muted)" }} />
          <select
            id="priority-filter"
            className="form-control"
            style={{ width: "auto", paddingRight: "2rem" }}
            value={filters.priority}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            {PRIORITY_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Task Grid */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <div className="spinner" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="card card-padding tasks-empty">
          <CheckSquare size={48} style={{ color: "var(--text-muted)", marginBottom: "1rem" }} />
          <h3 style={{ color: "var(--text-muted)" }}>
            {filters.status || filters.priority || filters.search
              ? "No tasks match your filters"
              : "No tasks yet"}
          </h3>
          <p style={{ marginTop: "0.5rem" }}>
            {filters.status || filters.priority || filters.search
              ? "Try adjusting your filters"
              : "Create your first task to get started!"}
          </p>
          {!filters.status && !filters.priority && !filters.search && (
            <button
              className="btn btn-primary"
              style={{ marginTop: "1.5rem" }}
              onClick={() => { setEditTask(null); setShowModal(true); }}
            >
              <Plus size={16} /> Create Task
            </button>
          )}
        </div>
      ) : (
        <div className="tasks-grid">
          {tasks.map((task) => (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-secondary btn-sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Prev
          </button>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem", padding: "0 0.5rem" }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {/* Modal */}
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
