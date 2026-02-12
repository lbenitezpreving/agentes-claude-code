import { test, expect } from '@playwright/test';
import { TaskPage } from './pages/task-page';

test.describe('Kanban Board', () => {
  let taskPage: TaskPage;

  test.beforeEach(async ({ page }) => {
    taskPage = new TaskPage(page);
    await taskPage.goto();
    await taskPage.waitForLoad();
  });

  test('should display kanban board with 3 columns', async () => {
    // Verificar que las tres columnas del tablero Kanban estén visibles
    await expect(taskPage.backlogColumn).toBeVisible();
    await expect(taskPage.doingColumn).toBeVisible();
    await expect(taskPage.doneColumn).toBeVisible();

    // Verificar títulos de las columnas
    await expect(taskPage.page.getByText('Backlog')).toBeVisible();
    await expect(taskPage.page.getByText('En Progreso')).toBeVisible();
    await expect(taskPage.page.getByText('Completado')).toBeVisible();
  });

  test('should create task and appear in backlog column', async () => {
    const taskName = 'Nueva Tarea Kanban';
    const taskDesc = 'Descripción de prueba';

    // Crear nueva tarea
    await taskPage.createTask(taskName, taskDesc);

    // Esperar a que se cree la tarea
    await taskPage.page.waitForTimeout(500);

    // Verificar que la tarea aparece en la columna Backlog
    await taskPage.expectTaskInColumn(taskName, 'backlog');

    // Verificar que solo hay una tarea en backlog
    await taskPage.expectColumnTaskCount('backlog', 1);
    await taskPage.expectColumnTaskCount('doing', 0);
    await taskPage.expectColumnTaskCount('done', 0);
  });

  test('should move task from backlog to doing', async () => {
    const taskName = 'Tarea a Mover a Doing';

    // Crear tarea
    await taskPage.createTask(taskName);
    await taskPage.page.waitForTimeout(500);

    // Verificar que está en backlog
    await taskPage.expectTaskInColumn(taskName, 'backlog');

    // Mover a la columna doing
    await taskPage.dragTaskToColumn(taskName, 'doing');
    await taskPage.page.waitForTimeout(500);

    // Verificar que la tarea está ahora en doing
    await taskPage.expectTaskInColumn(taskName, 'doing');

    // Verificar conteos de columnas
    await taskPage.expectColumnTaskCount('backlog', 0);
    await taskPage.expectColumnTaskCount('doing', 1);
    await taskPage.expectColumnTaskCount('done', 0);

    // Verificar que no está completada
    const card = taskPage.getTaskCard(taskName);
    const checkbox = card.locator('input[type="checkbox"]');
    await expect(checkbox).not.toBeChecked();
  });

  test('should move task from doing to done and mark as completed', async () => {
    const taskName = 'Tarea a Completar';

    // Crear tarea
    await taskPage.createTask(taskName);
    await taskPage.page.waitForTimeout(500);

    // Mover a doing
    await taskPage.dragTaskToColumn(taskName, 'doing');
    await taskPage.page.waitForTimeout(500);

    // Verificar que está en doing
    await taskPage.expectTaskInColumn(taskName, 'doing');

    // Mover a done
    await taskPage.dragTaskToColumn(taskName, 'done');
    await taskPage.page.waitForTimeout(500);

    // Verificar que está en done
    await taskPage.expectTaskInColumn(taskName, 'done');

    // Verificar conteos
    await taskPage.expectColumnTaskCount('backlog', 0);
    await taskPage.expectColumnTaskCount('doing', 0);
    await taskPage.expectColumnTaskCount('done', 1);

    // Verificar que está marcada como completada
    const card = taskPage.getTaskCard(taskName);
    const checkbox = card.locator('input[type="checkbox"]');
    await expect(checkbox).toBeChecked();

    // Verificar que tiene fecha de completado
    const completedDate = card.locator('text=/Completada el/');
    await expect(completedDate).toBeVisible();
  });

  test('should delete task from kanban board', async () => {
    const taskName = 'Tarea a Eliminar';

    // Crear tarea
    await taskPage.createTask(taskName);
    await taskPage.page.waitForTimeout(500);

    // Verificar que existe en backlog
    await taskPage.expectTaskInColumn(taskName, 'backlog');

    // Obtener botón de eliminar de la tarjeta
    const card = taskPage.getTaskCard(taskName);
    const deleteButton = card.locator('button[aria-label*="Eliminar"]');
    await deleteButton.click();

    // Esperar a que se elimine
    await taskPage.page.waitForTimeout(500);

    // Verificar que ya no existe en ninguna columna
    const taskCard = taskPage.page.locator('[data-testid="task-card"]').filter({ hasText: taskName });
    await expect(taskCard).not.toBeVisible();

    // Verificar que las columnas están vacías
    await taskPage.expectColumnTaskCount('backlog', 0);
    await taskPage.expectColumnTaskCount('doing', 0);
    await taskPage.expectColumnTaskCount('done', 0);
  });

  test('should edit task from kanban board', async () => {
    const originalName = 'Tarea Original';
    const newName = 'Tarea Editada';
    const newDesc = 'Nueva descripción';

    // Crear tarea
    await taskPage.createTask(originalName, 'Descripción original');
    await taskPage.page.waitForTimeout(500);

    // Verificar que existe
    await taskPage.expectTaskInColumn(originalName, 'backlog');

    // Obtener botón de editar de la tarjeta
    const card = taskPage.getTaskCard(originalName);
    const editButton = card.locator('button[aria-label*="Editar"]');
    await editButton.click();

    // Esperar a que se abra el panel de edición
    await taskPage.expectEditPanelOpen();

    // Editar nombre y descripción
    await taskPage.fillEditPanel(newName, newDesc);

    // Guardar cambios
    await taskPage.saveEditPanel();

    // Esperar a que se cierre el panel
    await taskPage.page.waitForTimeout(500);
    await taskPage.expectEditPanelClosed();

    // Verificar que la tarea tiene el nuevo nombre
    await taskPage.expectTaskInColumn(newName, 'backlog');

    // Verificar que el nombre anterior ya no existe
    const oldCard = taskPage.page.locator('[data-testid="task-card"]').filter({ hasText: originalName });
    await expect(oldCard).not.toBeVisible();

    // Verificar que la nueva descripción está presente
    const updatedCard = taskPage.getTaskCard(newName);
    await expect(updatedCard).toContainText(newDesc);
  });

  test('should move task between multiple columns', async () => {
    const taskName = 'Tarea Móvil';

    // Crear tarea
    await taskPage.createTask(taskName);
    await taskPage.page.waitForTimeout(500);

    // Debe estar en backlog
    await taskPage.expectTaskInColumn(taskName, 'backlog');

    // Mover a doing
    await taskPage.dragTaskToColumn(taskName, 'doing');
    await taskPage.page.waitForTimeout(500);
    await taskPage.expectTaskInColumn(taskName, 'doing');

    // Mover a done
    await taskPage.dragTaskToColumn(taskName, 'done');
    await taskPage.page.waitForTimeout(500);
    await taskPage.expectTaskInColumn(taskName, 'done');

    // Mover de vuelta a doing
    await taskPage.dragTaskToColumn(taskName, 'doing');
    await taskPage.page.waitForTimeout(500);
    await taskPage.expectTaskInColumn(taskName, 'doing');

    // Mover a backlog
    await taskPage.dragTaskToColumn(taskName, 'backlog');
    await taskPage.page.waitForTimeout(500);
    await taskPage.expectTaskInColumn(taskName, 'backlog');

    // Verificar que no está completada
    const card = taskPage.getTaskCard(taskName);
    const checkbox = card.locator('input[type="checkbox"]');
    await expect(checkbox).not.toBeChecked();
  });

  test('should handle multiple tasks in different columns', async () => {
    // Crear tres tareas
    await taskPage.createTask('Tarea 1');
    await taskPage.page.waitForTimeout(300);
    await taskPage.createTask('Tarea 2');
    await taskPage.page.waitForTimeout(300);
    await taskPage.createTask('Tarea 3');
    await taskPage.page.waitForTimeout(500);

    // Todas deben estar en backlog
    await taskPage.expectColumnTaskCount('backlog', 3);

    // Mover Tarea 1 a doing
    await taskPage.dragTaskToColumn('Tarea 1', 'doing');
    await taskPage.page.waitForTimeout(500);

    // Mover Tarea 2 a done
    await taskPage.dragTaskToColumn('Tarea 2', 'done');
    await taskPage.page.waitForTimeout(500);

    // Verificar distribución
    await taskPage.expectColumnTaskCount('backlog', 1);
    await taskPage.expectColumnTaskCount('doing', 1);
    await taskPage.expectColumnTaskCount('done', 1);

    // Verificar posiciones correctas
    await taskPage.expectTaskInColumn('Tarea 1', 'doing');
    await taskPage.expectTaskInColumn('Tarea 2', 'done');
    await taskPage.expectTaskInColumn('Tarea 3', 'backlog');
  });
});
