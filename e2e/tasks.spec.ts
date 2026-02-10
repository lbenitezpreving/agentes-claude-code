import { test, expect } from '@playwright/test';
import { TaskPage } from './pages/task-page';

test.describe('CRUD de Tareas', () => {
  let taskPage: TaskPage;

  test.beforeEach(async ({ page }) => {
    taskPage = new TaskPage(page);
    await taskPage.goto();
    await taskPage.waitForLoad();
  });

  test('debe mostrar el header de la aplicacion', async () => {
    await expect(taskPage.header).toHaveText('Lista de Tareas');
  });

  test('debe crear una tarea nueva', async () => {
    const taskName = `Test Task ${Date.now()}`;

    await taskPage.createTask(taskName);

    await taskPage.expectTaskExists(taskName);
    await taskPage.expectTaskCompleted(taskName, false);
  });

  test('debe crear una tarea con descripcion', async () => {
    const taskName = `Task con desc ${Date.now()}`;
    const taskDesc = 'Esta es una descripcion de prueba';

    await taskPage.createTask(taskName, taskDesc);

    await taskPage.expectTaskExists(taskName);
    const taskItem = taskPage.getTaskItem(taskName);
    await expect(taskItem).toContainText(taskDesc);
  });

  test('debe marcar una tarea como completada', async () => {
    const taskName = `Task toggle ${Date.now()}`;

    await taskPage.createTask(taskName);
    await taskPage.expectTaskCompleted(taskName, false);

    await taskPage.toggleTask(taskName);

    await taskPage.expectTaskCompleted(taskName, true);
  });

  test('debe desmarcar una tarea completada', async () => {
    const taskName = `Task untoggle ${Date.now()}`;

    await taskPage.createTask(taskName);
    await taskPage.toggleTask(taskName);
    await taskPage.expectTaskCompleted(taskName, true);

    await taskPage.toggleTask(taskName);

    await taskPage.expectTaskCompleted(taskName, false);
  });

  test('debe eliminar una tarea', async () => {
    const taskName = `Task delete ${Date.now()}`;

    await taskPage.createTask(taskName);
    await taskPage.expectTaskExists(taskName);

    await taskPage.deleteTask(taskName);

    await taskPage.expectTaskNotExists(taskName);
  });

  test('no debe crear tarea con nombre vacio', async ({ page }) => {
    const initialCount = await taskPage.getTaskCount();

    await taskPage.submitButton.click();

    const finalCount = await taskPage.getTaskCount();
    expect(finalCount).toBe(initialCount);
  });

  test('debe limpiar el formulario despues de crear tarea', async () => {
    const taskName = `Task clear ${Date.now()}`;

    await taskPage.createTask(taskName, 'Descripcion');

    await expect(taskPage.taskNameInput).toHaveValue('');
    await expect(taskPage.taskDescInput).toHaveValue('');
  });

  test('debe mostrar fecha de creacion al crear tarea', async () => {
    const taskName = `Task fecha ${Date.now()}`;

    await taskPage.createTask(taskName);

    await taskPage.expectTaskHasCreatedDate(taskName);
  });

  test('debe mostrar fecha de completado al marcar tarea', async () => {
    const taskName = `Task completed date ${Date.now()}`;

    await taskPage.createTask(taskName);
    await taskPage.expectTaskHasCompletedDate(taskName, false);

    await taskPage.toggleTask(taskName);

    await taskPage.expectTaskHasCompletedDate(taskName, true);
  });

  test('debe ocultar fecha de completado al desmarcar tarea', async () => {
    const taskName = `Task uncomplete date ${Date.now()}`;

    await taskPage.createTask(taskName);
    await taskPage.toggleTask(taskName);
    await taskPage.expectTaskHasCompletedDate(taskName, true);

    await taskPage.toggleTask(taskName);

    await taskPage.expectTaskHasCompletedDate(taskName, false);
  });
});
