import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Chart, ChartConfiguration, ChartEvent, ChartType } from 'chart.js';
import { default as Annotation } from 'chartjs-plugin-annotation';
import { BaseChartDirective } from 'ng2-charts';
import { Subscription } from 'rxjs';

import { AppState } from '../../core/state/app.reducer';
import { ArticleItemResponse, MovementSummary } from './models';
import { ProductsFilterDto } from './models/productFilter.dto';
import { WorkoutService } from './services/workout.service';
import { loadDashboard } from './state/workout.actions';
import { selectMovements, selectSummary } from './state/workout.selector';

type PeriodKey = 'month' | 'lastMonth' | '3months' | 'year';
type IncomeFilter = 'all' | 'income' | 'expense';

const DOUGHNUT_COLORS = [
  '#dc2626',
  '#e11d48',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#16a34a',
  '#0ea5e9',
  '#6366f1',
  '#a855f7',
  '#64748b',
];

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
})
export class Tab1Page implements OnInit, OnDestroy {
  public historyWorkout: ArticleItemResponse[] = [];
  public summary: MovementSummary | null = null;
  public period: PeriodKey = 'month';
  public incomeFilter: IncomeFilter = 'all';
  private subscription$ = new Subscription();

  constructor(
    public router: Router,
    public activatedRoute: ActivatedRoute,
    public readonly productService: WorkoutService,
    private store: Store<AppState>
  ) {
    Chart.register(Annotation);
  }

  public lineChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [],
        label: 'Ingresos',
        yAxisID: 'y1',
        backgroundColor: 'rgba(22,163,74,0.3)',
        borderColor: '#16a34a',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(148,159,177,0.8)',
        fill: 'origin',
      },
      {
        data: [],
        label: 'Gastos',
        yAxisID: 'y1',
        backgroundColor: 'rgba(220,38,38,0.3)',
        borderColor: '#dc2626',
        pointBackgroundColor: 'rgba(148,159,177,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(148,159,177,0.8)',
        fill: 'origin',
      },
    ],
    labels: [],
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    scales: {
      y: {
        position: 'left',
      },
      y1: {
        position: 'right',
        grid: {
          color: 'rgba(0,0,0,0)',
        },
        ticks: {
          color: 'red',
        },
      },
    },
  };

  public lineChartType: ChartType = 'line';

  public doughnutChartData: ChartConfiguration<'doughnut'>['data'] = {
    datasets: [
      {
        data: [],
        backgroundColor: DOUGHNUT_COLORS,
      },
    ],
    labels: [],
  };
  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    plugins: {
      legend: { position: 'bottom' },
    },
  };
  public doughnutChartType = 'doughnut' as const;

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  ngOnInit(): void {
    this.subscription$.add(
      this.store.select(selectMovements).subscribe(movements => {
        this.historyWorkout = movements || [];
        this.lineChartData.datasets[0].data = this.historyWorkout.map(item => (item.income ? item.quantity : 0));
        this.lineChartData.datasets[1].data = this.historyWorkout.map(item => (!item.income ? item.quantity : 0));
        this.lineChartData.labels = this.historyWorkout.map(item => {
          const date = new Date(item.date);
          return `${date.getDate()}/${date.getMonth() + 1}`;
        });
      })
    );

    this.subscription$.add(
      this.store.select(selectSummary).subscribe(summary => {
        this.summary = summary;
        const expenses = (summary?.byCategory || []).filter(item => item.expense > 0);
        this.doughnutChartData = {
          datasets: [
            {
              data: expenses.map(item => item.expense),
              backgroundColor: DOUGHNUT_COLORS,
            },
          ],
          labels: expenses.map(item => item.name),
        };
      })
    );

    this.reload();
  }

  ngOnDestroy(): void {
    this.subscription$.unsubscribe();
    this.historyWorkout = [];
  }

  get totalIncome(): number {
    return (
      this.summary?.income ??
      (this.historyWorkout.reduce((acc, item) => (item.income ? acc + item.quantity : acc), 0) || 0)
    );
  }
  get totalOutcome(): number {
    return (
      this.summary?.expense ??
      (this.historyWorkout.reduce((acc, item) => (!item.income ? acc + item.quantity : acc), 0) || 0)
    );
  }
  get balance(): number {
    return this.summary?.balance ?? this.totalIncome - this.totalOutcome;
  }
  get hasExpenseByCategory(): boolean {
    return (this.summary?.byCategory || []).some(item => item.expense > 0);
  }

  onPeriodChange(event: any) {
    this.period = event?.detail?.value || 'month';
    this.reload();
  }

  onIncomeFilterChange(event: any) {
    this.incomeFilter = event?.detail?.value || 'all';
    this.reload();
  }

  private periodRange(): { from?: string; to?: string } {
    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    switch (this.period) {
      case 'lastMonth': {
        const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const last = new Date(now.getFullYear(), now.getMonth(), 0);
        return { from: startOfDay(first).toISOString(), to: endOfDay(last).toISOString() };
      }
      case '3months': {
        const first = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        return { from: startOfDay(first).toISOString(), to: endOfDay(now).toISOString() };
      }
      case 'year': {
        return { from: new Date(now.getFullYear(), 0, 1).toISOString(), to: endOfDay(now).toISOString() };
      }
      case 'month':
      default: {
        return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), to: endOfDay(now).toISOString() };
      }
    }
  }

  reload() {
    const params: ProductsFilterDto = { ...this.periodRange(), limit: 500 };
    if (this.incomeFilter !== 'all') {
      params.income = this.incomeFilter === 'income';
    }
    this.store.dispatch(loadDashboard({ params }));
  }

  // events
  public chartClicked({ event, active }: { event?: ChartEvent; active?: object[] }): void {
    console.log(event, active);
  }

  public chartHovered({ event, active }: { event?: ChartEvent; active?: object[] }): void {
    console.log(event, active);
  }

  public onItemClicked(item: ArticleItemResponse): void {
    this.productService.product = item;
    this.router.navigate(['tabs', 'tab1', 'detail']);
  }
}
