import { test, expect } from '@playwright/test';
import { TaskPage } from './pages/task-page';

test.describe('Accesibilidad Basica', () => {
  let taskPage: TaskPage;

  test.beforeEach(async ({ page }) => {
    taskPage = new TaskPage(page);
    await taskPage.goto();
    await taskPage.waitForLoad();
  });

  test('el formulario debe ser navegable con teclado', async ({ page }) => {
    // Focus en el primer input
    await taskPage.taskNameInput.focus();
    await expect(taskPage.taskNameInput).toBeFocused();

    // Tab al siguiente input
    await page.keyboard.press('Tab');
    await expect(taskPage.taskDescInput).toBeFocused();

    // Tab al boton
    await page.keyboard.press('Tab');
    await expect(taskPage.submitButton).toBeFocused();
  });

  test('debe poder crear tarea con Enter', async ({ page }) => {
    const taskName = `Tarea Enter ${Date.now()}`;

    await taskPage.taskNameInput.fill(taskName);
    await page.keyboard.press('Enter');

    await taskPage.expectTaskExists(taskName);
  });

  test('los botones de eliminar deben tener aria-label', async ({ page }) => {
    const taskName = `Tarea Accesible ${Date.now()}`;
    await taskPage.createTask(taskName);

    const deleteButton = taskPage.getTaskDeleteButton(taskName);
    const ariaLabel = await deleteButton.getAttribute('aria-label');

    expect(ariaLabel).toContain('Eliminar');
    expect(ariaLabel).toContain(taskName);
  });

  test('los checkboxes deben ser accesibles', async ({ page }) => {
    const taskName = `Checkbox Test ${Date.now()}`;
    await taskPage.createTask(taskName);

    const checkbox = taskPage.getTaskCheckbox(taskName);

    // Verificar que es interactuable
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toBeEnabled();

    // Verificar que se puede hacer click
    await checkbox.click();
    await expect(checkbox).toBeChecked();
  });

  test('debe tener estructura semantica correcta', async ({ page }) => {
    // Verificar header principal
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toBeVisible();

    // Verificar que hay un main o contenedor principal
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Verificar que el formulario existe
    const form = page.locator('form');
    await expect(form).toBeVisible();
  });

  test('los inputs deben tener placeholders descriptivos', async () => {
    const namePlaceholder = await taskPage.taskNameInput.getAttribute('placeholder');
    const descPlaceholder = await taskPage.taskDescInput.getAttribute('placeholder');

    expect(namePlaceholder).toBeTruthy();
    expect(descPlaceholder).toBeTruthy();
    expect(descPlaceholder?.toLowerCase()).toContain('opcional');
  });
});

test.describe('Contraste y Visibilidad', () => {
  test('el boton de submit debe ser visible y distinguible', async ({ page }) => {
    const taskPage = new TaskPage(page);
    await taskPage.goto();
    await taskPage.waitForLoad();

    await expect(taskPage.submitButton).toBeVisible();
    await expect(taskPage.submitButton).toHaveText('Agregar');
  });

  test('las tareas completadas deben diferenciarse visualmente', async ({ page }) => {
    const taskPage = new TaskPage(page);
    await taskPage.goto();
    await taskPage.waitForLoad();

    const taskName = `Visual Test ${Date.now()}`;
    await taskPage.createTask(taskName);

    const taskItem = taskPage.getTaskItem(taskName);
    const checkbox = taskPage.getTaskCheckbox(taskName);

    // Verificar estado inicial
    await expect(checkbox).not.toBeChecked();

    await taskPage.toggleTask(taskName);

    // Verificar que el checkbox cambia de estado
    await expect(checkbox).toBeChecked();

    // Verificar que la clase del item contiene 'completed'
    await expect(taskItem).toHaveClass(/completed/);
  });
});
