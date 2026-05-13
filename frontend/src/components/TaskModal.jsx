import { useState, useEffect } from "react";
import { X, Calendar, Tag, User } from "lucide-react";
import { tasksAPI } from "../api";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const DEFAULT_FORM = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  due_date: "",
  tags: "",
  assigned_to: "",
};

export default function TaskModal({ task, onClose, onSaved }) {
  const isEditing = !!task;
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "todo",
        priority: task.priority || "medium",
        due_date: task.due_date
          ? new Date(task.due_date).toISOString().slice(0, 16)
          : "",
        tags: task.tags?.join(", ") || "",
        assigned_to: task.assigned_to || "",
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");

    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        tags: form.tags
          ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        assigned_to: form.assigned_to.trim() || null,
      };

      if (isEditing) {
        await tasksAPI.update(task.id, payload);
        toast.success("Task updated!");
      } else {
        await tasksAPI.create(payload);
        toast.success("Task created!");
      }
      onSaved();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || "Something went wrong";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleBackdrop}>
      <div className="modal">
        <div className="modal-header">
          <h3>{isEditing ? "Edit Task" : "Create New Task"}</h3>
          <button className="btn btn-secondary btn-icon btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="task-title">Title *</label>
              <input
                id="task-title"
                className="form-control"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter task title..."
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="task-desc">Description</label>
              <textarea
                id="task-desc"
                className="form-control"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Add details about this task..."
              />
            </div>

            {/* Status & Priority row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="task-status">Status</label>
                <select id="task-status" className="form-control" name="status" value={form.status} onChange={handleChange}>
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="task-priority">Priority</label>
                <select id="task-priority" className="form-control" name="priority" value={form.priority} onChange={handleChange}>
                  {PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Due Date */}
            <div className="form-group">
              <label className="form-label" htmlFor="task-due">
                <Calendar size={14} style={{ display: "inline", marginRight: 4 }} />
                Due Date
              </label>
              <input
                id="task-due"
                className="form-control"
                type="datetime-local"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
              />
            </div>

            {/* Tags */}
            <div className="form-group">
              <label className="form-label" htmlFor="task-tags">
                <Tag size={14} style={{ display: "inline", marginRight: 4 }} />
                Tags (comma-separated)
              </label>
              <input
                id="task-tags"
                className="form-control"
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="design, backend, urgent..."
              />
            </div>

            {/* Assigned To */}
            <div className="form-group">
              <label className="form-label" htmlFor="task-assigned">
                <User size={14} style={{ display: "inline", marginRight: 4 }} />
                Assign To (username)
              </label>
              <input
                id="task-assigned"
                className="form-control"
                name="assigned_to"
                value={form.assigned_to}
                onChange={handleChange}
                placeholder="username..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Update Task" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
