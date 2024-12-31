import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CategoriesController } from './controllers/categories.controller';
import { MovementsController } from './controllers/movements.controller';
import { Category } from './entities/category.entity';
import { Product } from './entities/movement.entity';
import { CategoriesService } from './services/categories.service';
import { MovementsService } from './services/movements.service';

@Module({
  providers: [MovementsService, CategoriesService],
  imports: [TypeOrmModule.forFeature([Product, Category])],
  exports: [MovementsService, CategoriesService],
  controllers: [MovementsController, CategoriesController],
})
export class MovementsModule {}
