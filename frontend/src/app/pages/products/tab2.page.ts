import { Component, OnDestroy, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { ChartConfiguration } from 'chart.js';
import { Subscription } from 'rxjs';

import { ModalInfoService } from '../../core/services/modal.service';
import { BudgetItem, CategoryItemResponse, MonthSummary } from '../dashboard/models';
import { ProductsFilterDto } from '../dashboard/models/productFilter.dto';
import { WorkoutService } from '../dashboard/services/workout.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
})
export class Tab2Page implements OnInit, OnDestroy {
  public period: '6months' | '12months' | 'year' = '6months';
  public months: MonthSummary[] = [];
  public budgets: BudgetItem[] = [];
  public categories: CategoryItemResponse[] = [];
  private subscription$?: Subscription;

  public barChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
    },
  };
  public barChartType = 'bar' as const;

  constructor(
    private workoutService: WorkoutService,
    private alertController: AlertController,
    private modalInfoService: ModalInfoService
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  ngOnDestroy(): void {
    this.subscription$?.unsubscribe();
  }

  onPeriodChange(event: any) {
    this.period = event?.detail?.value || '6months';
    this.reload();
  }

  private periodRange(): { from?: string; to?: string } {
    const now = new Date();
    const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    switch (this.period) {
      case '12months':
        return {
          from: new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString(),
          to: endOfDay(now).toISOString(),
        };
      case 'year':
        return { from: new Date(now.getFullYear(), 0, 1).toISOString(), to: endOfDay(now).toISOString() };
      case '6months':
      default:
        return {
          from: new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString(),
          to: endOfDay(now).toISOString(),
        };
    }
  }

  reload() {
    const params: ProductsFilterDto = this.periodRange();
    this.subscription$?.unsubscribe();
    this.subscription$ = new Subscription();
    this.subscription$.add(
      this.workoutService.getMonthlySummary(params).subscribe(res => {
        this.months = res?.months || [];
        this.barChartData = {
          labels: this.months.map(item => item.month),
          datasets: [
            { data: this.months.map(item => item.income), label: 'Ingresos', backgroundColor: '#22c55e' },
            { data: this.months.map(item => item.expense), label: 'Gastos', backgroundColor: '#dc2626' },
          ],
        };
      })
    );
    this.subscription$.add(
      this.workoutService.getBudgets(params).subscribe(res => {
        this.budgets = res?.budgets || [];
      })
    );
    this.subscription$.add(
      this.workoutService.getCategories().subscribe(res => {
        this.categories = res?.categories || [];
      })
    );
  }

  budgetPercent(budget: BudgetItem): number {
    if (!budget.amount) {
      return 0;
    }
    return Math.min(Math.round((budget.spent / budget.amount) * 100), 100);
  }

  budgetColor(budget: BudgetItem): string {
    return budget.spent > budget.amount ? 'danger' : 'primary';
  }

  exportCsv() {
    const params = this.periodRange();
    this.workoutService.exportCsv(params).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `movimientos-${params.from?.slice(0, 10)}-${params.to?.slice(0, 10)}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.modalInfoService.error('No se pudo exportar el CSV', ''),
    });
  }

  async addBudget() {
    if (!this.categories.length) {
      this.modalInfoService.warning('Primero crea una categoría', '');
      return;
    }
    const picker = await this.alertController.create({
      header: 'Categoría',
      inputs: this.categories.map(category => ({
        type: 'radio',
        label: category.name,
        value: category.id,
      })),
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Siguiente',
          handler: categoryId => {
            if (categoryId) {
              this.promptBudgetAmount(amount => this.saveNewBudget(categoryId, amount));
            }
          },
        },
      ],
    });
    await picker.present();
  }

  async editBudget(budget: BudgetItem) {
    this.promptBudgetAmount(amount => this.saveBudgetAmount(budget.id, amount), budget.amount);
  }

  private async promptBudgetAmount(onAccept: (amount: number) => void, current?: number) {
    const alert = await this.alertController.create({
      header: 'Monto del presupuesto',
      inputs: [{ name: 'amount', type: 'number', placeholder: 'Monto', value: current }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: data => {
            const amount = Number(data?.amount);
            if (amount > 0) {
              onAccept(amount);
            }
          },
        },
      ],
    });
    await alert.present();
  }

  private saveNewBudget(categoryId: number, amount: number) {
    this.workoutService.postBudget(categoryId, amount).subscribe({
      next: () => this.reload(),
      error: err => this.modalInfoService.error(err?.error?.message || 'No se pudo crear el presupuesto', ''),
    });
  }

  private saveBudgetAmount(budgetId: number, amount: number) {
    this.workoutService.putBudget(budgetId, amount).subscribe({
      next: () => this.reload(),
      error: err => this.modalInfoService.error(err?.error?.message || 'No se pudo actualizar el presupuesto', ''),
    });
  }

  async deleteBudget(budget: BudgetItem) {
    const alert = await this.alertController.create({
      header: 'Eliminar presupuesto',
      message: `¿Eliminar el presupuesto de "${budget.category?.name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: () => {
            this.workoutService.deleteBudget(budget.id).subscribe({
              next: () => this.reload(),
              error: () => this.modalInfoService.error('No se pudo eliminar el presupuesto', ''),
            });
          },
        },
      ],
    });
    await alert.present();
  }
}
