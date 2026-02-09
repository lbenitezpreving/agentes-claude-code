import { useState, useEffect, useCallback } from 'react';
import TaskList, { Task } from './components/TaskList';
import styles from './App.module.css';

const API_URL = '/api';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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
        }),
      });
      if (!response.ok) throw new Error('Error al crear');
      const created = await response.json();
      setTasks((prev) => [...prev, created]);
      setNewTaskName('');
      setNewTaskDesc('');
    } catch (err) {
      setError('Error al crear la tarea');
    }
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Lista de Tareas</h1>
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
          <button type="submit" className={styles.button}>
            Agregar
          </button>
        </form>

        {error && <div className={styles.error}>{error}</div>}

        <TaskList
          tasks={tasks}
          loading={loading}
          onTaskToggle={handleToggle}
          onTaskDelete={handleDelete}
          emptyMessage="No hay tareas. Crea una nueva!"
        />
      </main>
    </div>
  );
}

export default App;
