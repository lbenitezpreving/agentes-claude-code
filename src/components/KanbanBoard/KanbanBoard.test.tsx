import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import KanbanBoard, { type TaskStatus } from './KanbanBoard';

interface Task {
  id: number;
  name: string;
  description: string;
  completed: boolean;
  project_id: number | null;
  created_at: string;
  completed_at: string | null;
  status: TaskStatus;
}

interface Project {
  id: number;
  name: string;
  description: string;
}

const mockTasks: Task[] = [
  {
    id: 1,
    name: 'Tarea en Backlog',
    description: 'Descripción de tarea en backlog',
    completed: false,
    project_id: 1,
    created_at: '2024-01-01T10:00:00Z',
    completed_at: null,
    status: 'backlog',
  },
  {
    id: 2,
    name: 'Tarea en Progreso',
    description: 'Descripción de tarea en progreso',
    completed: false,
    project_id: null,
    created_at: '2024-01-02T10:00:00Z',
    completed_at: null,
    status: 'doing',
  },
  {
    id: 3,
    name: 'Tarea Completada',
    description: 'Descripción de tarea completada',
    completed: true,
    project_id: 2,
    created_at: '2024-01-03T10:00:00Z',
    completed_at: '2024-01-10T10:00:00Z',
    status: 'done',
  },
];

const mockProjects: Project[] = [
  { id: 1, name: 'Proyecto A', description: 'Descripción A' },
  { id: 2, name: 'Proyecto B', description: 'Descripción B' },
];

describe('KanbanBoard', () => {
  it('renderiza las 3 columnas correctamente', () => {
    render(<KanbanBoard tasks={mockTasks} projects={mockProjects} />);

    expect(screen.getByText(/Backlog \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/En Progreso \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Completado \(1\)/i)).toBeInTheDocument();
  });

  it('muestra el conteo correcto de tareas en cada columna', () => {
    render(<KanbanBoard tasks={mockTasks} projects={mockProjects} />);

    expect(screen.getByText(/Backlog \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/En Progreso \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Completado \(1\)/i)).toBeInTheDocument();
  });

  it('las tarjetas aparecen en la columna correcta según su status', () => {
    render(<KanbanBoard tasks={mockTasks} projects={mockProjects} />);

    expect(screen.getByRole('heading', { name: 'Tarea en Backlog' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tarea en Progreso' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tarea Completada' })).toBeInTheDocument();
  });

  it('muestra el badge de proyecto cuando la tarea tiene project_id', () => {
    render(<KanbanBoard tasks={mockTasks} projects={mockProjects} />);

    expect(screen.getByText('Proyecto A')).toBeInTheDocument();
    expect(screen.getByText('Proyecto B')).toBeInTheDocument();
  });

  it('muestra las fechas de creación y completado', () => {
    render(<KanbanBoard tasks={mockTasks} projects={mockProjects} />);

    const creadoTexts = screen.getAllByText(/Creado:/i);
    expect(creadoTexts.length).toBeGreaterThan(0);

    const completadoTexts = screen.getAllByText(/Completado:/i);
    expect(completadoTexts.length).toBeGreaterThan(0);
  });

  it('llama a onTaskEdit cuando se hace clic en el botón de editar', () => {
    const onTaskEdit = vi.fn();
    render(
      <KanbanBoard
        tasks={mockTasks}
        projects={mockProjects}
        onTaskEdit={onTaskEdit}
      />
    );

    const editButtons = screen.getAllByTitle('Editar');
    fireEvent.click(editButtons[0]);

    expect(onTaskEdit).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('llama a onTaskToggle cuando se hace clic en el botón de toggle', () => {
    const onTaskToggle = vi.fn();
    render(
      <KanbanBoard
        tasks={mockTasks}
        projects={mockProjects}
        onTaskToggle={onTaskToggle}
      />
    );

    const toggleButtons = screen.getAllByTitle(/Marcar como/i);
    fireEvent.click(toggleButtons[0]);

    expect(onTaskToggle).toHaveBeenCalledWith(1);
  });

  it('llama a onTaskDelete cuando se hace clic en el botón de eliminar', () => {
    const onTaskDelete = vi.fn();
    render(
      <KanbanBoard
        tasks={mockTasks}
        projects={mockProjects}
        onTaskDelete={onTaskDelete}
      />
    );

    const deleteButtons = screen.getAllByTitle('Eliminar');
    fireEvent.click(deleteButtons[0]);

    expect(onTaskDelete).toHaveBeenCalledWith(1);
  });

  it('simula drag & drop y llama a onTaskStatusChange', () => {
    const onTaskStatusChange = vi.fn();
    render(
      <KanbanBoard
        tasks={mockTasks}
        projects={mockProjects}
        onTaskStatusChange={onTaskStatusChange}
      />
    );

    const card = screen.getByRole('heading', { name: 'Tarea en Backlog' }).closest('div[draggable="true"]');
    expect(card).toBeInTheDocument();

    if (card) {
      const dragStartEvent = new Event('dragstart', { bubbles: true });
      Object.defineProperty(dragStartEvent, 'dataTransfer', {
        value: { effectAllowed: '', dropEffect: '' },
      });
      fireEvent(card, dragStartEvent);

      const doingColumn = screen.getByText(/En Progreso \(1\)/i).closest('div[class*="column"]');
      expect(doingColumn).toBeInTheDocument();

      if (doingColumn) {
        const dropEvent = new Event('drop', { bubbles: true });
        Object.defineProperty(dropEvent, 'dataTransfer', {
          value: { dropEffect: '' },
        });
        fireEvent(doingColumn, dropEvent);

        expect(onTaskStatusChange).toHaveBeenCalledWith(1, 'doing');
      }
    }
  });

  it('muestra mensaje de carga cuando loading es true', () => {
    render(<KanbanBoard tasks={mockTasks} projects={mockProjects} loading={true} />);

    const loadingMessages = screen.getAllByText('Cargando...');
    expect(loadingMessages.length).toBe(3);
  });

  it('renderiza correctamente sin proyectos', () => {
    render(<KanbanBoard tasks={mockTasks} />);

    expect(screen.getByRole('heading', { name: 'Tarea en Backlog' })).toBeInTheDocument();
    expect(screen.queryByText('Proyecto A')).not.toBeInTheDocument();
  });

  it('renderiza correctamente sin callbacks', () => {
    render(<KanbanBoard tasks={mockTasks} projects={mockProjects} />);

    expect(screen.getByRole('heading', { name: 'Tarea en Backlog' })).toBeInTheDocument();
  });
});
