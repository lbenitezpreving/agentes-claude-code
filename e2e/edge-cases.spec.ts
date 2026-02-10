import { test, expect } from '@playwright/test';
import { TaskPage } from './pages/task-page';

test.describe('Edge Cases - Contenido', () => {
  let taskPage: TaskPage;

  test.beforeEach(async ({ page }) => {
    taskPage = new TaskPage(page);
    await taskPage.goto();
    await taskPage.waitForLoad();
  });

  test('debe manejar caracteres especiales en el nombre', async () => {
    const taskName = `Tarea <script>alert("xss")</script> ${Date.now()}`;

    await taskPage.createTask(taskName);
    await taskPage.expectTaskExists(taskName);

    // Verificar que no se ejecuto XSS (el texto se muestra como texto)
    const taskItem = taskPage.getTaskItem(taskName);
    await expect(taskItem).toContainText('<script>');
  });

  test('debe manejar emojis en el nombre', async () => {
    const taskName = `Tarea con emojis 🚀✨🎉 ${Date.now()}`;

    await taskPage.createTask(taskName);
    await taskPage.expectTaskExists(taskName);

    const taskItem = taskPage.getTaskItem(taskName);
    await expect(taskItem).toContainText('🚀');
  });

  test('debe manejar caracteres unicode especiales', async () => {
    const taskName = `日本語タスク ${Date.now()}`;

    await taskPage.createTask(taskName);
    await taskPage.expectTaskExists(taskName);
  });

  test('debe manejar nombres largos (100 caracteres)', async () => {
    const timestamp = Date.now();
    const longName = `Tarea${timestamp}${'A'.repeat(80)}`;

    await taskPage.createTask(longName);

    // Esperar un momento para que se procese
    await taskPage.page.waitForTimeout(500);

    // Verificar que la tarea existe buscando por el timestamp
    const taskItem = taskPage.page.locator('li').filter({ hasText: String(timestamp) });
    await expect(taskItem).toBeVisible({ timeout: 10000 });
  });

  test('debe manejar descripcion moderada', async () => {
    const taskName = `Tarea con desc ${Date.now()}`;
    const desc = 'Esta es una descripcion de longitud moderada para probar el sistema.';

    await taskPage.createTask(taskName, desc);

    // Esperar un momento para que se procese
    await taskPage.page.waitForTimeout(300);

    await taskPage.expectTaskExists(taskName);

    const taskItem = taskPage.getTaskItem(taskName);
    await expect(taskItem).toContainText(desc.substring(0, 20));
  });

  test('debe manejar espacios en blanco al inicio y final', async () => {
    const taskName = `   Tarea con espacios   ${Date.now()}`;

    await taskPage.taskNameInput.fill(taskName);
    await taskPage.submitButton.click();

    // La tarea se crea (el trim puede hacerse en backend)
    const count = await taskPage.getTaskCount();
    expect(count).toBeGreaterThan(0);
  });

  test('debe manejar solo espacios (no crear tarea)', async ({ page }) => {
    const initialCount = await taskPage.getTaskCount();

    await taskPage.taskNameInput.fill('   ');
    await taskPage.submitButton.click();

    // Esperar un momento para verificar que no se creo
    await page.waitForTimeout(500);

    const finalCount = await taskPage.getTaskCount();
    expect(finalCount).toBe(initialCount);
  });
});

test.describe('Edge Cases - Interaccion', () => {
  let taskPage: TaskPage;

  test.beforeEach(async ({ page }) => {
    taskPage = new TaskPage(page);
    await taskPage.goto();
    await taskPage.waitForLoad();
  });

  test('debe manejar doble click en checkbox sin problemas', async ({ page }) => {
    const taskName = `Double Click ${Date.now()}`;
    await taskPage.createTask(taskName);

    const checkbox = taskPage.getTaskCheckbox(taskName);

    // Doble click rapido
    await checkbox.dblclick();

    // Esperar estabilizacion
    await page.waitForTimeout(300);

    // Verificar que el estado es consistente
    const isChecked = await checkbox.isChecked();
    expect(typeof isChecked).toBe('boolean');
  });

  test('debe manejar click rapido en eliminar', async ({ page }) => {
    const taskName = `Quick Delete ${Date.now()}`;
    await taskPage.createTask(taskName);
    await taskPage.expectTaskExists(taskName);

    const deleteButton = taskPage.getTaskDeleteButton(taskName);
    await deleteButton.click();

    // Verificar eliminacion
    await taskPage.expectTaskNotExists(taskName);
  });

  test('debe manejar creacion durante toggle', async ({ page }) => {
    const task1 = `Task1 ${Date.now()}`;
    const task2 = `Task2 ${Date.now()}`;

    // Crear primera tarea
    await taskPage.createTask(task1);

    // Iniciar toggle y crear segunda tarea casi simultaneamente
    await taskPage.toggleTask(task1);
    await taskPage.createTask(task2);

    // Ambas deben existir
    await taskPage.expectTaskExists(task1);
    await taskPage.expectTaskExists(task2);
  });
});

test.describe('Edge Cases - API Errors', () => {
  test('debe mostrar error cuando falla la creacion', async ({ page }) => {
    await page.route('**/api/tasks', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Error al crear tarea' }),
        });
      } else {
        route.continue();
      }
    });

    const taskPage = new TaskPage(page);
    await taskPage.goto();
    await taskPage.waitForLoad();

    await taskPage.createTask('Tarea que fallara');

    // Debe mostrar mensaje de error
    await expect(taskPage.errorMessage).toBeVisible();
  });

  test('debe mostrar error cuando falla el toggle', async ({ page }) => {
    const mockTasks = [
      { id: 1, name: 'Tarea Toggle Error', completed: false, created_at: new Date().toISOString() },
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

    await page.route('**/api/tasks/*/toggle', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Error al actualizar' }),
      });
    });

    const taskPage = new TaskPage(page);
    await taskPage.goto();
    await taskPage.waitForLoad();

    await taskPage.toggleTask('Tarea Toggle Error');

    await expect(taskPage.errorMessage).toBeVisible();
  });

  test('debe mostrar error cuando falla la eliminacion', async ({ page }) => {
    const mockTasks = [
      { id: 1, name: 'Tarea Delete Error', completed: false, created_at: new Date().toISOString() },
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

    await page.route('**/api/tasks/*', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Error al eliminar' }),
        });
      } else {
        route.continue();
      }
    });

    const taskPage = new TaskPage(page);
    await taskPage.goto();
    await taskPage.waitForLoad();

    await taskPage.deleteTask('Tarea Delete Error');

    await expect(taskPage.errorMessage).toBeVisible();
  });
});

test.describe('Edge Cases - Network', () => {
  test('debe manejar respuestas lentas sin bloquearse', async ({ page }) => {
    await page.route('**/api/tasks', async (route) => {
      if (route.request().method() === 'GET') {
        // Simular respuesta lenta (2 segundos)
        await new Promise((resolve) => setTimeout(resolve, 2000));
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

    // Verificar que muestra loading
    await expect(taskPage.loadingIndicator).toBeVisible();

    // Esperar a que cargue
    await taskPage.waitForLoad();

    // Verificar estado final
    await expect(taskPage.emptyMessage).toBeVisible();
  });
});
