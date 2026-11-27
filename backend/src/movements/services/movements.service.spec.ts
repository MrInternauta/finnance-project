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

  beforeEach(async () => {
    productRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
    } as unknown as jest.Mocked<Repository<Product>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovementsService,
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: CategoriesService, useValue: { findById: jest.fn() } },
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

    expect(productRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user: { id: 7 }, name: 'Coffee', category: { id: 3 } },
      })
    );
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
});
