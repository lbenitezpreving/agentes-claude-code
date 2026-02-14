import { useState, useEffect, useCallback } from 'react';
// import TaskList, { Task } from './components/TaskList';
import KanbanBoard, { TaskStatus } from './components/KanbanBoard';
import TaskEditPanel, { Project, TaskData } from './components/TaskEditPanel';
import { Subtask } from './components/SubtaskChecklist';
import styles from './App.module.css';

const API_URL = '/api';

interface Task {
  id: number;
  name: string;
  description: string;
  completed: boolean;
  project_id: number | null;
  created_at: string;
  completed_at: string | null;
  status: TaskStatus;
  subtasks: Subtask[];
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<TaskData | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/tasks`);
      if (!response.ok) throw new Error('Error al cargar tareas');
      const data = await response.json();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError('No se pudo conectar con el servidor. Asegura que el backend esta corriendo.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/projects`);
      if (!response.ok) throw new Error('Error al cargar proyectos');
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      console.error('Error cargando proyectos:', err);
    }
  }, []);

  const fetchSubtasks = useCallback(async (taskId: number) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}/subtasks`);
      if (!response.ok) throw new Error('Error al cargar subtareas');
      const data = await response.json();
      setSubtasks(data);
    } catch (err) {
      console.error('Error cargando subtareas:', err);
      setSubtasks([]);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [fetchTasks, fetchProjects]);

  useEffect(() => {
    if (editingTask) {
      fetchSubtasks(editingTask.id);
    } else {
      setSubtasks([]);
    }
  }, [editingTask, fetchSubtasks]);

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}/status?new_status=${newStatus}`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Error al actualizar');
      const updated = await response.json();
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? updated : t))
      );
    } catch (err) {
      setError('Error al cambiar el estado de la tarea');
    }
  };

  const handleToggle = async (taskId: number) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}/toggle`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Error al actualizar');
      const updated = await response.json();
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? updated : t))
      );
    } catch (err) {
      setError('Error al actualizar la tarea');
    }
  };

  const handleDelete = async (taskId: number) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar');
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      setError('Error al eliminar la tarea');
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task as TaskData);
    setIsPanelOpen(true);
  };

  const handleSaveEdit = async (
    taskId: number,
    data: { name: string; description?: string; project_id?: number }
  ) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al actualizar');
      const updated = await response.json();
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? updated : t))
      );
    } catch (err) {
      setError('Error al actualizar la tarea');
    }
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setEditingTask(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTaskName,
          description: newTaskDesc || undefined,
          project_id: newTaskProjectId,
        }),
      });
      if (!response.ok) throw new Error('Error al crear');
      const created = await response.json();
      setTasks((prev) => [...prev, created]);
      setNewTaskName('');
      setNewTaskDesc('');
      setNewTaskProjectId(undefined);
    } catch (err) {
      setError('Error al crear la tarea');
    }
  };

  const handleSubtaskToggle = async (subtaskId: number, taskId?: number) => {
    const targetTaskId = taskId || editingTask?.id;
    if (!targetTaskId) return;

    try {
      const response = await fetch(`${API_URL}/tasks/${targetTaskId}/subtasks/${subtaskId}/toggle`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Error al actualizar subtarea');

      // Refrescar tasks (incluye subtasks)
      await fetchTasks();

      // Si estamos en el panel de edición, también refrescar subtasks
      if (editingTask && editingTask.id === targetTaskId) {
        await fetchSubtasks(targetTaskId);
      }
    } catch (err) {
      setError('Error al actualizar la subtarea');
    }
  };

  const handleSubtaskAdd = async (name: string) => {
    if (!editingTask) return;

    try {
      const response = await fetch(`${API_URL}/tasks/${editingTask.id}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error('Error al crear subtarea');

      // Refrescar subtasks
      await fetchSubtasks(editingTask.id);
    } catch (err) {
      setError('Error al crear la subtarea');
    }
  };

  const handleSubtaskDelete = async (subtaskId: number) => {
    if (!editingTask) return;

    try {
      const response = await fetch(`${API_URL}/tasks/${editingTask.id}/subtasks/${subtaskId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar subtarea');

      // Refrescar subtasks y tasks (el status puede haber cambiado)
      await Promise.all([
        fetchSubtasks(editingTask.id),
        fetchTasks(),
      ]);
    } catch (err) {
      setError('Error al eliminar la subtarea');
    }
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Tablero Kanban</h1>
        <p>Demo de Claude Code - React + FastAPI</p>
      </header>

      <main className={styles.main}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="Nueva tarea..."
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            className={styles.input}
          />
          <input
            type="text"
            placeholder="Descripcion (opcional)"
            value={newTaskDesc}
            onChange={(e) => setNewTaskDesc(e.target.value)}
            className={styles.input}
          />
          <select
            value={newTaskProjectId || ''}
            onChange={(e) => setNewTaskProjectId(e.target.value ? Number(e.target.value) : undefined)}
            className={styles.select}
          >
            <option value="">Sin proyecto</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <button type="submit" className={styles.button}>
            Agregar
          </button>
        </form>

        {error && <div className={styles.error}>{error}</div>}

        <KanbanBoard
          tasks={tasks}
          projects={projects.map(p => ({ id: p.id, name: p.name, description: '' }))}
          loading={loading}
          onTaskStatusChange={handleStatusChange}
          onTaskToggle={handleToggle}
          onTaskDelete={handleDelete}
          onTaskEdit={handleEdit}
          onSubtaskToggle={handleSubtaskToggle}
        />
      </main>

      <TaskEditPanel
        task={editingTask}
        projects={projects}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        onSave={handleSaveEdit}
        subtasks={subtasks}
        onSubtaskToggle={handleSubtaskToggle}
        onSubtaskAdd={handleSubtaskAdd}
        onSubtaskDelete={handleSubtaskDelete}
      />
    </div>
  );
}

export default App;
