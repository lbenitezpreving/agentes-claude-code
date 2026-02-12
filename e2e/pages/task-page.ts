import { Page, Locator, expect } from '@playwright/test';

export class TaskPage {
  readonly page: Page;
  readonly header: Locator;
  readonly taskNameInput: Locator;
  readonly taskDescInput: Locator;
  readonly projectSelect: Locator;
  readonly submitButton: Locator;
  readonly taskList: Locator;
  readonly loadingIndicator: Locator;
  readonly emptyMessage: Locator;
  readonly errorMessage: Locator;
  readonly editPanel: Locator;
  readonly editPanelNameInput: Locator;
  readonly editPanelDescInput: Locator;
  readonly editPanelProjectSelect: Locator;
  readonly editPanelSaveButton: Locator;
  readonly editPanelCancelButton: Locator;
  readonly editPanelCloseButton: Locator;
  readonly backlogColumn: Locator;
  readonly doingColumn: Locator;
  readonly doneColumn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('h1');
    this.taskNameInput = page.locator('input[placeholder="Nueva tarea..."]');
    this.taskDescInput = page.locator('input[placeholder*="Descripcion"]');
    this.projectSelect = page.locator('form select');
    this.submitButton = page.locator('button[type="submit"]');
    this.taskList = page.locator('ul');
    this.loadingIndicator = page.getByText('Cargando tareas...');
    this.emptyMessage = page.getByText('No hay tareas');
    this.errorMessage = page.locator('[class*="error"]');
    this.editPanel = page.locator('[class*="panel"]');
    this.editPanelNameInput = page.locator('#task-name');
    this.editPanelDescInput = page.locator('#task-description');
    this.editPanelProjectSelect = page.locator('#task-project');
    this.editPanelSaveButton = page.getByRole('button', { name: 'Guardar' });
    this.editPanelCancelButton = page.getByRole('button', { name: 'Cancelar' });
    this.editPanelCloseButton = page.locator('[aria-label="Cerrar panel"]');
    this.backlogColumn = page.locator('[data-column="backlog"]');
    this.doingColumn = page.locator('[data-column="doing"]');
    this.doneColumn = page.locator('[data-column="done"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async waitForLoad() {
    await expect(this.header).toBeVisible();
    await expect(this.loadingIndicator).not.toBeVisible({ timeout: 10000 });
  }

  async createTask(name: string, description?: string, projectName?: string) {
    await this.taskNameInput.fill(name);
    if (description) {
      await this.taskDescInput.fill(description);
    }
    if (projectName) {
      await this.projectSelect.selectOption({ label: projectName });
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

  getTaskEditButton(taskName: string): Locator {
    return this.getTaskItem(taskName).locator('button[aria-label*="Editar"]');
  }

  getTaskProjectBadge(taskName: string): Locator {
    return this.getTaskItem(taskName).locator('[class*="projectBadge"]');
  }

  async toggleTask(taskName: string) {
    await this.getTaskCheckbox(taskName).click();
  }

  async deleteTask(taskName: string) {
    await this.getTaskDeleteButton(taskName).click();
  }

  async editTask(taskName: string) {
    await this.getTaskEditButton(taskName).click();
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

  async expectTaskHasProject(taskName: string, projectName: string) {
    const badge = this.getTaskProjectBadge(taskName);
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText(projectName);
  }

  async expectTaskHasNoProject(taskName: string) {
    const badge = this.getTaskProjectBadge(taskName);
    await expect(badge).not.toBeVisible();
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

  async expectEditPanelOpen() {
    await expect(this.editPanel).toBeVisible();
  }

  async expectEditPanelClosed() {
    await expect(this.editPanel).not.toBeVisible();
  }

  async fillEditPanel(name?: string, description?: string, projectName?: string) {
    if (name !== undefined) {
      await this.editPanelNameInput.fill(name);
    }
    if (description !== undefined) {
      await this.editPanelDescInput.fill(description);
    }
    if (projectName !== undefined) {
      if (projectName === '') {
        await this.editPanelProjectSelect.selectOption({ value: '' });
      } else {
        await this.editPanelProjectSelect.selectOption({ label: projectName });
      }
    }
  }

  async saveEditPanel() {
    await this.editPanelSaveButton.click();
  }

  async cancelEditPanel() {
    await this.editPanelCancelButton.click();
  }

  async closeEditPanel() {
    await this.editPanelCloseButton.click();
  }

  async dragTaskToColumn(taskName: string, targetStatus: 'backlog' | 'doing' | 'done') {
    // Buscar la tarjeta por su nombre
    const card = this.page.locator('[data-testid="task-card"]').filter({ hasText: taskName });

    // Determinar columna destino
    let targetColumn: Locator;
    if (targetStatus === 'backlog') targetColumn = this.backlogColumn;
    else if (targetStatus === 'doing') targetColumn = this.doingColumn;
    else targetColumn = this.doneColumn;

    // Simular drag and drop
    await card.dragTo(targetColumn);
  }

  async expectTaskInColumn(taskName: string, expectedStatus: 'backlog' | 'doing' | 'done') {
    let column: Locator;
    if (expectedStatus === 'backlog') column = this.backlogColumn;
    else if (expectedStatus === 'doing') column = this.doingColumn;
    else column = this.doneColumn;

    // Verificar que la tarjeta está en la columna esperada
    const card = column.locator('[data-testid="task-card"]').filter({ hasText: taskName });
    await expect(card).toBeVisible();
  }

  getTaskCard(taskName: string): Locator {
    return this.page.locator('[data-testid="task-card"]').filter({ hasText: taskName });
  }

  async expectColumnTaskCount(status: 'backlog' | 'doing' | 'done', expectedCount: number) {
    let column: Locator;
    if (status === 'backlog') column = this.backlogColumn;
    else if (status === 'doing') column = this.doingColumn;
    else column = this.doneColumn;

    const cards = column.locator('[data-testid="task-card"]');
    await expect(cards).toHaveCount(expectedCount);
  }
}
