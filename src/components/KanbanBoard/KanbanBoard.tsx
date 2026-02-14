import React, { useState } from 'react';
import SubtaskChecklist, { Subtask } from '../SubtaskChecklist';
import styles from './KanbanBoard.module.css';

export type TaskStatus = 'backlog' | 'doing' | 'done';

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

interface Project {
  id: number;
  name: string;
  description: string;
}

interface KanbanBoardProps {
  tasks: Task[];
  projects?: Project[];
  onTaskStatusChange?: (taskId: number, newStatus: TaskStatus) => void;
  onTaskToggle?: (taskId: number) => void;
  onTaskDelete?: (taskId: number) => void;
  onTaskEdit?: (task: Task) => void;
  onSubtaskToggle?: (subtaskId: number, taskId: number) => void;
  loading?: boolean;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  projects = [],
  onTaskStatusChange,
  onTaskToggle,
  onTaskDelete,
  onTaskEdit,
  onSubtaskToggle,
  loading = false,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const columns: { status: TaskStatus; title: string; className: string }[] = [
    { status: 'backlog', title: 'Backlog', className: styles.backlog },
    { status: 'doing', title: 'En Progreso', className: styles.doing },
    { status: 'done', title: 'Completado', className: styles.done },
  ];

  const getTasksByStatus = (status: TaskStatus): Task[] => {
    return tasks.filter((task) => task.status === status);
  };

  const getProjectName = (projectId: number | null): string | null => {
    if (projectId === null) return null;
    const project = projects.find((p) => p.id === projectId);
    return project ? project.name : null;
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: number) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (status: TaskStatus) => {
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: TaskStatus) => {
    e.preventDefault();
    if (draggedTaskId !== null && onTaskStatusChange) {
      onTaskStatusChange(draggedTaskId, newStatus);
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={styles.board}>
      {columns.map(({ status, title, className }) => (
        <div
          key={status}
          className={`${styles.column} ${className} ${
            dragOverColumn === status ? styles.dragOver : ''
          }`}
          data-column={status}
          data-testid={`kanban-column-${status}`}
          onDragOver={handleDragOver}
          onDragEnter={() => handleDragEnter(status)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, status)}
        >
          <div className={styles.columnHeader}>
            {title} ({getTasksByStatus(status).length})
          </div>
          {loading ? (
            <div className={styles.loading}>Cargando...</div>
          ) : (
            getTasksByStatus(status).map((task) => {
              const projectName = getProjectName(task.project_id);
              return (
                <div
                  key={task.id}
                  className={styles.card}
                  data-testid="task-card"
                  data-task-id={task.id}
                  data-task-name={task.name}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                >
                  <div className={styles.cardHeader}>
                    <h4 className={styles.cardTitle}>{task.name}</h4>
                    {projectName && (
                      <span className={styles.projectBadge}>{projectName}</span>
                    )}
                  </div>
                  <p className={styles.cardDescription}>{task.description}</p>

                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className={styles.subtasksContainer}>
                      <SubtaskChecklist
                        taskId={task.id}
                        subtasks={task.subtasks}
                        onSubtaskToggle={(subtaskId) => onSubtaskToggle?.(subtaskId, task.id)}
                        readonly={false}
                      />
                    </div>
                  )}

                  <div className={styles.cardDates}>
                    <small>Creado: {formatDate(task.created_at)}</small>
                    {task.completed_at && (
                      <small>Completado: {formatDate(task.completed_at)}</small>
                    )}
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      className={styles.btnEdit}
                      onClick={() => onTaskEdit?.(task)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      className={styles.btnToggle}
                      onClick={() => onTaskToggle?.(task.id)}
                      title={task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                    >
                      {task.completed ? '✓' : '○'}
                    </button>
                    <button
                      className={styles.btnDelete}
                      onClick={() => onTaskDelete?.(task.id)}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
