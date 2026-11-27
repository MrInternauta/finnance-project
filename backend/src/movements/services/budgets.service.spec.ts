import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Budget } from '../entities/budget.entity';
import { Product } from '../entities/movement.entity';
import { BudgetsService } from './budgets.service';
import { CategoriesService } from './categories.service';

describe('BudgetsService', () => {
  let service: BudgetsService;
  let budgetRepo: jest.Mocked<Repository<Budget>>;
  let productRepo: jest.Mocked<Repository<Product>>;
  let categoriesService: { assertUsableBy: jest.Mock };
  let spentQb: any;

  beforeEach(async () => {
    spentQb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };
    budgetRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as unknown as jest.Mocked<Repository<Budget>>;
    productRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(spentQb),
    } as unknown as jest.Mocked<Repository<Product>>;
    categoriesService = { assertUsableBy: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        { provide: getRepositoryToken(Budget), useValue: budgetRepo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: CategoriesService, useValue: categoriesService },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
  });

  it('findAll returns budgets with spent and remaining per category', async () => {
    budgetRepo.find.mockResolvedValue([
      { id: 1, amount: 500, category: { id: 3, name: 'COMIDA' } },
      { id: 2, amount: 100, category: { id: 4, name: 'TRANSPORTE' } },
    ] as Budget[]);
    spentQb.getRawMany.mockResolvedValue([{ categoryId: 3, spent: '250.5' }]);

    const budgets = await service.findAll(7, new Date('2026-01-01'), new Date('2026-01-31'));

    expect(budgets[0]).toEqual({
      id: 1,
      category: { id: 3, name: 'COMIDA' },
      amount: 500,
      spent: 250.5,
      remaining: 249.5,
    });
    expect(budgets[1]).toEqual({
      id: 2,
      category: { id: 4, name: 'TRANSPORTE' },
      amount: 100,
      spent: 0,
      remaining: 100,
    });
    // expenses only
    expect(spentQb.andWhere).toHaveBeenCalledWith('movement.income = false');
  });

  it('create validates the category and rejects a duplicate', async () => {
    categoriesService.assertUsableBy.mockResolvedValue({ id: 3 });
    budgetRepo.findOne.mockResolvedValue({ id: 9 } as Budget);

    await expect(service.create({ categoryId: 3, amount: 100 }, 7)).rejects.toThrow(BadRequestException);
    expect(budgetRepo.save).not.toHaveBeenCalled();
  });

  it('create stores the budget for the requester', async () => {
    categoriesService.assertUsableBy.mockResolvedValue({ id: 3 });
    budgetRepo.findOne.mockResolvedValue(null);
    budgetRepo.create.mockImplementation(b => b as Budget);
    budgetRepo.save.mockImplementation(async b => b as Budget);

    const budget = await service.create({ categoryId: 3, amount: 200 }, 7);

    expect(categoriesService.assertUsableBy).toHaveBeenCalledWith(3, 7);
    expect(budget.user).toEqual({ id: 7 });
    expect(budget.amount).toBe(200);
  });

  it('update throws NotFound for another user budget', async () => {
    budgetRepo.findOne.mockResolvedValue(null);

    await expect(service.update(1, { amount: 300 }, 99)).rejects.toThrow(NotFoundException);
    expect(budgetRepo.save).not.toHaveBeenCalled();
  });

  it('remove throws NotFound for another user budget', async () => {
    budgetRepo.findOne.mockResolvedValue(null);

    await expect(service.remove(1, 99)).rejects.toThrow(NotFoundException);
    expect(budgetRepo.softDelete).not.toHaveBeenCalled();
  });
});
