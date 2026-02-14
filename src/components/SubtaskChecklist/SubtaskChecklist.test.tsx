import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SubtaskChecklist, { Subtask } from './SubtaskChecklist';

describe('SubtaskChecklist', () => {
  const mockSubtasks: Subtask[] = [
    {
      id: 1,
      task_id: 1,
      name: 'Subtarea 1',
      completed: false,
      position: 0,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      task_id: 1,
      name: 'Subtarea 2',
      completed: true,
      position: 1,
      created_at: '2024-01-02T00:00:00Z',
      completed_at: '2024-01-03T00:00:00Z',
    },
    {
      id: 3,
      task_id: 1,
      name: 'Subtarea 3',
      completed: false,
      position: 2,
      created_at: '2024-01-03T00:00:00Z',
    },
  ];

  describe('Progreso', () => {
    it('debe mostrar el progreso correcto (1/3 completadas)', () => {
      render(
        <SubtaskChecklist
          taskId={1}
          subtasks={mockSubtasks}
        />
      );
      expect(screen.getByText('1/3 completadas')).toBeInTheDocument();
    });

    it('debe mostrar 0/0 cuando no hay subtareas', () => {
      render(
        <SubtaskChecklist
          taskId={1}
          subtasks={[]}
        />
      );
      expect(screen.getByText('0/0 completadas')).toBeInTheDocument();
    });

    it('debe mostrar barra de progreso cuando hay subtareas', () => {
      const { container } = render(
        <SubtaskChecklist
          taskId={1}
          subtasks={mockSubtasks}
        />
      );
      const progressBarContainer = container.querySelector('[class*="progressBarContainer"]');
      expect(progressBarContainer).toBeInTheDocument();

      const progressBar = container.querySelector('[class*="progressBar"][style]');
      expect(progressBar).toBeInTheDocument();
    });

    it('debe mostrar barra de progreso al 100% cuando todas están completadas', () => {
      const allCompleted = mockSubtasks.map((st) => ({ ...st, completed: true }));
      const { container } = render(
        <SubtaskChecklist
          taskId={1}
          subtasks={allCompleted}
        />
      );
      const progressBar = container.querySelector('[class*="progressBar"][style]');
      expect(progressBar).toBeInTheDocument();
      expect(screen.getByText('3/3 completadas')).toBeInTheDocument();
    });
  });

  describe('Renderizado', () => {
    it('debe renderizar todas las subtareas', () => {
      render(
        <SubtaskChecklist
          taskId={1}
          subtasks={mockSubtasks}
        />
      );
      expect(screen.getByText('Subtarea 1')).toBeInTheDocument();
      expect(screen.getByText('Subtarea 2')).toBeInTheDocument();
      expect(screen.getByText('Subtarea 3')).toBeInTheDocument();
    });

    it('debe mostrar strikethrough en subtareas completadas', () => {
      const { container } = render(
        <SubtaskChecklist
          taskId={1}
          subtasks={mockSubtasks}
        />
      );
      const completedSubtask = screen.getByText('Subtarea 2');
      // Verificar que tiene clase que contiene "completed" (con hash de CSS Module)
      expect(completedSubtask.className).toMatch(/completed/);
    });

    it('debe mostrar checkboxes marcados correctamente', () => {
      render(
        <SubtaskChecklist
          taskId={1}
          subtasks={mockSubtasks}
        />
      );
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).not.toBeChecked();
      expect(checkboxes[1]).toBeChecked();
      expect(checkboxes[2]).not.toBeChecked();
    });
  });

  describe('Callbacks', () => {
    it('debe llamar onSubtaskToggle al hacer clic en checkbox', () => {
      const onToggle = vi.fn();
      render(
        <SubtaskChecklist
          taskId={1}
          subtasks={mockSubtasks}
          onSubtaskToggle={onToggle}
        />
      );
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);
      expect(onToggle).toHaveBeenCalledWith(1);
    });

    it('debe llamar onSubtaskDelete al hacer clic en botón eliminar', () => {
      const onDelete = vi.fn();
      render(
        <SubtaskChecklist
          taskId={1}
          subtasks={mockSubtasks}
          onSubtaskDelete={onDelete}
        />
      );
      const deleteButtons = screen.getAllByLabelText(/Eliminar/);
      fireEvent.click(deleteButtons[0]);
      expect(onDelete).toHaveBeenCalledWith(1);
    });

    it('debe llamar onSubtaskAdd al confirmar nueva subtarea', () => {
      const onAdd = vi.fn();
      render(
        <SubtaskChecklist
          taskId={1}
          subtasks={mockSubtasks}
          onSubtaskAdd={onAdd}
        />
      );
      const addButton = screen.getByText('+ Añadir subtarea');
      fireEvent.click(addButton);

      const input = screen.getByPlaceholderText('Nombre de la subtarea...');
      fireEvent.change(input, { target: { value: 'Nueva subtarea' } });

      const confirmButton = screen.getByText('✓');
      fireEvent.click(confirmButton);

      expect(onAdd).toHaveBeenCalledWith('Nueva subtarea');
    });

    it('no debe llamar onSubtaskAdd si el nombre está vacío', () => {
      const onAdd = vi.fn();
      render(
        <SubtaskChecklist
          taskId={1}
          subtasks={mockSubtasks}
          onSubtaskAdd={onAdd}
        />
      );
      const addButton = screen.getByText('+ Añadir subtarea');
      fireEvent.click(addButton);

      const confirmButton = screen.getByText('✓');
      fireEvent.click(confirmButton);

      expect(onAdd).not.toHaveBeenCalled();
    });
  });

  describe('Teclado', () => {
    it('debe confirmar con Enter', () => {
      const onAdd = vi.fn();
      render(
        <SubtaskChecklist
          taskId={1}
          subtasks={mockSubtasks}
          onSubtaskAdd={onAdd}
        />
      );
      const addButton = screen.getByText('+ Añadir subtarea');
      fireEvent.click(addButton);

      const input = screen.getByPlaceholderText('Nombre de la subtarea...');
      fireEvent.change(input, { target: { value: 'Nueva subtarea' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(onAdd).toHaveBeenCalledWith('Nueva subtarea');
    });

    it('debe cancelar con Escape', () => {
      const onAdd = vi.fn();
      render(
        <SubtaskChecklist
          taskId={1}
          subtasks={mockSubtasks}
          onSubtaskAdd={onAdd}
        />
      );
      const addButton = screen.getByText('+ Añadir subtarea');
      fireEvent.click(addButton);

      const input = screen.getByPlaceholderText('Nombre de la subtarea...');
      fireEvent.change(input, { target: { value: 'Nueva subtarea' } });
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

      expect(onAdd).not.toHaveBeenCalled();
      expect(screen.queryByPlaceholderText('Nombre de la subtarea...')).not.toBeInTheDocument();
    });

    it('debe limpiar el input después de Enter', () => {
      const onAdd = vi.fn();
      render(
        <SubtaskChecklist
          taskId={1}
          subtasks={mockSubtasks}
          onSubtaskAdd={onAdd}
        />
      );
      const addButton = screen.getByText('+ Añadir subtarea');
      fireEvent.click(addButton);

      const input = screen.getByPlaceholderText('Nombre de la subtarea...');
      fireEvent.change(input, { target: { value: 'Nueva subtarea' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(screen.queryByPlaceholderText('Nombre de la subtarea...')).not.toBeInTheDocument();
    });
  });

  describe('Modo readonly', () => {
    it('debe deshabilitar checkboxes en modo readonly', () => {
      render(
        <SubtaskChecklist
          taskId={1}
          subtasks={mockSubtasks}
          readonly={true}
        />
      );
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeDisabled();
      });
    });

    it('no debe mostrar botones de eliminar en modo readonly', () => {
      render(
        <SubtaskChecklist
          taskId={1}
          subtasks={mockSubtasks}
          onSubtaskDelete={vi.fn()}
          readonly={true}
        />
      );
      expect(screen.queryByLabelText(/Eliminar/)).not.toBeInTheDocument();
    });

    it('no debe mostrar botón añadir en modo readonly', () => {
      render(
        <SubtaskChecklist
          taskId={1}
          subtasks={mockSubtasks}
          onSubtaskAdd={vi.fn()}
          readonly={true}
        />
      );
      expect(screen.queryByText('+ Añadir subtarea')).not.toBeInTheDocument();
    });
  });

  describe('UI de añadir subtarea', () => {
    it('debe mostrar input al hacer clic en añadir', () => {
      render(
        <SubtaskChecklist
          taskId={1}
          subtasks={mockSubtasks}
          onSubtaskAdd={vi.fn()}
        />
      );
      const addButton = screen.getByText('+ Añadir subtarea');
      fireEvent.click(addButton);

      expect(screen.getByPlaceholderText('Nombre de la subtarea...')).toBeInTheDocument();
    });

    it('debe ocultar input al cancelar', () => {
      render(
        <SubtaskChecklist
          taskId={1}
          subtasks={mockSubtasks}
          onSubtaskAdd={vi.fn()}
        />
      );
      const addButton = screen.getByText('+ Añadir subtarea');
      fireEvent.click(addButton);

      const cancelButton = screen.getByText('✕');
      fireEvent.click(cancelButton);

      expect(screen.queryByPlaceholderText('Nombre de la subtarea...')).not.toBeInTheDocument();
      expect(screen.getByText('+ Añadir subtarea')).toBeInTheDocument();
    });

    it('debe deshabilitar botón confirmar cuando el input está vacío', () => {
      render(
        <SubtaskChecklist
          taskId={1}
          subtasks={mockSubtasks}
          onSubtaskAdd={vi.fn()}
        />
      );
      const addButton = screen.getByText('+ Añadir subtarea');
      fireEvent.click(addButton);

      const confirmButton = screen.getByText('✓');
      expect(confirmButton).toBeDisabled();
    });

    it('debe habilitar botón confirmar cuando hay texto', () => {
      render(
        <SubtaskChecklist
          taskId={1}
          subtasks={mockSubtasks}
          onSubtaskAdd={vi.fn()}
        />
      );
      const addButton = screen.getByText('+ Añadir subtarea');
      fireEvent.click(addButton);

      const input = screen.getByPlaceholderText('Nombre de la subtarea...');
      fireEvent.change(input, { target: { value: 'Nueva' } });

      const confirmButton = screen.getByText('✓');
      expect(confirmButton).not.toBeDisabled();
    });
  });
});
