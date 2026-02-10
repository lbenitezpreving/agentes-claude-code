import { Page, Locator, expect } from '@playwright/test';

export class TaskPage {
  readonly page: Page;
  readonly header: Locator;
  readonly taskNameInput: Locator;
  readonly taskDescInput: Locator;
  readonly submitButton: Locator;
  readonly taskList: Locator;
  readonly loadingIndicator: Locator;
  readonly emptyMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('h1');
    this.taskNameInput = page.locator('input[placeholder="Nueva tarea..."]');
    this.taskDescInput = page.locator('input[placeholder*="Descripcion"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.taskList = page.locator('ul');
    this.loadingIndicator = page.getByText('Cargando tareas...');
    this.emptyMessage = page.getByText('No hay tareas');
    this.errorMessage = page.locator('[class*="error"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async waitForLoad() {
    await expect(this.header).toBeVisible();
    await expect(this.loadingIndicator).not.toBeVisible({ timeout: 10000 });
  }

  async createTask(name: string, description?: string) {
    await this.taskNameInput.fill(name);
    if (description) {
      await this.taskDescInput.fill(description);
    }
    await this.submitButton.click();
  }

  getTaskItem(taskName: string): Locator {
    return this.page.locator('li').filter({ hasText: taskName });
  }

  getTaskCheckbox(taskName: string): Locator {
    return this.getTaskItem(taskName).locator('input[type="checkbox"]');
  }

  getTaskDeleteButton(taskName: string): Locator {
    return this.getTaskItem(taskName).locator('button[aria-label*="Eliminar"]');
  }

  async toggleTask(taskName: string) {
    await this.getTaskCheckbox(taskName).click();
  }

  async deleteTask(taskName: string) {
    await this.getTaskDeleteButton(taskName).click();
  }

  async expectTaskExists(taskName: string) {
    await expect(this.getTaskItem(taskName)).toBeVisible();
  }

  async expectTaskNotExists(taskName: string) {
    await expect(this.getTaskItem(taskName)).not.toBeVisible();
  }

  async expectTaskCompleted(taskName: string, completed: boolean) {
    const checkbox = this.getTaskCheckbox(taskName);
    if (completed) {
      await expect(checkbox).toBeChecked();
    } else {
      await expect(checkbox).not.toBeChecked();
    }
  }

  async getTaskCount(): Promise<number> {
    return this.page.locator('li').count();
  }

  getTaskCreatedDate(taskName: string): Locator {
    return this.getTaskItem(taskName).locator('text=/Creada el/');
  }

  getTaskCompletedDate(taskName: string): Locator {
    return this.getTaskItem(taskName).locator('text=/Completada el/');
  }

  async expectTaskHasCreatedDate(taskName: string) {
    await expect(this.getTaskCreatedDate(taskName)).toBeVisible();
  }

  async expectTaskHasCompletedDate(taskName: string, visible: boolean) {
    const completedDate = this.getTaskCompletedDate(taskName);
    if (visible) {
      await expect(completedDate).toBeVisible();
    } else {
      await expect(completedDate).not.toBeVisible();
    }
  }
}
