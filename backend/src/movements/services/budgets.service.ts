import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { CreateBudgetDto, UpdateBudgetDto } from '../dtos/budget.dto';
import { Budget } from '../entities/budget.entity';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/movement.entity';
import { CategoriesService } from './categories.service';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget) private budgetRepo: Repository<Budget>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    private categoryService: CategoriesService
  ) {}

  public async findAll(userId: number, from?: Date, to?: Date) {
    const budgets = await this.budgetRepo.find({
      relations: ['category'],
      where: { user: { id: userId } },
      order: { id: 'ASC' },
    });

    const spentQb = this.productRepo
      .createQueryBuilder('movement')
      .select('movement.id_category', 'categoryId')
      .addSelect('COALESCE(SUM(movement.quantity), 0)', 'spent')
      .where('movement.id_user = :userId', { userId })
      .andWhere('movement.income = false')
      .andWhere('movement.id_category IS NOT NULL')
      .groupBy('movement.id_category');

    if (from) {
      spentQb.andWhere('movement.date >= :from', { from });
    }
    if (to) {
      spentQb.andWhere('movement.date <= :to', { to });
    }

    const spentRows: Array<{ categoryId: number; spent: string }> = await spentQb.getRawMany();
    const spentByCategory = new Map(spentRows.map(row => [row.categoryId, Number(row.spent) || 0]));

    return budgets.map(budget => {
      const spent = spentByCategory.get(budget.category?.id) ?? 0;
      return {
        id: budget.id,
        category: budget.category ? { id: budget.category.id, name: budget.category.name } : null,
        amount: Number(budget.amount),
        spent,
        remaining: Number(budget.amount) - spent,
      };
    });
  }

  public async create(payload: CreateBudgetDto, userId: number) {
    const category = await this.categoryService.assertUsableBy(payload.categoryId, userId);

    const existing = await this.budgetRepo.findOne({
      where: { user: { id: userId }, category: { id: payload.categoryId } },
    });
    if (existing) {
      throw new BadRequestException('A budget for this category already exists');
    }

    const budget = this.budgetRepo.create({
      amount: payload.amount,
      user: { id: userId } as User,
      category: { id: category.id } as Category,
    });
    return this.budgetRepo.save(budget);
  }

  public async update(id: number, changes: UpdateBudgetDto, userId: number) {
    const budget = await this.findOwned(id, userId);
    budget.amount = changes.amount;
    return this.budgetRepo.save(budget);
  }

  public async remove(id: number, userId: number) {
    await this.findOwned(id, userId);
    return this.budgetRepo.softDelete({ id });
  }

  private async findOwned(id: number, userId: number) {
    const budget = await this.budgetRepo.findOne({
      relations: ['category'],
      where: { id, user: { id: userId } },
    });
    if (!budget) {
      throw new NotFoundException(`Budget ${id} not found`);
    }
    return budget;
  }
}
