import { test, expect } from '@playwright/test';
import { TaskPage } from './pages/task-page';

test.describe('Responsividad', () => {
  test('debe funcionar en viewport movil (iPhone)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const taskPage = new TaskPage(page);
    await taskPage.goto();
    await taskPage.waitForLoad();

    // Verificar elementos visibles
    await expect(taskPage.header).toBeVisible();
    await expect(taskPage.taskNameInput).toBeVisible();
    await expect(taskPage.submitButton).toBeVisible();

    // Crear tarea en movil
    const taskName = `Mobile Task ${Date.now()}`;
    await taskPage.createTask(taskName);
    await taskPage.expectTaskExists(taskName);
  });

  test('debe poder interactuar con tareas en viewport movil', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const taskPage = new TaskPage(page);
    await taskPage.goto();
    await taskPage.waitForLoad();

    const taskName = `Mobile Interact ${Date.now()}`;
    await taskPage.createTask(taskName);

    // Toggle
    await taskPage.toggleTask(taskName);
    await taskPage.expectTaskCompleted(taskName, true);

    // Delete
    await taskPage.deleteTask(taskName);
    await taskPage.expectTaskNotExists(taskName);
  });

  test('debe funcionar en viewport tablet (iPad)', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 });

    const taskPage = new TaskPage(page);
    await taskPage.goto();
    await taskPage.waitForLoad();

    await expect(taskPage.header).toBeVisible();
    await expect(taskPage.taskNameInput).toBeVisible();
    await expect(taskPage.taskDescInput).toBeVisible();

    const taskName = `Tablet Task ${Date.now()}`;
    await taskPage.createTask(taskName, 'Descripcion en tablet');
    await taskPage.expectTaskExists(taskName);
  });

  test('debe funcionar en viewport desktop ancho', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    const taskPage = new TaskPage(page);
    await taskPage.goto();
    await taskPage.waitForLoad();

    await expect(taskPage.header).toBeVisible();

    const taskName = `Wide Desktop ${Date.now()}`;
    await taskPage.createTask(taskName, 'Creado en pantalla ancha');
    await taskPage.expectTaskExists(taskName);
  });

  test('debe funcionar en viewport muy estrecho (320px)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });

    const taskPage = new TaskPage(page);
    await taskPage.goto();
    await taskPage.waitForLoad();

    // Los elementos criticos deben ser visibles
    await expect(taskPage.header).toBeVisible();
    await expect(taskPage.taskNameInput).toBeVisible();
    await expect(taskPage.submitButton).toBeVisible();
  });

  test('debe funcionar en viewport muy alto', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 2000 });

    const taskPage = new TaskPage(page);
    await taskPage.goto();
    await taskPage.waitForLoad();

    await expect(taskPage.header).toBeVisible();

    const taskName = `Tall Viewport ${Date.now()}`;
    await taskPage.createTask(taskName);
    await taskPage.expectTaskExists(taskName);
  });
});
