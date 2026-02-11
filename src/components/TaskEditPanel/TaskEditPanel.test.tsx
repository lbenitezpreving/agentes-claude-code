import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskEditPanel from './TaskEditPanel';

const mockProjects = [
  { id: 1, name: 'Trabajo', color: '#3498db' },
  { id: 2, name: 'Personal', color: '#2ecc71' },
];

const mockTask = {
  id: 1,
  name: 'Tarea de prueba',
  description: 'Descripción de prueba',
  completed: false,
  project_id: 1,
  created_at: '2024-01-01T00:00:00Z',
};

describe('TaskEditPanel', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <TaskEditPanel
        task={mockTask}
        projects={mockProjects}
        isOpen={false}
        onClose={() => {}}
        onSave={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when no task', () => {
    const { container } = render(
      <TaskEditPanel
        task={null}
        projects={mockProjects}
        isOpen={true}
        onClose={() => {}}
        onSave={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders form when open with task', () => {
    render(
      <TaskEditPanel
        task={mockTask}
        projects={mockProjects}
        isOpen={true}
        onClose={() => {}}
        onSave={() => {}}
      />
    );

    expect(screen.getByText('Editar Tarea')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tarea de prueba')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Descripción de prueba')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(
      <TaskEditPanel
        task={mockTask}
        projects={mockProjects}
        isOpen={true}
        onClose={onClose}
        onSave={() => {}}
      />
    );

    fireEvent.click(screen.getByLabelText('Cerrar panel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel button clicked', () => {
    const onClose = vi.fn();
    render(
      <TaskEditPanel
        task={mockTask}
        projects={mockProjects}
        isOpen={true}
        onClose={onClose}
        onSave={() => {}}
      />
    );

    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSave with updated data when form submitted', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <TaskEditPanel
        task={mockTask}
        projects={mockProjects}
        isOpen={true}
        onClose={onClose}
        onSave={onSave}
      />
    );

    const nameInput = screen.getByDisplayValue('Tarea de prueba');
    fireEvent.change(nameInput, { target: { value: 'Tarea actualizada' } });

    fireEvent.click(screen.getByText('Guardar'));

    expect(onSave).toHaveBeenCalledWith(1, {
      name: 'Tarea actualizada',
      description: 'Descripción de prueba',
      project_id: 1,
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows all projects in select', () => {
    render(
      <TaskEditPanel
        task={mockTask}
        projects={mockProjects}
        isOpen={true}
        onClose={() => {}}
        onSave={() => {}}
      />
    );

    expect(screen.getByText('Trabajo')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Sin proyecto')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <TaskEditPanel
        task={mockTask}
        projects={mockProjects}
        isOpen={true}
        onClose={() => {}}
        onSave={() => {}}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
