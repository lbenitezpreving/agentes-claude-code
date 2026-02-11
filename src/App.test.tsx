import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const mockTasks = [
  {
    id: 1,
    name: 'Tarea 1',
    description: 'Descripción 1',
    completed: false,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Tarea 2',
    completed: true,
    created_at: '2024-01-02T00:00:00Z',
  },
];

const mockProjects = [
  { id: 1, name: 'Proyecto 1' },
  { id: 2, name: 'Proyecto 2' },
];

// Helper para mockear fetch con tasks y projects
const mockFetchResponses = (tasks: unknown[] = [], projects: unknown[] = mockProjects) => {
  vi.spyOn(global, 'fetch').mockImplementation((url) => {
    if (typeof url === 'string' && url.includes('/projects')) {
      return Promise.resolve({
        ok: true,
        json: async () => projects,
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: async () => tasks,
    } as Response);
  });
};

describe('App', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Renderizado inicial', () => {
    it('muestra el título y subtítulo', async () => {
      mockFetchResponses([]);

      render(<App />);

      expect(screen.getByText('Lista de Tareas')).toBeInTheDocument();
      expect(screen.getByText('Demo de Claude Code - React + FastAPI')).toBeInTheDocument();
    });

    it('muestra el formulario de nueva tarea', async () => {
      mockFetchResponses([]);

      render(<App />);

      expect(screen.getByPlaceholderText('Nueva tarea...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Descripcion (opcional)')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Agregar' })).toBeInTheDocument();
    });
  });

  describe('Fetch de tareas', () => {
    it('carga tareas al montar el componente', async () => {
      mockFetchResponses(mockTasks);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Tarea 1')).toBeInTheDocument();
        expect(screen.getByText('Tarea 2')).toBeInTheDocument();
      });

      expect(fetch).toHaveBeenCalledWith('/api/tasks');
    });

    it('muestra error cuando falla la conexión', async () => {
      vi.spyOn(global, 'fetch').mockImplementation((url) => {
        if (typeof url === 'string' && url.includes('/projects')) {
          return Promise.resolve({ ok: true, json: async () => [] } as Response);
        }
        return Promise.reject(new Error('Network error'));
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/No se pudo conectar con el servidor/)).toBeInTheDocument();
      });
    });

    it('muestra error cuando la respuesta no es ok', async () => {
      vi.spyOn(global, 'fetch').mockImplementation((url) => {
        if (typeof url === 'string' && url.includes('/projects')) {
          return Promise.resolve({ ok: true, json: async () => [] } as Response);
        }
        return Promise.resolve({ ok: false, status: 500 } as Response);
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/No se pudo conectar con el servidor/)).toBeInTheDocument();
      });
    });
  });

  describe('Crear tarea', () => {
    it('crea una nueva tarea correctamente', async () => {
      const user = userEvent.setup();
      const newTask = { id: 3, name: 'Nueva tarea', description: 'Desc', completed: false };
      let postCalled = false;

      vi.spyOn(global, 'fetch').mockImplementation((url, options) => {
        if (typeof url === 'string' && url.includes('/projects')) {
          return Promise.resolve({ ok: true, json: async () => mockProjects } as Response);
        }
        if (options?.method === 'POST') {
          postCalled = true;
          return Promise.resolve({ ok: true, json: async () => newTask } as Response);
        }
        return Promise.resolve({ ok: true, json: async () => [] } as Response);
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.queryByText('Cargando tareas...')).not.toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText('Nueva tarea...');
      const descInput = screen.getByPlaceholderText('Descripcion (opcional)');
      const submitBtn = screen.getByRole('button', { name: 'Agregar' });

      await user.type(nameInput, 'Nueva tarea');
      await user.type(descInput, 'Desc');
      await user.click(submitBtn);

      await waitFor(() => {
        expect(postCalled).toBe(true);
      });
    });

    it('no envía si el nombre está vacío', async () => {
      const user = userEvent.setup();
      let postCalled = false;

      vi.spyOn(global, 'fetch').mockImplementation((url, options) => {
        if (typeof url === 'string' && url.includes('/projects')) {
          return Promise.resolve({ ok: true, json: async () => [] } as Response);
        }
        if (options?.method === 'POST') {
          postCalled = true;
        }
        return Promise.resolve({ ok: true, json: async () => [] } as Response);
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.queryByText('Cargando tareas...')).not.toBeInTheDocument();
      });

      const submitBtn = screen.getByRole('button', { name: 'Agregar' });
      await user.click(submitBtn);

      expect(postCalled).toBe(false);
    });

    it('limpia los campos después de crear', async () => {
      const user = userEvent.setup();
      const newTask = { id: 3, name: 'Test', completed: false };

      vi.spyOn(global, 'fetch').mockImplementation((url, options) => {
        if (typeof url === 'string' && url.includes('/projects')) {
          return Promise.resolve({ ok: true, json: async () => [] } as Response);
        }
        if (options?.method === 'POST') {
          return Promise.resolve({ ok: true, json: async () => newTask } as Response);
        }
        return Promise.resolve({ ok: true, json: async () => [] } as Response);
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.queryByText('Cargando tareas...')).not.toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText('Nueva tarea...') as HTMLInputElement;
      await user.type(nameInput, 'Test');
      await user.click(screen.getByRole('button', { name: 'Agregar' }));

      await waitFor(() => {
        expect(nameInput.value).toBe('');
      });
    });

    it('muestra error si falla la creación', async () => {
      const user = userEvent.setup();

      vi.spyOn(global, 'fetch').mockImplementation((url, options) => {
        if (typeof url === 'string' && url.includes('/projects')) {
          return Promise.resolve({ ok: true, json: async () => [] } as Response);
        }
        if (options?.method === 'POST') {
          return Promise.resolve({ ok: false, status: 400 } as Response);
        }
        return Promise.resolve({ ok: true, json: async () => [] } as Response);
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.queryByText('Cargando tareas...')).not.toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('Nueva tarea...'), 'Test');
      await user.click(screen.getByRole('button', { name: 'Agregar' }));

      await waitFor(() => {
        expect(screen.getByText('Error al crear la tarea')).toBeInTheDocument();
      });
    });
  });

  describe('Toggle tarea', () => {
    it('actualiza el estado de una tarea', async () => {
      const user = userEvent.setup();
      const updatedTask = { ...mockTasks[0], completed: true };
      let toggleCalled = false;

      vi.spyOn(global, 'fetch').mockImplementation((url, options) => {
        if (typeof url === 'string' && url.includes('/projects')) {
          return Promise.resolve({ ok: true, json: async () => [] } as Response);
        }
        if (options?.method === 'PATCH') {
          toggleCalled = true;
          return Promise.resolve({ ok: true, json: async () => updatedTask } as Response);
        }
        return Promise.resolve({ ok: true, json: async () => mockTasks } as Response);
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Tarea 1')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      await waitFor(() => {
        expect(toggleCalled).toBe(true);
      });
    });

    it('muestra error si falla el toggle', async () => {
      const user = userEvent.setup();

      vi.spyOn(global, 'fetch').mockImplementation((url, options) => {
        if (typeof url === 'string' && url.includes('/projects')) {
          return Promise.resolve({ ok: true, json: async () => [] } as Response);
        }
        if (options?.method === 'PATCH') {
          return Promise.resolve({ ok: false, status: 500 } as Response);
        }
        return Promise.resolve({ ok: true, json: async () => mockTasks } as Response);
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Tarea 1')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      await waitFor(() => {
        expect(screen.getByText('Error al actualizar la tarea')).toBeInTheDocument();
      });
    });
  });

  describe('Eliminar tarea', () => {
    it('elimina una tarea correctamente', async () => {
      const user = userEvent.setup();
      let deleteCalled = false;

      vi.spyOn(global, 'fetch').mockImplementation((url, options) => {
        if (typeof url === 'string' && url.includes('/projects')) {
          return Promise.resolve({ ok: true, json: async () => [] } as Response);
        }
        if (options?.method === 'DELETE') {
          deleteCalled = true;
          return Promise.resolve({ ok: true } as Response);
        }
        return Promise.resolve({ ok: true, json: async () => mockTasks } as Response);
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Tarea 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(deleteCalled).toBe(true);
      });

      await waitFor(() => {
        expect(screen.queryByText('Tarea 1')).not.toBeInTheDocument();
      });
    });

    it('muestra error si falla la eliminación', async () => {
      const user = userEvent.setup();

      vi.spyOn(global, 'fetch').mockImplementation((url, options) => {
        if (typeof url === 'string' && url.includes('/projects')) {
          return Promise.resolve({ ok: true, json: async () => [] } as Response);
        }
        if (options?.method === 'DELETE') {
          return Promise.resolve({ ok: false, status: 500 } as Response);
        }
        return Promise.resolve({ ok: true, json: async () => mockTasks } as Response);
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Tarea 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Error al eliminar la tarea')).toBeInTheDocument();
      });
    });
  });
});
