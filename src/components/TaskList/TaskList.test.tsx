import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskList, { Task } from './TaskList';

const mockTasks: Task[] = [
  {
    id: 1,
    name: 'Tarea 1',
    description: 'Descripción de tarea 1',
    completed: false,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Tarea 2',
    completed: true,
    created_at: '2024-01-02T00:00:00Z',
    completed_at: '2024-01-03T14:30:00Z',
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
});
