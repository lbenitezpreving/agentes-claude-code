import React, { useState, KeyboardEvent } from 'react';
import styles from './SubtaskChecklist.module.css';

export interface Subtask {
  id: number;
  task_id: number;
  name: string;
  completed: boolean;
  position: number;
  created_at: string;
  completed_at?: string;
}

export interface SubtaskChecklistProps {
  taskId: number;
  subtasks: Subtask[];
  onSubtaskToggle?: (subtaskId: number) => void;
  onSubtaskAdd?: (name: string) => void;
  onSubtaskDelete?: (subtaskId: number) => void;
  readonly?: boolean;
}

const SubtaskChecklist: React.FC<SubtaskChecklistProps> = ({
  taskId,
  subtasks,
  onSubtaskToggle,
  onSubtaskAdd,
  onSubtaskDelete,
  readonly = false,
}) => {
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const completedCount = subtasks.filter((st) => st.completed).length;
  const totalCount = subtasks.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleAddClick = () => {
    setIsAdding(true);
  };

  const handleAddConfirm = () => {
    if (newSubtaskName.trim() && onSubtaskAdd) {
      onSubtaskAdd(newSubtaskName.trim());
      setNewSubtaskName('');
      setIsAdding(false);
    }
  };

  const handleAddCancel = () => {
    setNewSubtaskName('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleAddCancel();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h4 className={styles.title}>Subtareas</h4>
        <span className={styles.progress}>
          {completedCount}/{totalCount} completadas
        </span>
      </div>

      {totalCount > 0 && (
        <div className={styles.progressBarContainer}>
          <div
            className={styles.progressBar}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      <ul className={styles.subtaskList}>
        {subtasks.map((subtask) => (
          <li key={subtask.id} className={styles.subtaskItem}>
            <label className={styles.subtaskLabel}>
              <input
                type="checkbox"
                checked={subtask.completed}
                onChange={() => onSubtaskToggle?.(subtask.id)}
                className={styles.checkbox}
                disabled={readonly}
              />
              <span
                className={`${styles.subtaskName} ${
                  subtask.completed ? styles.completed : ''
                }`}
              >
                {subtask.name}
              </span>
            </label>
            {!readonly && onSubtaskDelete && (
              <button
                onClick={() => onSubtaskDelete(subtask.id)}
                className={styles.deleteButton}
                aria-label={`Eliminar ${subtask.name}`}
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>

      {!readonly && onSubtaskAdd && (
        <div className={styles.addSection}>
          {isAdding ? (
            <div className={styles.addInputContainer}>
              <input
                type="text"
                value={newSubtaskName}
                onChange={(e) => setNewSubtaskName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nombre de la subtarea..."
                className={styles.addInput}
                autoFocus
              />
              <div className={styles.addActions}>
                <button
                  onClick={handleAddConfirm}
                  className={styles.confirmButton}
                  disabled={!newSubtaskName.trim()}
                >
                  ✓
                </button>
                <button
                  onClick={handleAddCancel}
                  className={styles.cancelButton}
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <button onClick={handleAddClick} className={styles.addButton}>
              + Añadir subtarea
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SubtaskChecklist;
