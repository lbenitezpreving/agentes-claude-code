import { test, expect } from '@playwright/test';
import { TaskPage } from './pages/task-page';

test.describe('Flujos de Usuario Completos', () => {
  let taskPage: TaskPage;

  test.beforeEach(async ({ page }) => {
    taskPage = new TaskPage(page);
    await taskPage.goto();
    await taskPage.waitForLoad();
  });

  test('debe gestionar multiples tareas en un flujo completo', async () => {
    const timestamp = Date.now();
    const tasks = [
      { name: `Tarea 1 - ${timestamp}`, desc: 'Primera tarea del flujo' },
      { name: `Tarea 2 - ${timestamp}`, desc: 'Segunda tarea del flujo' },
      { name: `Tarea 3 - ${timestamp}`, desc: 'Tercera tarea del flujo' },
    ];

    // Crear todas las tareas
    for (const task of tasks) {
      await taskPage.createTask(task.name, task.desc);
      await taskPage.expectTaskExists(task.name);
    }

    // Verificar que todas existen
    const count = await taskPage.getTaskCount();
    expect(count).toBeGreaterThanOrEqual(3);

    // Completar la primera y tercera
    await taskPage.toggleTask(tasks[0].name);
    await taskPage.toggleTask(tasks[2].name);
    await taskPage.expectTaskCompleted(tasks[0].name, true);
    await taskPage.expectTaskCompleted(tasks[1].name, false);
    await taskPage.expectTaskCompleted(tasks[2].name, true);

    // Eliminar la segunda (no completada)
    await taskPage.deleteTask(tasks[1].name);
    await taskPage.expectTaskNotExists(tasks[1].name);

    // Desmarcar la primera
    await taskPage.toggleTask(tasks[0].name);
    await taskPage.expectTaskCompleted(tasks[0].name, false);

    // Verificar estado final
    await taskPage.expectTaskExists(tasks[0].name);
    await taskPage.expectTaskExists(tasks[2].name);
  });

  test('debe permitir crear y eliminar la misma tarea multiples veces', async () => {
    const taskName = `Tarea Repetida ${Date.now()}`;

    for (let i = 0; i < 3; i++) {
      await taskPage.createTask(taskName);
      await taskPage.expectTaskExists(taskName);
      await taskPage.deleteTask(taskName);
      await taskPage.expectTaskNotExists(taskName);
    }
  });

  test('debe mantener el estado de las tareas tras interacciones secuenciales', async () => {
    const baseName = `Secuencial ${Date.now()}`;
    const taskNames = [`${baseName}-1`, `${baseName}-2`];

    // Crear tareas secuencialmente esperando que cada una exista
    for (const name of taskNames) {
      await taskPage.createTask(name);
      await taskPage.expectTaskExists(name);
    }

    // Toggle secuencial
    for (const name of taskNames) {
      await taskPage.toggleTask(name);
      await taskPage.expectTaskCompleted(name, true);
    }

    // Verificar estado final
    for (const name of taskNames) {
      await taskPage.expectTaskCompleted(name, true);
    }
  });

  test('debe poder trabajar con tareas sin descripcion', async () => {
    const taskName = `Sin descripcion ${Date.now()}`;

    await taskPage.createTask(taskName);
    await taskPage.expectTaskExists(taskName);

    const taskItem = taskPage.getTaskItem(taskName);
    // Verificar que no hay elemento de descripcion vacio
    const descCount = await taskItem.locator('p').count();
    expect(descCount).toBe(0);
  });
});

test.describe('Persistencia de Estado', () => {
  test('las tareas deben persistir al recargar la pagina', async ({ page }) => {
    const taskPage = new TaskPage(page);
    await taskPage.goto();
    await taskPage.waitForLoad();

    const taskName = `Persistente ${Date.now()}`;
    await taskPage.createTask(taskName, 'Debe persistir');
    await taskPage.toggleTask(taskName);
    await taskPage.expectTaskCompleted(taskName, true);

    // Recargar pagina
    await page.reload();
    await taskPage.waitForLoad();

    // Verificar que la tarea persiste con su estado
    await taskPage.expectTaskExists(taskName);
    await taskPage.expectTaskCompleted(taskName, true);
  });
});
