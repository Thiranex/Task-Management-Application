import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";
import TaskModal from "../components/TaskModal";

export default function AppLayout() {
  const [showNewTask, setShowNewTask] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar onNewTask={() => setShowNewTask(true)} />
      <MobileNav onNewTask={() => setShowNewTask(true)} />

      <main className="main-content">
        <Outlet />
      </main>

      {showNewTask && (
        <TaskModal
          task={null}
          onClose={() => setShowNewTask(false)}
          onSaved={() => {
            setShowNewTask(false);
            // Pages will re-fetch via their own effects or WS
            window.dispatchEvent(new CustomEvent("task-created"));
          }}
        />
      )}
    </div>
  );
}
