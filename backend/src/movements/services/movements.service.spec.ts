import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Product } from '../entities/movement.entity';
import { CategoriesService } from './categories.service';
import { MovementsService } from './movements.service';

describe('MovementsService', () => {
  let service: MovementsService;
  let productRepo: jest.Mocked<Repository<Product>>;

  let qb: any;

  beforeEach(async () => {
    qb = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    };
    productRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as unknown as jest.Mocked<Repository<Product>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovementsService,
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: CategoriesService, useValue: { findById: jest.fn(), assertUsableBy: jest.fn() } },
      ],
    }).compile();

    service = module.get<MovementsService>(MovementsService);
  });

  it('findAll scopes results to the given user', async () => {
    productRepo.find.mockResolvedValue([]);

    await service.findAll({ limit: 10, offset: 0 } as any, 7);

    expect(productRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ user: { id: 7 } }),
      })
    );
  });

  it('findAll keeps name/category filters while scoping by user', async () => {
    productRepo.find.mockResolvedValue([]);

    await service.findAll({ limit: 10, offset: 0, name: 'Coffee', categoryId: 3 } as any, 7);

    const where = (productRepo.find.mock.calls[0][0] as any).where;
    expect(where.user).toEqual({ id: 7 });
    expect(where.category).toEqual({ id: 3 });
    expect(where.name._type).toBe('ilike');
    expect(where.name._value).toBe('%Coffee%');
  });

  it('findAll applies ILike partial match on name', async () => {
    productRepo.find.mockResolvedValue([]);

    await service.findAll({ limit: 10, offset: 0, name: 'cof' } as any, 7);

    const where = (productRepo.find.mock.calls[0][0] as any).where;
    expect(where.name).toBeDefined();
    expect(where.name._type).toBe('ilike');
    expect(where.name._value).toBe('%cof%');
  });

  it('findAll applies a Between date range when from and to are given', async () => {
    productRepo.find.mockResolvedValue([]);
    const from = new Date('2026-01-01');
    const to = new Date('2026-01-31');

    await service.findAll({ limit: 10, offset: 0, from, to } as any, 7);

    const where = (productRepo.find.mock.calls[0][0] as any).where;
    expect(where.date._type).toBe('between');
  });

  it('findAll filters by income flag', async () => {
    productRepo.find.mockResolvedValue([]);

    await service.findAll({ limit: 10, offset: 0, income: false } as any, 7);

    const where = (productRepo.find.mock.calls[0][0] as any).where;
    expect(where.income).toBe(false);
  });

  it('getSummary aggregates string sums and groups a null category', async () => {
    qb.getRawMany.mockResolvedValue([
      { categoryId: 1, name: 'COMIDA', income: '0', expense: '150.5' },
      { categoryId: 3, name: 'SUELDO', income: '1000', expense: '0' },
      { categoryId: null, name: null, income: '0', expense: '25' },
    ]);

    const summary = await service.getSummary(7, new Date('2026-01-01'), new Date('2026-01-31'));

    expect(qb.where).toHaveBeenCalledWith('movement.id_user = :userId', { userId: 7 });
    expect(qb.andWhere).toHaveBeenCalledTimes(2);
    expect(summary.income).toBe(1000);
    expect(summary.expense).toBe(175.5);
    expect(summary.balance).toBe(824.5);
    expect(summary.byCategory).toHaveLength(3);
    expect(summary.byCategory[2]).toEqual({ categoryId: null, name: 'Sin categoría', income: 0, expense: 25 });
  });

  it('getSummary returns zeros when there are no movements', async () => {
    qb.getRawMany.mockResolvedValue([]);

    const summary = await service.getSummary(7);

    expect(summary).toEqual({
      from: null,
      to: null,
      income: 0,
      expense: 0,
      balance: 0,
      byCategory: [],
    });
    expect(qb.andWhere).not.toHaveBeenCalled();
  });

  it('findOne throws NotFoundException for another user movement', async () => {
    productRepo.findOne.mockResolvedValue(null);

    await expect(service.findOne(1, 99)).rejects.toThrow(NotFoundException);
    expect(productRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1, user: { id: 99 } },
      })
    );
  });

  it('create sets the owner from the userId argument', async () => {
    const payload = { name: 'Coffee', date: new Date(), quantity: 5, income: false } as any;
    const created = { ...payload } as Product;
    productRepo.create.mockReturnValue(created);
    productRepo.save.mockImplementation(async p => p as Product);

    const result = await service.create(payload, 42);

    expect(productRepo.create).toHaveBeenCalledWith(payload);
    expect(result.user).toEqual({ id: 42 });
  });

  it('create allows duplicate names', async () => {
    const payload = { name: 'Coffee', date: new Date(), quantity: 5, income: false } as any;
    const created = { ...payload } as Product;
    productRepo.create.mockReturnValue(created);
    productRepo.save.mockImplementation(async p => p as Product);

    await expect(service.create(payload, 42)).resolves.toBeDefined();
    await expect(service.create(payload, 42)).resolves.toBeDefined();
  });

  it('remove throws NotFoundException for another user movement', async () => {
    productRepo.findOne.mockResolvedValue(null);

    await expect(service.remove(1, 99)).rejects.toThrow(NotFoundException);
    expect(productRepo.softDelete).not.toHaveBeenCalled();
  });

  it('restore looks the movement up including soft-deleted rows', async () => {
    productRepo.findOne.mockResolvedValue(null);

    await expect(service.restore(1, 7)).rejects.toThrow(NotFoundException);
    expect(productRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1, user: { id: 7 } },
        withDeleted: true,
      })
    );
  });

  it('getMonthlySummary groups by month and coerces sums', async () => {
    qb.getRawMany.mockResolvedValue([
      { month: '2026-01-15', income: '1000.5', expense: '200' },
      { month: new Date(2026, 1, 10, 12), income: '0', expense: '50.25' },
    ]);

    const months = await service.getMonthlySummary(7, new Date('2026-01-01'), new Date('2026-12-31'));

    expect(months).toEqual([
      { month: '2026-01', income: 1000.5, expense: 200, balance: 800.5 },
      { month: '2026-02', income: 0, expense: 50.25, balance: -50.25 },
    ]);
    expect(qb.andWhere).toHaveBeenCalledTimes(2);
  });

  it('exportCsv scopes to the user and the date range', async () => {
    productRepo.find.mockResolvedValue([]);

    await service.exportCsv(7, new Date('2026-01-01'), new Date('2026-01-31'));

    const arg = productRepo.find.mock.calls[0][0] as any;
    expect(arg.where.user.id).toBe(7);
    expect(arg.where.date).toBeDefined();
    expect(arg.order).toEqual({ date: 'ASC' });
  });
});
