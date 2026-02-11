import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskList, { Task, Project } from './TaskList';

const mockProjects: Project[] = [
  { id: 1, name: 'Trabajo', color: '#3498db' },
  { id: 2, name: 'Personal', color: '#2ecc71' },
];

const mockTasks: Task[] = [
  {
    id: 1,
    name: 'Tarea 1',
    description: 'Descripción de tarea 1',
    completed: false,
    project_id: 1,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Tarea 2',
    completed: true,
    project_id: 2,
    created_at: '2024-01-02T00:00:00Z',
    completed_at: '2024-01-03T14:30:00Z',
  },
  {
    id: 3,
    name: 'Tarea sin proyecto',
    completed: false,
    created_at: '2024-01-04T00:00:00Z',
  },
];

describe('TaskList', () => {
  it('renders tasks correctly', () => {
    render(<TaskList tasks={mockTasks} />);

    expect(screen.getByText('Tarea 1')).toBeInTheDocument();
    expect(screen.getByText('Tarea 2')).toBeInTheDocument();
  });

  it('shows empty message when no tasks', () => {
    render(<TaskList tasks={[]} />);

    expect(screen.getByText('No hay tareas')).toBeInTheDocument();
  });

  it('shows custom empty message', () => {
    render(<TaskList tasks={[]} emptyMessage="Lista vacía" />);

    expect(screen.getByText('Lista vacía')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<TaskList tasks={[]} loading={true} />);

    expect(screen.getByText('Cargando tareas...')).toBeInTheDocument();
  });

  it('calls onTaskToggle when checkbox clicked', () => {
    const mockToggle = vi.fn();
    render(<TaskList tasks={mockTasks} onTaskToggle={mockToggle} />);

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(mockToggle).toHaveBeenCalledWith(1);
  });

  it('calls onTaskDelete when delete button clicked', () => {
    const mockDelete = vi.fn();
    render(<TaskList tasks={mockTasks} onTaskDelete={mockDelete} />);

    const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
    fireEvent.click(deleteButtons[0]);

    expect(mockDelete).toHaveBeenCalledWith(1);
  });

  it('calls onTaskEdit when edit button clicked', () => {
    const mockEdit = vi.fn();
    render(<TaskList tasks={mockTasks} onTaskEdit={mockEdit} />);

    const editButtons = screen.getAllByRole('button', { name: /editar/i });
    fireEvent.click(editButtons[0]);

    expect(mockEdit).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('applies custom className', () => {
    const { container } = render(
      <TaskList tasks={mockTasks} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows task description when provided', () => {
    render(<TaskList tasks={mockTasks} />);

    expect(screen.getByText('Descripción de tarea 1')).toBeInTheDocument();
  });

  it('marks completed tasks with correct styling', () => {
    render(<TaskList tasks={mockTasks} />);

    const completedCheckbox = screen.getAllByRole('checkbox')[1];
    expect(completedCheckbox).toBeChecked();
  });

  it('shows created_at date for all tasks', () => {
    render(<TaskList tasks={mockTasks} />);

    expect(screen.getByText(/Creada el 01\/01\/2024/)).toBeInTheDocument();
    expect(screen.getByText(/Creada el 02\/01\/2024/)).toBeInTheDocument();
  });

  it('shows completed_at date only for completed tasks', () => {
    render(<TaskList tasks={mockTasks} />);

    expect(screen.getByText(/Completada el 03\/01\/2024/)).toBeInTheDocument();
    expect(screen.queryAllByText(/Completada el/)).toHaveLength(1);
  });

  it('shows project badge when task has project_id', () => {
    render(<TaskList tasks={mockTasks} projects={mockProjects} />);

    expect(screen.getByText('Trabajo')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  it('does not show project badge when task has no project_id', () => {
    const tasksWithoutProject = [mockTasks[2]];
    render(<TaskList tasks={tasksWithoutProject} projects={mockProjects} />);

    expect(screen.queryByText('Trabajo')).not.toBeInTheDocument();
    expect(screen.queryByText('Personal')).not.toBeInTheDocument();
  });

  it('does not show edit button when onTaskEdit is not provided', () => {
    render(<TaskList tasks={mockTasks} />);

    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
  });
});
