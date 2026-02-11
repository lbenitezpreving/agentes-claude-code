import React from 'react';
import styles from './TaskList.module.css';

export interface Project {
  id: number;
  name: string;
  color: string;
}

export interface Task {
  id: number;
  name: string;
  description?: string;
  completed: boolean;
  project_id?: number;
  created_at: string;
  completed_at?: string;
}

const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} a las ${hours}:${minutes}`;
};

export interface TaskListProps {
  tasks: Task[];
  projects?: Project[];
  onTaskToggle?: (taskId: number) => void;
  onTaskDelete?: (taskId: number) => void;
  onTaskEdit?: (task: Task) => void;
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  projects = [],
  onTaskToggle,
  onTaskDelete,
  onTaskEdit,
  className = '',
  loading = false,
  emptyMessage = 'No hay tareas',
}) => {
  const getProject = (projectId?: number): Project | undefined => {
    return projects.find((p) => p.id === projectId);
  };

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
      {tasks.map((task) => {
        const project = getProject(task.project_id);
        return (
          <li
            key={task.id}
            className={`${styles.task} ${task.completed ? styles.completed : ''}`}
          >
            <div className={styles.taskContent}>
              <label className={styles.taskLabel}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => onTaskToggle?.(task.id)}
                  className={styles.checkbox}
                />
                <span className={styles.taskName}>{task.name}</span>
              </label>
              {project && (
                <span
                  className={styles.projectBadge}
                  style={{ backgroundColor: project.color }}
                >
                  {project.name}
                </span>
              )}
            </div>
            {task.description && (
              <p className={styles.taskDescription}>{task.description}</p>
            )}
            <div className={styles.taskDates}>
              <span className={styles.taskDate}>
                Creada el {formatDate(task.created_at)}
              </span>
              {task.completed && task.completed_at && (
                <span className={styles.taskDate}>
                  Completada el {formatDate(task.completed_at)}
                </span>
              )}
            </div>
            <div className={styles.taskActions}>
              {onTaskEdit && (
                <button
                  onClick={() => onTaskEdit(task)}
                  className={styles.editButton}
                  aria-label={`Editar ${task.name}`}
                >
                  ✎
                </button>
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
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default TaskList;
