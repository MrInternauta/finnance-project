import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Category } from '../entities/category.entity';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryRepo: jest.Mocked<Repository<Category>>;

  const clientRequester = { userId: 7, isAdmin: false };
  const adminRequester = { userId: 1, isAdmin: true };

  beforeEach(async () => {
    categoryRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
    } as unknown as jest.Mocked<Repository<Category>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoriesService, { provide: getRepositoryToken(Category), useValue: categoryRepo }],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('findVisible returns defaults plus the requester own categories, unpaginated', async () => {
    categoryRepo.find.mockResolvedValue([]);
    await service.findVisible({ limit: 10, offset: 0 }, 7);
    const arg = categoryRepo.find.mock.calls[0][0] as any;
    expect(arg.where).toHaveLength(2);
    expect(arg.where[1].user.id).toBe(7);
    expect(arg.take).toBeUndefined();
    expect(arg.skip).toBeUndefined();
  });

  it('findOneVisible throws NotFound for another user category', async () => {
    categoryRepo.findOne.mockResolvedValue(null);
    await expect(service.findOneVisible(1, 99)).rejects.toThrow(NotFoundException);
  });

  it('create rejects a name that matches a default category (case-insensitive)', async () => {
    categoryRepo.find.mockResolvedValue([{ id: 2, name: 'COMIDA', user: null } as Category]);
    await expect(service.create({ name: 'comida' }, clientRequester)).rejects.toThrow(BadRequestException);
  });

  it('name clash check escapes LIKE wildcards (% does not match everything)', async () => {
    categoryRepo.find.mockResolvedValue([]);
    categoryRepo.create.mockImplementation(c => c as Category);
    categoryRepo.save.mockImplementation(async c => c as Category);

    const result = await service.create({ name: '%' }, clientRequester);

    expect(result).toBeDefined();
    const arg = categoryRepo.find.mock.calls[0][0] as any;
    expect(arg.where[0].name.value).toBe('\\%');
  });

  it('client create assigns the category to the requester', async () => {
    categoryRepo.find.mockResolvedValue([]);
    categoryRepo.create.mockImplementation(c => c as Category);
    categoryRepo.save.mockImplementation(async c => c as Category);

    const result = await service.create({ name: 'Mascotas' }, clientRequester);

    expect(result.user).toEqual({ id: 7 });
  });

  it('admin create makes a global default (user null)', async () => {
    categoryRepo.find.mockResolvedValue([]);
    categoryRepo.create.mockImplementation(c => c as Category);
    categoryRepo.save.mockImplementation(async c => c as Category);

    const result = await service.create({ name: 'Nueva default' }, adminRequester);

    expect(result.user).toBeNull();
  });

  it('client cannot update a default category (403)', async () => {
    categoryRepo.findOne.mockResolvedValue({ id: 1, name: 'COMIDA', user: null } as Category);
    await expect(service.update(1, { name: 'X' }, clientRequester)).rejects.toThrow(ForbiddenException);
  });

  it('client cannot update another user category (404)', async () => {
    categoryRepo.findOne.mockResolvedValue({ id: 1, name: 'A', user: { id: 5 } } as Category);
    await expect(service.update(1, { name: 'X' }, clientRequester)).rejects.toThrow(NotFoundException);
  });

  it('admin cannot update another user category (404)', async () => {
    categoryRepo.findOne.mockResolvedValue({ id: 1, name: 'A', user: { id: 5 } } as Category);
    await expect(service.update(1, { name: 'X' }, adminRequester)).rejects.toThrow(NotFoundException);
  });

  it('client updates their own category', async () => {
    const existing = { id: 9, name: 'A', user: { id: 7 } } as Category;
    categoryRepo.findOne.mockResolvedValue(existing);
    categoryRepo.find.mockResolvedValue([]);
    categoryRepo.merge.mockImplementation((c, ch) => Object.assign(c, ch) as Category);
    categoryRepo.save.mockImplementation(async c => c as Category);

    const result = await service.update(9, { name: 'Renamed' }, clientRequester);
    expect(result.name).toBe('Renamed');
  });

  it('assertUsableBy rejects another user category', async () => {
    categoryRepo.findOne.mockResolvedValue({ id: 1, user: { id: 5 } } as Category);
    await expect(service.assertUsableBy(1, 7)).rejects.toThrow('Invalid category');
  });

  it('assertUsableBy allows defaults and own categories', async () => {
    categoryRepo.findOne.mockResolvedValue({ id: 1, user: null } as Category);
    await expect(service.assertUsableBy(1, 7)).resolves.toBeDefined();

    categoryRepo.findOne.mockResolvedValue({ id: 2, user: { id: 7 } } as Category);
    await expect(service.assertUsableBy(2, 7)).resolves.toBeDefined();
  });
});
