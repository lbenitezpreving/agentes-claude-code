import React, { useState, useEffect } from 'react';
import SubtaskChecklist, { Subtask } from '../SubtaskChecklist';
import styles from './TaskEditPanel.module.css';

export interface Project {
  id: number;
  name: string;
  color: string;
}

export interface TaskData {
  id: number;
  name: string;
  description?: string;
  completed: boolean;
  project_id?: number;
  created_at: string;
  completed_at?: string;
}

export interface TaskEditPanelProps {
  task: TaskData | null;
  projects: Project[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: number, data: { name: string; description?: string; project_id?: number }) => void;
  subtasks?: Subtask[];
  onSubtaskToggle?: (subtaskId: number) => void;
  onSubtaskAdd?: (name: string) => void;
  onSubtaskDelete?: (subtaskId: number) => void;
  className?: string;
}

const TaskEditPanel: React.FC<TaskEditPanelProps> = ({
  task,
  projects,
  isOpen,
  onClose,
  onSave,
  subtasks = [],
  onSubtaskToggle,
  onSubtaskAdd,
  onSubtaskDelete,
  className = '',
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (task) {
      setName(task.name);
      setDescription(task.description || '');
      setProjectId(task.project_id);
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task && name.trim()) {
      onSave(task.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        project_id: projectId,
      });
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div
      className={`${styles.overlay} ${className}`}
      onClick={handleOverlayClick}
    >
      <div className={`${styles.panel} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <h2>Editar Tarea</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Cerrar panel"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="task-name">Nombre</label>
            <input
              id="task-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre de la tarea"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="task-description">Descripción</label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción opcional"
              rows={3}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="task-project">Proyecto</label>
            <select
              id="task-project"
              value={projectId || ''}
              onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">Sin proyecto</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.subtasksSection}>
            <SubtaskChecklist
              taskId={task.id}
              subtasks={subtasks}
              onSubtaskToggle={onSubtaskToggle}
              onSubtaskAdd={onSubtaskAdd}
              onSubtaskDelete={onSubtaskDelete}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancelar
            </button>
            <button type="submit" className={styles.saveButton}>
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskEditPanel;
