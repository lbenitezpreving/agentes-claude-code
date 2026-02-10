import { test, expect } from '@playwright/test';
import { TaskPage } from './pages/task-page';

test.describe('Estados de la UI', () => {
  test('debe mostrar mensaje de lista vacia cuando no hay tareas', async ({ page }) => {
    // Interceptar la API para retornar lista vacia
    await page.route('**/api/tasks', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else {
        route.continue();
      }
    });

    const taskPage = new TaskPage(page);
    await taskPage.goto();
    await taskPage.waitForLoad();

    await expect(taskPage.emptyMessage).toBeVisible();
  });

  test('debe mostrar estado de carga inicialmente', async ({ page }) => {
    // Interceptar la API con delay para ver el loading
    await page.route('**/api/tasks', async (route) => {
      if (route.request().method() === 'GET') {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else {
        route.continue();
      }
    });

    const taskPage = new TaskPage(page);
    await taskPage.goto();

    // Verificar que se muestra el loading
    await expect(taskPage.loadingIndicator).toBeVisible();
  });

  test('debe mostrar error cuando la API falla', async ({ page }) => {
    // Interceptar la API para simular error
    await page.route('**/api/tasks', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Internal Server Error' }),
        });
      } else {
        route.continue();
      }
    });

    const taskPage = new TaskPage(page);
    await taskPage.goto();

    // Esperar a que desaparezca el loading y aparezca el error
    await expect(taskPage.loadingIndicator).not.toBeVisible({ timeout: 5000 });
    await expect(taskPage.errorMessage).toBeVisible();
  });

  test('debe mostrar tareas existentes al cargar', async ({ page }) => {
    const mockTasks = [
      { id: 1, name: 'Tarea 1', description: 'Desc 1', completed: false, created_at: new Date().toISOString() },
      { id: 2, name: 'Tarea 2', description: null, completed: true, created_at: new Date().toISOString() },
    ];

    await page.route('**/api/tasks', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTasks),
        });
      } else {
        route.continue();
      }
    });

    const taskPage = new TaskPage(page);
    await taskPage.goto();
    await taskPage.waitForLoad();

    await taskPage.expectTaskExists('Tarea 1');
    await taskPage.expectTaskExists('Tarea 2');
    await taskPage.expectTaskCompleted('Tarea 1', false);
    await taskPage.expectTaskCompleted('Tarea 2', true);
  });

  test('debe mostrar descripcion de tarea cuando existe', async ({ page }) => {
    const mockTasks = [
      { id: 1, name: 'Tarea con descripcion', description: 'Esta es la descripcion', completed: false, created_at: new Date().toISOString() },
    ];

    await page.route('**/api/tasks', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTasks),
        });
      } else {
        route.continue();
      }
    });

    const taskPage = new TaskPage(page);
    await taskPage.goto();
    await taskPage.waitForLoad();

    const taskItem = taskPage.getTaskItem('Tarea con descripcion');
    await expect(taskItem).toContainText('Esta es la descripcion');
  });
});
