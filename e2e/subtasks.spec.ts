import { test, expect } from '@playwright/test';
import { TaskPage } from './pages/task-page';

test.describe('Subtasks E2E', () => {
  let taskPage: TaskPage;

  test.beforeEach(async ({ page }) => {
    taskPage = new TaskPage(page);
    await taskPage.goto();
    await taskPage.waitForLoad();
  });

  test('debe añadir subtareas en TaskEditPanel', async () => {
    const taskName = `Tarea con subtareas ${Date.now()}`;
    
    await taskPage.createTask(taskName, 'Tarea principal');
    await taskPage.page.waitForTimeout(500);
    
    await taskPage.editTask(taskName);
    await taskPage.expectEditPanelOpen();
    
    const subtasksSection = taskPage.page.locator('text=Subtareas');
    await expect(subtasksSection).toBeVisible();
    
    const addButton = taskPage.page.locator('button:has-text("+ Añadir subtarea")');
    await expect(addButton).toBeVisible();
    await addButton.click();
    
    const subtaskInput = taskPage.page.locator('input[placeholder="Nombre de la subtarea..."]');
    await expect(subtaskInput).toBeVisible();
    await subtaskInput.fill('Subtarea 1');
    
    const confirmButton = taskPage.page.locator('button:has-text("✓")');
    await confirmButton.click();
    await taskPage.page.waitForTimeout(300);
    
    const subtask1 = taskPage.page.locator('text=Subtarea 1');
    await expect(subtask1).toBeVisible();
    
    await addButton.click();
    await subtaskInput.fill('Subtarea 2');
    await confirmButton.click();
    await taskPage.page.waitForTimeout(300);
    
    await expect(taskPage.page.locator('text=Subtarea 1')).toBeVisible();
    await expect(taskPage.page.locator('text=Subtarea 2')).toBeVisible();
    
    const progressText = taskPage.page.locator('text=0/2 completadas');
    await expect(progressText).toBeVisible();
    
    await taskPage.cancelEditPanel();
  });

  test('debe marcar todas las subtareas y auto-completar tarea en Kanban', async () => {
    const taskName = `Auto-completar ${Date.now()}`;
    
    await taskPage.createTask(taskName);
    await taskPage.page.waitForTimeout(500);
    
    await taskPage.expectTaskInColumn(taskName, 'backlog');
    
    await taskPage.editTask(taskName);
    await taskPage.expectEditPanelOpen();
    
    const addButton = taskPage.page.locator('button:has-text("+ Añadir subtarea")');
    const subtaskInput = taskPage.page.locator('input[placeholder="Nombre de la subtarea..."]');
    const confirmButton = taskPage.page.locator('button:has-text("✓")');
    
    await addButton.click();
    await subtaskInput.fill('Paso 1');
    await confirmButton.click();
    await taskPage.page.waitForTimeout(300);
    
    await addButton.click();
    await subtaskInput.fill('Paso 2');
    await confirmButton.click();
    await taskPage.page.waitForTimeout(300);
    
    await expect(taskPage.page.locator('text=0/2 completadas')).toBeVisible();
    
    const checkbox1 = taskPage.page.locator('text=Paso 1').locator('..').locator('input[type="checkbox"]');
    await checkbox1.check();
    await taskPage.page.waitForTimeout(300);
    
    await expect(taskPage.page.locator('text=1/2 completadas')).toBeVisible();
    
    await taskPage.cancelEditPanel();
    await taskPage.page.waitForTimeout(300);
    await taskPage.expectTaskInColumn(taskName, 'backlog');
    
    await taskPage.editTask(taskName);
    await taskPage.expectEditPanelOpen();
    
    const checkbox2 = taskPage.page.locator('text=Paso 2').locator('..').locator('input[type="checkbox"]');
    await checkbox2.check();
    await taskPage.page.waitForTimeout(500);
    
    await expect(taskPage.page.locator('text=2/2 completadas')).toBeVisible();
    
    await taskPage.cancelEditPanel();
    await taskPage.page.waitForTimeout(500);
    
    await taskPage.expectTaskInColumn(taskName, 'done');
    
    const taskCard = taskPage.getTaskCard(taskName);
    const taskCheckbox = taskCard.locator('input[type="checkbox"]');
    await expect(taskCheckbox).toBeChecked();
  });
TEST PART
