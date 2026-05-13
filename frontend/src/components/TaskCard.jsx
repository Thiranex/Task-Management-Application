import { useState } from "react";
import { Edit2, Trash2, Calendar, CheckCircle, Circle } from "lucide-react";
import { tasksAPI } from "../api";
import toast from "react-hot-toast";
import { formatDistanceToNow, isPast, parseISO } from "date-fns";

const STATUS_LABELS = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export default function TaskCard({ task, onEdit, onDeleted, onStatusToggle }) {
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const isDone = task.status === "done";

  const isOverdue =
    task.due_date &&
    !isDone &&
    isPast(parseISO(task.due_date));

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm("Delete this task?")) return;
    setDeleting(true);
    try {
      await tasksAPI.delete(task.id);
      toast.success("Task deleted");
      onDeleted(task.id);
    } catch {
      toast.error("Failed to delete task");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleDone = async (e) => {
    e.stopPropagation();
    setToggling(true);
    try {
      const newStatus = isDone ? "todo" : "done";
      await tasksAPI.update(task.id, { status: newStatus });
      onStatusToggle(task.id, newStatus);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="card task-card" onClick={() => onEdit(task)}>
      <div className="task-header">
        <button
          className="btn btn-icon btn-sm btn-secondary"
          onClick={handleToggleDone}
          disabled={toggling}
          title={isDone ? "Mark as To Do" : "Mark as Done"}
          style={{ flexShrink: 0 }}
        >
          {isDone ? (
            <CheckCircle size={16} style={{ color: "var(--success)" }} />
          ) : (
            <Circle size={16} style={{ color: "var(--text-muted)" }} />
          )}
        </button>

        <span className={`task-title ${isDone ? "done" : ""}`}>{task.title}</span>

        <div className="task-actions">
          <button
            className="btn btn-icon btn-sm btn-secondary"
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            title="Edit"
          >
            <Edit2 size={13} />
          </button>
          <button
            className="btn btn-icon btn-sm btn-danger"
            onClick={handleDelete}
            disabled={deleting}
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="task-desc">{task.description}</p>
      )}

      <div className="task-meta">
        <span className={`badge badge-${task.status}`}>
          {STATUS_LABELS[task.status] || task.status}
        </span>
        <span className={`badge badge-${task.priority}`}>
          {PRIORITY_LABELS[task.priority] || task.priority}
        </span>
      </div>

      <div className="task-meta" style={{ marginTop: "0.5rem" }}>
        {task.due_date && (
          <span className={`task-date ${isOverdue ? "overdue" : ""}`}>
            <Calendar size={11} />
            {isOverdue ? "Overdue · " : "Due "}
            {formatDistanceToNow(parseISO(task.due_date), { addSuffix: true })}
          </span>
        )}
        {task.tags?.slice(0, 3).map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: "0.7rem",
              padding: "0.125rem 0.5rem",
              borderRadius: "var(--radius-full)",
              background: "var(--bg-glass)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}
