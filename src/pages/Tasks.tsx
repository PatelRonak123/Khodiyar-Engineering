import React, { useState, useMemo } from "react";
import { Plus, CheckCircle, Eye, UserCheck } from "lucide-react";
import {
  SearchBar,
  StatusBadge,
  PriorityBadge,
  SectionHeader,
  Drawer,
  InfoGrid,
  FormField,
  Modal,
} from "../components/ui";
import type { Task, Priority, Department } from "../types";
import { useERP } from "../context/ERPContext";

const deptColors: Record<string, string> = {
  Design: "bg-purple-100 text-purple-700",
  Sales: "bg-blue-100 text-blue-700",
  Purchase: "bg-amber-100 text-amber-700",
  Fabrication: "bg-orange-100 text-orange-700",
  Assembly: "bg-indigo-100 text-indigo-700",
  "Quality Control": "bg-teal-100 text-teal-700",
  Dispatch: "bg-emerald-100 text-emerald-700",
  Production: "bg-red-100 text-red-700",
  Engineering: "bg-cyan-100 text-cyan-700",
  Accounts: "bg-gray-100 text-gray-700",
};

export function Tasks() {
  const {
    tasks,
    employees,
    jobs,
    addTask,
    updateTask,
    currentUser,
    currentRole,
  } = useERP();
  const isSuperAdmin = currentRole === "super_admin";

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<Task | null>(null);
  const [view, setView] = useState<"list" | "kanban">("list");

  // New task form state
  const [taskName, setTaskName] = useState("");
  const [jobId, setJobId] = useState(jobs[0]?.id || "JOB-001");
  const [department, setDepartment] = useState<Department>(
    (currentUser?.department as Department) || "Fabrication",
  );
  const [assignedEmployeeId, setAssignedEmployeeId] = useState(
    currentUser?.id || employees[0]?.id || "EMP-005",
  );
  const [priority, setPriority] = useState<Priority>("High");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
  );
  const [estimatedHours, setEstimatedHours] = useState(16);

  // Scope tasks to logged in employee if not super_admin
  const scopedTasks = useMemo(() => {
    if (isSuperAdmin || !currentUser) {
      return tasks;
    }
    return tasks.filter(
      (t) =>
        t.assignedEmployeeId === currentUser.id ||
        t.assignedEmployeeId === currentUser.employeeId ||
        t.assignedEmployeeId === currentUser.name,
    );
  }, [tasks, isSuperAdmin, currentUser]);

  const departments = [
    "All",
    ...Array.from(new Set(scopedTasks.map((t) => t.department))),
  ];
  const statuses = [
    "All",
    "Todo",
    "In Progress",
    "Waiting",
    "Completed",
    "Blocked",
  ];

  const filtered = scopedTasks.filter((t) => {
    const matchSearch =
      t.taskName.toLowerCase().includes(search.toLowerCase()) ||
      t.taskId.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || t.department === deptFilter;
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const kanbanCols: Task["status"][] = [
    "Todo",
    "In Progress",
    "Waiting",
    "Completed",
    "Blocked",
  ];

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName) {
      alert("Please enter a task name.");
      return;
    }
    const newTask: Task = {
      id: `TASK-${Date.now()}`,
      taskId: `TSK-2026-${String(tasks.length + 1).padStart(3, "0")}`,
      taskName,
      jobId,
      department: department as any,
      assignedEmployeeId,
      priority,
      startDate,
      dueDate,
      estimatedHours: Number(estimatedHours) || 8,
      status: "Todo",
      createdAt: new Date().toISOString().split("T")[0],
    };
    addTask(newTask);
    setAddOpen(false);
    setTaskName("");
  };

  const handleStatusChange = (id: string, newStatus: Task["status"]) => {
    updateTask(id, {
      status: newStatus,
      completedAt:
        newStatus === "Completed"
          ? new Date().toISOString().split("T")[0]
          : undefined,
    });
    if (selected && selected.id === id) {
      setSelected((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title={isSuperAdmin ? "Task Management" : "My Assigned Tasks"}
        subtitle={
          isSuperAdmin
            ? `${tasks.length} tasks · ${tasks.filter((t) => t.status === "In Progress").length} in progress`
            : `${scopedTasks.length} task(s) assigned to ${currentUser?.name || "you"} · ${scopedTasks.filter((t) => t.status === "In Progress").length} in progress`
        }
        actions={
          <>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search tasks..."
              className="w-52"
            />
            {departments.length > 2 && (
              <select
                className="select w-auto text-xs"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}
            <select
              className="select w-auto text-xs"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {["list", "kanban"].map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v as "list" | "kanban")}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === v ? "bg-brand-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            <button
              className="btn-primary"
              onClick={() => {
                if (currentUser) {
                  setAssignedEmployeeId(currentUser.id);
                  setDepartment((currentUser.department as Department) || "Fabrication");
                }
                setAddOpen(true);
              }}
            >
              <Plus size={14} /> New Task
            </button>
          </>
        }
      />

      {/* Notice for logged in employee */}
      {!isSuperAdmin && currentUser && (
        <div className="bg-brand-50/70 border border-brand-100 rounded-xl p-3 flex items-center justify-between text-xs text-brand-900">
          <div className="flex items-center gap-2">
            <UserCheck size={16} className="text-brand-600" />
            <span>
              Showing tasks assigned to <strong>{currentUser.name}</strong> (
              {currentUser.employeeId || currentUser.department})
            </span>
          </div>
          <span className="font-semibold text-brand-700">
            {filtered.length} task(s) found
          </span>
        </div>
      )}

      {view === "list" && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-th">Task</th>
                <th className="table-th">Job</th>
                <th className="table-th">Department</th>
                <th className="table-th">Assigned To</th>
                <th className="table-th">Priority</th>
                <th className="table-th">Due Date</th>
                <th className="table-th">Est Hrs</th>
                <th className="table-th">Status</th>
                <th className="table-th w-8"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-12 text-center text-gray-400 text-sm"
                  >
                    No tasks found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((task) => {
                  const emp = employees.find(
                    (e) =>
                      e.id === task.assignedEmployeeId ||
                      e.employeeId === task.assignedEmployeeId,
                  );
                  const job = jobs.find((j) => j.id === task.jobId);
                  return (
                    <tr
                      key={task.id}
                      className="table-row cursor-pointer"
                      onClick={() => setSelected(task)}
                    >
                      <td className="table-td">
                        <p className="font-medium text-sm">{task.taskName}</p>
                        <p className="text-xs text-gray-400 font-mono">
                          {task.taskId}
                        </p>
                      </td>
                      <td className="table-td font-mono text-blue-700 text-xs">
                        {job?.jobNumber}
                      </td>
                      <td className="table-td">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${deptColors[task.department] ?? "bg-gray-100 text-gray-700"}`}
                        >
                          {task.department}
                        </span>
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-brand-700">
                              {emp?.name.charAt(0) ?? "E"}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-800">
                            {emp?.name ?? "Assigned"}
                          </span>
                        </div>
                      </td>
                      <td className="table-td">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="table-td text-xs text-gray-500">
                        {task.dueDate}
                      </td>
                      <td className="table-td text-sm">
                        {task.estimatedHours}h
                      </td>
                      <td className="table-td">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="table-td">
                        <Eye size={14} className="text-gray-300" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {view === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {kanbanCols.map((col) => {
            const colTasks = filtered.filter((t) => t.status === col);
            return (
              <div key={col} className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                    {col}
                  </h3>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {colTasks.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg">
                      No {col.toLowerCase()} tasks
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const emp = employees.find(
                        (e) =>
                          e.id === task.assignedEmployeeId ||
                          e.employeeId === task.assignedEmployeeId,
                      );
                      return (
                        <div
                          key={task.id}
                          className="bg-white rounded-xl p-3 border border-gray-100 hover:border-brand-200 cursor-pointer transition-all hover:shadow-sm"
                          onClick={() => setSelected(task)}
                        >
                          <p className="text-sm font-medium text-gray-800 leading-snug">
                            {task.taskName}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 font-mono">
                            {jobs.find((j) => j.id === task.jobId)?.jobNumber}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded ${deptColors[task.department] ?? "bg-gray-100 text-gray-600"}`}
                            >
                              {task.department}
                            </span>
                            <PriorityBadge priority={task.priority} />
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500 font-medium">
                              {emp?.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              {task.dueDate}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <Drawer
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected.taskId}
          subtitle={selected.taskName}
        >
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <StatusBadge status={selected.status} />
              <PriorityBadge priority={selected.priority} />
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${deptColors[selected.department]}`}
              >
                {selected.department}
              </span>
            </div>
            <InfoGrid
              items={[
                { label: "Task ID", value: selected.taskId },
                {
                  label: "Job",
                  value:
                    jobs.find((j) => j.id === selected.jobId)?.jobNumber ?? "—",
                },
                { label: "Department", value: selected.department },
                {
                  label: "Assigned To",
                  value:
                    employees.find(
                      (e) =>
                        e.id === selected.assignedEmployeeId ||
                        e.employeeId === selected.assignedEmployeeId,
                    )?.name ?? "—",
                },
                {
                  label: "Priority",
                  value: <PriorityBadge priority={selected.priority} />,
                },
                { label: "Start Date", value: selected.startDate },
                { label: "Due Date", value: selected.dueDate },
                { label: "Est. Hours", value: `${selected.estimatedHours}h` },
                {
                  label: "Actual Hours",
                  value: selected.actualHours
                    ? `${selected.actualHours}h`
                    : "—",
                },
                { label: "Completed At", value: selected.completedAt ?? "—" },
              ]}
            />
            <div className="space-y-2 pt-2">
              <p className="label">Update Status</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  className="btn-secondary text-xs"
                  onClick={() => handleStatusChange(selected.id, "In Progress")}
                >
                  In Progress
                </button>
                <button
                  className="btn-secondary text-xs"
                  onClick={() => handleStatusChange(selected.id, "Waiting")}
                >
                  Waiting
                </button>
                <button
                  className="btn-success text-xs"
                  onClick={() => handleStatusChange(selected.id, "Completed")}
                >
                  <CheckCircle size={12} /> Complete
                </button>
              </div>
            </div>
          </div>
        </Drawer>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="New Task"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleCreateTask}
            >
              Create Task
            </button>
          </div>
        }
      >
        <form onSubmit={handleCreateTask} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormField label="Task Name" required>
              <input
                className="input"
                placeholder="Enter task name..."
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                required
              />
            </FormField>
          </div>
          <FormField label="Job" required>
            <select
              className="select"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.jobNumber} — {j.productName}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Department" required>
            <select
              className="select"
              value={department}
              onChange={(e) => setDepartment(e.target.value as Department)}
            >
              {Object.keys(deptColors).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Assign To" required>
            <select
              className="select"
              value={assignedEmployeeId}
              onChange={(e) => setAssignedEmployeeId(e.target.value)}
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.department})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Priority">
            <select
              className="select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </FormField>
          <FormField label="Start Date">
            <input
              type="date"
              className="input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </FormField>
          <FormField label="Due Date" required>
            <input
              type="date"
              className="input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Estimated Hours">
            <input
              type="number"
              className="input"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(Number(e.target.value))}
              min={1}
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}

export default Tasks;
