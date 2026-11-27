import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BudgetsController } from './controllers/budgets.controller';
import { CategoriesController } from './controllers/categories.controller';
import { MovementsController } from './controllers/movements.controller';
import { Budget } from './entities/budget.entity';
import { Category } from './entities/category.entity';
import { Product } from './entities/movement.entity';
import { BudgetsService } from './services/budgets.service';
import { CategoriesService } from './services/categories.service';
import { MovementsService } from './services/movements.service';

@Module({
  providers: [MovementsService, CategoriesService, BudgetsService],
  imports: [TypeOrmModule.forFeature([Product, Category, Budget])],
  exports: [MovementsService, CategoriesService, BudgetsService],
  controllers: [MovementsController, CategoriesController, BudgetsController],
})
export class MovementsModule {}
