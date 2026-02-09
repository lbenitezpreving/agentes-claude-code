import React from 'react';
import styles from './TaskList.module.css';

export interface Task {
  id: number;
  name: string;
  description?: string;
  completed: boolean;
  created_at: string;
}

export interface TaskListProps {
  tasks: Task[];
  onTaskToggle?: (taskId: number) => void;
  onTaskDelete?: (taskId: number) => void;
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onTaskToggle,
  onTaskDelete,
  className = '',
  loading = false,
  emptyMessage = 'No hay tareas',
}) => {
  if (loading) {
    return (
      <div className={`${styles.container} ${styles.loading} ${className}`}>
        <p>Cargando tareas...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className={`${styles.container} ${styles.empty} ${className}`}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className={`${styles.container} ${className}`}>
      {tasks.map((task) => (
        <li
          key={task.id}
          className={`${styles.task} ${task.completed ? styles.completed : ''}`}
        >
          <label className={styles.taskLabel}>
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onTaskToggle?.(task.id)}
              className={styles.checkbox}
            />
            <span className={styles.taskName}>{task.name}</span>
          </label>
          {task.description && (
            <p className={styles.taskDescription}>{task.description}</p>
          )}
          {onTaskDelete && (
            <button
              onClick={() => onTaskDelete(task.id)}
              className={styles.deleteButton}
              aria-label={`Eliminar ${task.name}`}
            >
              ×
            </button>
          )}
        </li>
      ))}
    </ul>
  );
};

export default TaskList;
